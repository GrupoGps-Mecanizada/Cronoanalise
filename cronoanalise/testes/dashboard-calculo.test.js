const assert = require('assert');
require('../js/config.js'); require('../js/painel-calculo.js');
const Crono = require('../js/dashboard-calculo.js');
const { DESC, classe } = Crono.config;
const D = Crono.dashboard;

const r = (papel, hi, hf, cod, extra) => Object.assign({ data: '2026-10-07', turno: 'A', horario: '19h às 07h', area: 'X',
  nome: papel, papel, placa: null, vaga: 'AP-08', equip: 'Alta Pressão', hi, hf, cod,
  desc: cod == null ? null : DESC[cod], cls: cod == null ? null : classe(cod), obs: null,
  kit: 'CR-0003', folha: 'CR-0003-X', supervisor: 'Ozias' }, extra);

const regs = [
  r('Motorista', '19:00', '20:00', 66),                   // 1h produzindo
  r('Motorista', '20:00', '21:30', 29, { obs: 'aguardando área' }), // 1,5h improdutivo
  r('Motorista', '23:30', '00:30', 3),                    // cruza a meia-noite: 1h necessário
  r('Operador 1', '19:30', '21:00', 32),                  // 1,5h produzindo
  r('Operador 2', '21:00', '21:30', null),                // 0,5h sem código
  r('Motorista', '07:00', '09:00', 66, { data: '2026-10-08', turno: 'B', horario: '07h às 19h', kit: 'CR-0005', equip: 'Vácuo', vaga: 'AV-08', supervisor: 'Matusalém' })
];

// 1) período: virada da meia-noite e duração
assert.strictEqual(D.periodo(regs[2]).h, 1);

// 2) resumo geral
const g = D.resumoGeral(regs);
assert.strictEqual(g.horas, 7.5);
assert.strictEqual(g.porCls.Produzindo, 4.5);
assert.strictEqual(g.porCls[D.SEM_COD], 0.5);
assert.strictEqual(g.equipes, 2);
assert.strictEqual(g.dias, 2);
assert.strictEqual(Math.round(g.pctProd), 64);            // 4,5 / 7 classificadas
assert.strictEqual(g.porPapel.Operador.horas, 2);

// 3) filtros
assert.strictEqual(D.filtrar(regs, { de: '2026-10-08' }).length, 1);
assert.strictEqual(D.filtrar(regs, { papel: 'Operador' }).length, 2);
assert.strictEqual(D.filtrar(regs, { cls: D.SEM_COD }).length, 1);
assert.strictEqual(D.filtrar(regs, { cod: 66 }).length, 2);
assert.strictEqual(D.filtrar(regs, { supervisor: 'Ozias', equip: 'Alta Pressão' }).length, 5);
const op = D.opcoesFiltro(regs);
assert.deepStrictEqual([op.de, op.ate], ['2026-10-07', '2026-10-08']);
assert.deepStrictEqual(op.supervisores, ['Matusalém', 'Ozias']);

// 4) por dia
const dias = D.porDia(regs);
assert.deepStrictEqual(dias.map(d => d.data), ['2026-10-07', '2026-10-08']);
assert.strictEqual(dias[1].Motorista.pctProd, 100);
assert.strictEqual(dias[1].Operador.pctProd, null);

// 5) atividades: ordenadas por horas, sem código agrupado, observações guardadas
const top = D.topAtividades(regs, 10);
assert.strictEqual(top[0].cod, 66);
assert.strictEqual(top[0].h, 3);
assert.strictEqual(top[0].equipes, 2);
const c29 = top.find(a => a.cod === 29);
assert.strictEqual(c29.obs[0].texto, 'aguardando área');
assert.ok(top.some(a => a.cod === null && a.desc === D.SEM_COD));

// 6) hora do turno: 19:30–21:00 vira 30 min na 19h e 60 min na 20h
const ph = D.porHora([regs[3]]);
const em = h => ph.Operador[ph.horas.indexOf(h)].horas;
assert.strictEqual(em(19), 0.5);
assert.strictEqual(em(20), 1);
assert.strictEqual(em(21), 0);
assert.strictEqual(ph.horas[0], 7);
// a soma das horas fatiadas bate com o total
const somaHoras = D.porHora(regs).Geral.reduce((a, x) => a + x.horas, 0);
assert.strictEqual(Math.round(somaHoras * 100) / 100, 7.5);

// 7) ranking de equipes: maior % produzindo primeiro
const rk = D.rankingEquipes(regs);
assert.strictEqual(rk[0].kit, 'CR-0005');
assert.strictEqual(rk[1].horas, 5.5);
assert.deepStrictEqual(rk[1].nomes.sort(), ['Motorista', 'Operador 1', 'Operador 2']);

// 8) por equipamento
const pe = D.porEquipamento(regs);
assert.deepStrictEqual(pe.map(e => e.equip), ['Alta Pressão', 'Vácuo']);
assert.strictEqual(pe[0].Operador.pctProd, 100);

// 9) achados: aponta a maior perda, a hora e o sem código
const ac = D.achados(regs);
assert.ok(ac.find(a => a.tipo === 'perda').texto.includes('Aguardando Cliente/Usiminas'));
assert.deepStrictEqual(ac.find(a => a.tipo === 'perda').filtro, { cod: 29 });
assert.ok(ac.some(a => a.tipo === 'hora'));
assert.ok(ac.some(a => a.tipo === 'aviso'));
assert.deepStrictEqual(D.achados([]), []);

console.log('dashboard-calculo: ok');
