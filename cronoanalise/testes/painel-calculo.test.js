const assert = require('assert');
const path = require('path');
require('../js/config.js');
const Crono = require('../js/painel-calculo.js');
const ref = require(path.join(__dirname, 'referencia.json'));

function quase(a, b, onde) {
  if (typeof a === 'number' && typeof b === 'number') return assert.ok(Math.abs(a - b) < 0.011, `${onde}: ${a} != ${b}`);
  if (a === null || b === null || typeof a !== 'object') return assert.deepStrictEqual(a, b, onde);
  if (Array.isArray(a)) { assert.strictEqual(a.length, b.length, onde + '.length'); return a.forEach((x, i) => quase(x, b[i], `${onde}[${i}]`)); }
  assert.deepStrictEqual(Object.keys(a).sort(), Object.keys(b).sort(), onde + ' chaves');
  Object.keys(a).forEach(k => quase(a[k], b[k], `${onde}.${k}`));
}

// 1) igualdade com o Python
quase(Crono.calcularPainel(ref.registros), ref.painel, 'painel');

// 2) meia-noite
assert.strictEqual(Crono.minutosDoDia('01:00', '19h às 07h'), 25 * 60);
assert.strictEqual(Crono.minutosDoDia('20:00', '19h às 07h'), 20 * 60);
assert.strictEqual(Crono.minutosDoDia('00:10', '15h às 23h'), 24 * 60 + 10);
assert.strictEqual(Crono.minutosDoDia('08:00', '07h às 17h'), 8 * 60);
assert.strictEqual(Crono.minutosDoDia('08:00', ''), 8 * 60);

// 3) registros soltos não quebram
const solto = { data: '2026-10-01', turno: 'A', horario: '07h às 17h', area: 'X', nome: 'N', papel: 'Motorista',
  placa: null, vaga: 'sem numero', equip: 'Desconhecido', hi: '07:00', hf: '08:00', cod: 2, desc: 'Bater Ponto',
  cls: 'Improdutivo necessário', obs: null, kit: null, folha: null, execAux: null, supervisor: null };
const p = Crono.calcularPainel([solto]);
assert.strictEqual(p.timeline.overall.totalHoras, 1);
assert.strictEqual(p.timeline.crews.length, 1);
// 4) sem horário do turno: 23:00 → 01:00 vale 2 h
const virada = Object.assign({}, solto, { horario: '', hi: '23:00', hf: '01:00' });
assert.strictEqual(Crono.calcularPainel([virada]).timeline.overall.totalHoras, 2);
console.log('OK painel-calculo');
