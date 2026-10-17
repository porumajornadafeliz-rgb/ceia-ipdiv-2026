import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

export async function checkReceiptPdf(download, expected = []) {
  assert.match(download.suggestedFilename(), /^IPD26[A-F0-9]{16}\.pdf$/);
  const path = await download.path(), bytes = await readFile(path);
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  const text = execFileSync('pdftotext', ['-layout', path, '-'], { encoding: 'utf8' });
  for (const pattern of expected) assert.match(text, pattern);
  assert.match(text, /Não é comprovante de\s+pagamento/);
  assert.match(text, /Consultar minha inscrição/);
  // Decodificador independente verifica a geometria do PDF efetivamente baixado.
  const bounds = execFileSync('pdftotext', ['-bbox', path, '-'], { encoding: 'utf8' });
  assert.match(bounds, /<page width="420\.000000" height="900\.000000"/);
  for (const word of bounds.matchAll(/<word xMin="([\d.-]+)" yMin="([\d.-]+)" xMax="([\d.-]+)" yMax="([\d.-]+)">([^<]*)<\/word>/g)) {
    const [, xMin, yMin, xMax, yMax] = word;
    assert.ok(+xMin >= 20 && +xMax <= 400 && +yMin >= 0 && +yMax <= 890, 'Texto dentro da página: ' + word[5]);
    if (word[5] === 'Participantes' || word[5] === 'Secretaria') assert.ok(+yMax - +yMin >= 16, 'Títulos legíveis no documento');
  }
  return { path, text, bytes };
}
