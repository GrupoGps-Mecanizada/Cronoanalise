const assert = require('assert');
globalThis.Crono = { esc: t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) };
require('../js/config.js'); const { banco } = require('../js/banco.js');
const linha = { id: 7, data: '2026-10-01', descricao: 'DDS', exec_aux: 'E', obs: '<img src=x onerror=alert(1)>', cod: 6, ficticio: true };
const r = banco.paraDemo(linha);
assert.strictEqual(r.seq, 7); assert.strictEqual(r.desc, 'DDS'); assert.strictEqual(r.execAux, 'E');
assert.deepStrictEqual(banco.paraBanco(r).descricao, 'DDS');
assert.ok(!('seq' in banco.paraBanco(r)) && !('id' in banco.paraBanco(r)));
assert.strictEqual(banco.paraBanco(r).ficticio, true);
assert.strictEqual(banco.escaparRegistro(r).obs, '&lt;img src=x onerror=alert(1)&gt;');
assert.strictEqual(banco.escaparRegistro(r).cod, 6);
// campos vazios viram null (o banco recusa '' em turno e E/A)
const vazio = banco.paraBanco({ data: '2026-10-01', turno: '', execAux: '', cod: '', papel: 'Motorista', equip: 'Vácuo', hi: '07:00', hf: '08:00' });
assert.strictEqual(vazio.turno, null); assert.strictEqual(vazio.exec_aux, null); assert.strictEqual(vazio.cod, null);
assert.strictEqual(banco.paraBanco({ cod: '12' }).cod, 12);
console.log('OK banco');
