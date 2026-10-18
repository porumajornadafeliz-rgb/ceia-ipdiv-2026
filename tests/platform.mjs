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
  getLastRow() { let n = this.rows.length; while (n && this.rows[n-1].every(v => v === '' || v === undefined)) n--; return n; }
  getMaxRows() { return this.maxRows; }
  insertRowsAfter(row, extra) { this.maxRows += extra; }
  setFrozenRows() {}
  copyTo(book) { const copy = book.insertSheet('Cópia de teste'); copy.rows = clone(this.rows); copy.maxRows = this.maxRows; return copy; }
  setName(name) { this.rename(name); return this; }
  getRange(row, col, height = 1, width = 1) {
    return {
      getValues: () => Array.from({ length: height }, (_, i) => Array.from({ length: width }, (_, j) => this.rows[row + i - 1]?.[col + j - 1] ?? '')),
      setValues: values => { for (let i = 0; i < height; i++) { this.rows[row + i - 1] ||= []; for (let j = 0; j < width; j++) this.rows[row + i - 1][col + j - 1] = values[i][j]; } },
      setValue: value => { this.rows[row - 1] ||= []; this.rows[row - 1][col - 1] = value; },
      clearContent: () => { for (let i=0;i<height;i++) for(let j=0;j<width;j++) { this.rows[row+i-1] ||= []; this.rows[row+i-1][col+j-1] = ''; } },
      setNumberFormat() {}
    };
  }
}
export function platform({ now = '2026-10-17T15:00:00Z', actor = 'tesouraria@example.test' } = {}) {
  let clock = new Date(now).getTime(), email = actor, lock = false;
  let publicUser = '', publicOwner = 'porumajornadafeliz@gmail.com';
  const sheets = new Map(), files = new Map();
  const cache = new Map();
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
    newBlob: (bytes, mime, name) => ({ getBytes: () => bytes, getContentType: () => mime, getName: () => name, mime, name }),
    base64EncodeWebSafe: bytes => Buffer.from(bytes).toString('base64').replaceAll('+', '-').replaceAll('/', '_')
  };
  const book = { getId: () => 'test-sheet', getUrl: () => 'https://docs.google.com/spreadsheets/d/test-sheet/edit',
    getSheetByName: name => sheets.get(name), insertSheet: name => { const s = new Sheet(); let currentName = name; s.rename = next => { if (sheets.has(next)) throw new Error('Nome de aba já existe.'); sheets.delete(currentName); currentName = next; sheets.set(next,s); }; sheets.set(name, s); return s; } };
  const publicContext = vm.createContext({ Date: Clock, console, Utilities: utilities,
    CacheService: { getScriptCache: () => ({
      get(key) { const item = cache.get(key); return item && item.until > clock ? item.value : null; },
      put(key, value, seconds) { cache.set(key, { value, until: clock + seconds * 1000 }); }
    }) },
    Session: { getActiveUser: () => ({ getEmail: () => publicUser }), getEffectiveUser: () => ({ getEmail: () => publicOwner }) },
    PropertiesService: { getScriptProperties: () => getProps(properties) },
    DriveApp: { Access: { PRIVATE: 'private' }, createFolder: () => ({ getId: () => 'test-folder' }), getFolderById: () => ({ getSharingAccess: () => sharedFolder ? 'public' : 'private', getEditors: () => [], getViewers: () => [], createFile: blob => { const id = randomUUID(); files.set(id, blob); return { getId: () => id, setTrashed: () => files.delete(id) }; } }), getFileById: id => ({ getBlob: () => { if (!files.has(id)) throw new Error('Arquivo não encontrado.'); return files.get(id); } }) },
    SpreadsheetApp: { openById: () => book, create: () => { createdSpreadsheets++; return book; }, flush() {} },
    LockService: { getScriptLock: () => ({ tryLock() { if (lock) return false; lock = true; return true; }, releaseLock() { lock = false; } }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ text, setMimeType() { return this; } }) }
  });
  for (const file of ['shared/Domain.gs', 'shared/Pix.gs', 'shared/Storage.gs', 'public/Config.gs', 'public/Public.gs', 'public/Payments.gs', 'public/Bridge.gs']) vm.runInContext(readFileSync(path.join(root, 'src', file), 'utf8'), publicContext, { filename: file });
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
    setPublicIdentity(user, owner = 'porumajornadafeliz@gmail.com') { publicUser = user; publicOwner = owner; },
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

export const proofFixture = { mime: 'application/pdf', data: Buffer.from('%PDF-1.4\nSynthetic receipt for tests only.\n%%EOF').toString('base64') };
export function pay(p, row) {
 const uploaded = p.publicApi('proof', { id:row.id, token:row.token, ...proofFixture });
 if (!uploaded.ok) throw new Error(uploaded.error);
 const old = p.adminApi('list').data?.actor.email;
 p.setActor('tesouraria@example.test');
 const version = p.adminApi('getProof', {id:row.id}).data.version;
 const response = p.adminApi('payment', { id:row.id, proofVersion:version, approved:true, note:'Comprovante conferido e recebimento verificado no teste' });
 if (old) p.setActor(old);
 if (!response.ok) throw new Error(response.error);
 return response.data;
}

export const proofVersion = (p,r) => p.adminApi('getProof', {id:r.id}).data?.version;
