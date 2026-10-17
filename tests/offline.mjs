import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'], headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, offline: true });
  const page = await context.newPage(), errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('request', req => requests.push(req.url()));
  // A política do Chromium deste ambiente bloqueia URLs file://.
  // Carregar o mesmo HTML completo, sem servidor e com toda a rede desativada.
  const html = await readFile('entrega/ABRIR-DEMONSTRACAO.html', 'utf8');
  async function loadDemo() { await page.goto('about:blank'); await page.setContent(html); }
  await loadDemo();
  const registration = page.frameLocator('#registration-app'), admin = page.frameLocator('#app');
  await registration.getByRole('button', { name: 'FAZER MINHA INSCRIÇÃO' }).waitFor();
  assert.ok(await registration.getByRole('img', { name: 'Igreja Presbiteriana de Divinópolis', exact: true }).evaluate(img => img.complete && img.naturalWidth > 0));
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/demonstracao-desktop.png', fullPage: true });
  await registration.getByRole('button', { name: 'FAZER MINHA INSCRIÇÃO' }).click();
  await registration.getByLabel('Nome do responsável', { exact: true }).fill('Família de Teste');
  await registration.getByLabel('WhatsApp com DDD', { exact: true }).fill('37999991234');
  await registration.locator('#plus-adultGuests').click();
  await registration.getByRole('button', { name: 'CONFERIR INSCRIÇÃO' }).click();
  assert.match(await registration.locator('#review-summary').innerText(), /200,00/);
  await registration.getByRole('button', { name: 'CONFIRMAR E PAGAR COM PIX' }).click();
  await registration.locator('#qr svg').waitFor();
  const id = await registration.locator('#registration-id').innerText();
  const qrImage = PNG.sync.read(await registration.locator('#qr').screenshot());
  const qrData = jsQR(new Uint8ClampedArray(qrImage.data), qrImage.width, qrImage.height)?.data;
  assert.equal(qrData, 'DEMONSTRACAO IPDIV 2026 - SEM VALIDADE PARA PAGAMENTO');
  await registration.getByRole('button', { name: 'JÁ FIZ O PIX' }).click();
  await registration.getByText('Aviso recebido. Aguarde a conferência bancária pela tesouraria.').waitFor();
  assert.equal(await registration.locator('#payment-status').innerText(), 'AGUARDANDO CONFIRMAÇÃO');
  await page.getByRole('button', { name: '2. TESOURARIA', exact: true }).click();
  await admin.getByLabel('Pesquisar inscrição').fill('Familia de Teste');
  await admin.getByRole('button', { name: 'CONFIRMAR PAGAMENTO', exact: true }).click();
  await admin.getByLabel('Referência do recebimento no extrato do Itaú').fill('Conferência fictícia para análise');
  await admin.locator('#submit-action').click(); await admin.getByText('PAGO', { exact: true }).waitFor();
  await page.getByRole('button', { name: '1. INSCRIÇÃO', exact: true }).click();
  await registration.getByRole('button', { name: 'Atualizar situação do pagamento' }).click();
  await registration.getByText('Sua presença está confirmada.').waitFor();
  await page.getByRole('button', { name: '3. ENTRADA', exact: true }).click();
  await admin.getByLabel('Pesquisar inscrição').fill('Familia de Teste');
  await admin.getByRole('button', { name: 'CONFIRMAR ENTRADA', exact: true }).click();
  await admin.getByText('ENTRADA REGISTRADA', { exact: true }).waitFor();
  const duplicate = await page.evaluate(id => ceiaOfflineApi('admin', 'entry', { id }, 'door'), id);
  assert.equal(duplicate.ok, false); assert.match(duplicate.error, /já registrada/);
  await admin.getByLabel('Pesquisar inscrição').fill('João Pereira');
  await admin.getByText('Aguarde a tesouraria', { exact: true }).waitFor();
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.getByRole('button', { name: '1. INSCRIÇÃO', exact: true }).click();
  await page.screenshot({ path: 'test-results/demonstracao-mobile.png', fullPage: true });
  assert.ok(requests.every(url => /^(file:|data:|about:)/.test(url)), 'Nenhuma requisição de rede');
  assert.deepEqual(errors, [], 'Nenhum erro JavaScript');
  await loadDemo(); await registration.getByRole('button', { name: 'FAZER MINHA INSCRIÇÃO' }).waitFor();
  await page.getByRole('button', { name: '2. TESOURARIA', exact: true }).click();
  await admin.getByLabel('Pesquisar inscrição').fill('Família de Teste');
  await admin.getByText('Nenhuma inscrição encontrada.', { exact: true }).waitFor();
  console.log('HTML autônomo aprovado com a rede desativada: logotipo, inscrição, total, QR sem pagamento válido, aviso, tesouraria, retorno à consulta, entrada, bloqueios, responsividade e descarte ao recarregar.');
} finally { await browser.close(); }
