const assert = require('assert');
require('../js/config.js'); require('../js/painel-calculo.js'); require('../js/conferencias.js');
const { lancar } = require('../js/lancar.js');

const folha = { id: 'CR-0002-OP1', modelo: 'AV-OP', papel: 'OP1', kit_id: 2 };
const kit = { codigo: 'CR-0002', tipo: 'av', vaga: 'AV-03', placa: 'ABC1234', area: 'Alto Forno 3' };
const cab = { nome: 'Carlos', data: '2026-10-07', turno: 'A', horario: '07–17', supervisor: 'Ozias' };
const regs = lancar.montarRegistros(folha, kit, cab, [
  { hi: '07:00', hf: '07:20', cod: '6', execAux: '', obs: '' },
  { hi: '07:20', hf: '08:00', cod: '42', execAux: 'E', obs: 'ok' }
]);
assert.strictEqual(regs.length, 2);
assert.deepStrictEqual(
  [regs[0].papel, regs[0].equip, regs[0].horario, regs[0].vaga, regs[0].placa, regs[0].kit, regs[0].folha, regs[0].area],
  ['Operador 1', 'Vácuo', '07h às 17h', 'AV-03', 'ABC1234', 'CR-0002', 'CR-0002-OP1', 'Alto Forno 3']);
assert.deepStrictEqual([regs[0].cod, regs[0].desc, regs[0].cls, regs[0].execAux, regs[0].obs], [6, 'DDS', 'Improdutivo necessário', null, null]);
assert.deepStrictEqual([regs[1].cod, regs[1].cls, regs[1].execAux, regs[1].obs], [42, 'Produzindo', 'E', 'ok']);
// primeira hora sugerida a partir do horário do turno
assert.strictEqual(lancar.horaInicial('07h às 17h'), '07:00');
assert.strictEqual(lancar.horaInicial('19–07'), '19:00');
assert.strictEqual(lancar.horaInicial(''), '');
assert.strictEqual(regs[0].supervisor, 'Ozias');
// supervisor sugerido pelo turno (só quando há um único supervisor naquele turno)
assert.strictEqual(lancar.supervisorDoTurno('B'), 'Matusalém');
assert.strictEqual(lancar.supervisorDoTurno('ADM'), '');
assert.strictEqual(lancar.supervisorDoTurno(''), '');
console.log('OK lancar');
