/** Pix estático BR Code: EMV TLV ASCII + CRC16/CCITT-FALSE. Sem serviços externos. */
function pixField_(id, value) {
  if (value.length > 99 || /[^\x20-\x7e]/.test(value)) fail_('Campo Pix inválido.');
  return id + String(value.length).padStart(2, '0') + value;
}
function crc16_(text) {
  var crc = 0xffff;
  for (var i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (var bit = 0; bit < 8; bit++) crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
function pix_(cents, id) {
  if (!Number.isSafeInteger(cents) || cents < 1 || cents > 1200000 || !/^[a-zA-Z0-9]{1,25}$/.test(id)) fail_('Valor ou identificador Pix inválido.');
  var account = pixField_('00', 'br.gov.bcb.pix') + pixField_('01', '20896270000130');
  var payload = pixField_('00', '01') + pixField_('26', account) + pixField_('52', '0000') +
    pixField_('53', '986') + pixField_('54', (cents / 100).toFixed(2)) + pixField_('58', 'BR') +
    pixField_('59', 'IGREJA PRESB DIVINOPOLIS') + pixField_('60', 'DIVINOPOLIS') +
    pixField_('62', pixField_('05', id)) + '6304';
  return payload + crc16_(payload);
}
