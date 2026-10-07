const assert = require('assert');
require('../js/config.js'); require('../js/painel-calculo.js'); require('../js/conferencias.js');
const Crono = require('../js/resumo.js');
const { DESC, classe, GRUPOS, grupoDe } = Crono.config;

// 1) todo código tem exatamente um grupo, e o grupo combina com a classificação
Object.keys(DESC).map(Number).forEach(cod => {
  const donos = GRUPOS.filter(g => g.codigos.includes(cod));
  assert.strictEqual(donos.length, 1, `código ${cod} em ${donos.length} grupos`);
  assert.strictEqual(donos[0].cls, classe(cod), `código ${cod}: grupo ${donos[0].nome} x ${classe(cod)}`);
  assert.strictEqual(grupoDe(cod).chave, donos[0].chave);
});
assert.strictEqual(grupoDe(999).chave, 'outros');

// 2) resumo de uma equipe
const r = (papel, hi, hf, cod, extra) => Object.assign({ data: '2026-10-06', turno: 'C', horario: '19h às 07h', area: 'X',
  nome: papel === 'Motorista' ? 'Ana' : 'Bia', papel, placa: null, vaga: 'AV-08', equip: 'Vácuo', hi, hf, cod,
  desc: DESC[cod], cls: classe(cod), obs: null, kit: 'CR-1', folha: 'CR-1-' + (papel === 'Motorista' ? 'MOT' : 'OP1') }, extra);
const regs = [
  r('Motorista', '19:00', '20:00', 66), r('Motorista', '20:00', '21:30', 29), r('Motorista', '21:30', '22:00', 3),
  r('Operador 1', '19:00', '21:00', 42), r('Operador 1', '21:00', '21:30', 66), r('Operador 1', '21:30', '22:00', 5)
];
const crew = Crono.calcularPainel(regs).timeline.crews[0];
const res = Crono.resumoEquipe(crew);
assert.strictEqual(res.papeis.length, 2);
const mot = res.papeis.find(p => p.papel === 'Motorista');
assert.strictEqual(mot.porGrupo.esperas, 1.5); assert.strictEqual(mot.porGrupo.operacao, 1); assert.strictEqual(mot.porGrupo.logistica, 0.5);
assert.strictEqual(mot.total, 3);
assert.deepStrictEqual([res.maiorPerda.papel, res.maiorPerda.horas, res.maiorPerda.cod], ['Motorista', 1.5, 29]);
const op = res.papeis.find(p => p.papel === 'Operador 1');
assert.ok(Math.abs(op.pctProd - 100 * 2.5 / 3) < 0.01);
// 66 é código de motorista: na folha do operador vira alerta
assert.strictEqual(res.alertas.length, 1);
assert.match(res.alertas[0], /Operador 1.*66/);
// equipe sem esperas: sem "maior perda"
assert.strictEqual(Crono.resumoEquipe(Crono.calcularPainel([r('Motorista', '19:00', '20:00', 66)]).timeline.crews[0]).maiorPerda, null);
console.log('OK resumo');
