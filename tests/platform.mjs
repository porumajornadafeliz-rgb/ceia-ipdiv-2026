/** Simulador SOMENTE para testes locais. Não faz parte das implantações. */
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const clone = value => JSON.parse(JSON.stringify(value));
class Sheet {
  constructor() { this.rows = []; this.maxRows = 1000; }
  getLastRow() { return this.rows.length; }
  getMaxRows() { return this.maxRows; }
  insertRowsAfter(row, extra) { this.maxRows += extra; }
  setFrozenRows() {}
  getRange(row, col, height = 1, width = 1) {
    return {
      getValues: () => Array.from({ length: height }, (_, i) => Array.from({ length: width }, (_, j) => this.rows[row + i - 1]?.[col + j - 1] ?? '')),
      setValues: values => { for (let i = 0; i < height; i++) { this.rows[row + i - 1] ||= []; for (let j = 0; j < width; j++) this.rows[row + i - 1][col + j - 1] = values[i][j]; } },
      setValue: value => { this.rows[row - 1] ||= []; this.rows[row - 1][col - 1] = value; },
      setNumberFormat() {}
    };
  }
}
export function platform({ now = '2026-10-17T15:00:00Z', actor = 'tesouraria@example.test' } = {}) {
  let clock = new Date(now).getTime(), email = actor, lock = false;
  const sheets = new Map(), files = new Map();
  let sharedFolder = false, createdSpreadsheets = 0;
  const properties = { SPREADSHEET_ID: 'test-sheet', TOKEN_SECRET: 'test-secret-never-production', ADMIN_BRIDGE_SECRET: 'bridge-test-never-production', ADMIN_ACCOUNTS: JSON.stringify({ 'admin@example.test': 'admin', 'tesouraria@example.test': 'treasury', 'entrada@example.test': 'door' }) };
  const getProps = store => ({ getProperty: key => store[key] ?? null, setProperty: (key, value) => { store[key] = value; } });
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [clock])); } static now() { return clock; } }
  const utilities = {
    DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, getUuid: randomUUID,
    computeDigest: (alg, text) => [...createHash('sha256').update(text).digest()],
    computeHmacSha256Signature: (text, secret) => [...createHmac('sha256', secret).update(text).digest()],
    base64Decode: text => [...Buffer.from(text, 'base64')],
    base64Encode: bytes => Buffer.from(bytes).toString('base64'),
    newBlob: (bytes, mime, name) => ({ getBytes: () => bytes, mime, name }),
    base64EncodeWebSafe: bytes => Buffer.from(bytes).toString('base64').replaceAll('+', '-').replaceAll('/', '_')
  };
  const book = { getId: () => 'test-sheet', getUrl: () => 'https://docs.google.com/spreadsheets/d/test-sheet/edit',
    getSheetByName: name => sheets.get(name), insertSheet: name => { const s = new Sheet(); sheets.set(name, s); return s; } };
  const publicContext = vm.createContext({ Date: Clock, console, Utilities: utilities,
    PropertiesService: { getScriptProperties: () => getProps(properties) },
    DriveApp: { Access: { PRIVATE: 'private' }, createFolder: () => ({ getId: () => 'test-folder' }), getFolderById: () => ({ getSharingAccess: () => sharedFolder ? 'public' : 'private', getEditors: () => [], getViewers: () => [], createFile: blob => { const id = randomUUID(); files.set(id, blob); return { getId: () => id, setTrashed: () => files.delete(id) }; } }), getFileById: id => ({ getBlob: () => files.get(id) }) },
    SpreadsheetApp: { openById: () => book, create: () => { createdSpreadsheets++; return book; }, flush() {} },
    LockService: { getScriptLock: () => ({ tryLock() { if (lock) return false; lock = true; return true; }, releaseLock() { lock = false; } }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ text, setMimeType() { return this; } }) }
  });
  for (const file of ['shared/Domain.gs', 'shared/Pix.gs', 'shared/Storage.gs', 'public/Config.gs', 'public/Public.gs', 'public/Bridge.gs']) vm.runInContext(readFileSync(path.join(root, 'src', file), 'utf8'), publicContext, { filename: file });
  publicContext.initializePublic_();
  const adminProperties = { PUBLIC_WEB_APP_URL: 'https://script.google.com/macros/s/TEST/exec', ADMIN_BRIDGE_SECRET: properties.ADMIN_BRIDGE_SECRET };
  const adminContext = vm.createContext({ Date: Clock, console, Utilities: utilities,
    Session: { getActiveUser: () => ({ getEmail: () => email }) },
    PropertiesService: { getScriptProperties: () => getProps(adminProperties) },
    UrlFetchApp: { fetch: (url, options) => {
      const result = publicContext.doPost({ postData: { contents: options.payload } });
      return { getResponseCode: () => 200, getContentText: () => result.text };
    } }
  });
  vm.runInContext(readFileSync(path.join(root, 'src/shared/Domain.gs'), 'utf8'), adminContext);
  vm.runInContext(readFileSync(path.join(root, 'src/admin/Admin.gs'), 'utf8'), adminContext);
  return {
    public: publicContext, admin: adminContext, properties, adminProperties, sheets, files,
    createdSpreadsheets: () => createdSpreadsheets,
    shareFolder(value) { sharedFolder = value; },
    publicApi: (action, input) => clone(publicContext.publicApi(action, input)),
    adminApi: (action, input) => clone(adminContext.adminApi(action, input)),
    setActor(value) { email = value; }, setTime(value) { clock = new Date(value).getTime(); },
    signed(action, input, custom = {}) {
      const payload = JSON.stringify({ action, input, email, time: clock, nonce: randomUUID(), ...custom });
      return { payload, signature: utilities.base64EncodeWebSafe(utilities.computeHmacSha256Signature(payload, properties.ADMIN_BRIDGE_SECRET)) };
    },
    bridge(envelope) { return JSON.parse(publicContext.doPost({ postData: { contents: JSON.stringify(envelope) } }).text); },
    lock(value) { lock = value; }
  };
}
export function registration(overrides = {}) {
  return { name: 'José da Silva', phone: '(37) 99999-1234', requestId: randomUUID(), counts: { adultMembers: 1, childMembers: 0, spouse: 0, adultGuests: 0, childGuests: 0 }, ...overrides };
}
