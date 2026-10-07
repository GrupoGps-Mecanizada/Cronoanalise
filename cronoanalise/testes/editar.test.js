const assert = require('assert');
require('../js/config.js');
const { editar } = require('../js/editar.js');

const regs = Array.from({ length: 120 }, (_, i) => ({ seq: i + 1, data: '2026-10-01', nome: i === 7 ? 'Carlos Andrade' : 'Outro', vaga: 'AP-01' }));
// busca sem diferenciar maiúsculas
assert.deepStrictEqual(editar.filtrar(regs, 'carlos').map(r => r.seq), [8]);
assert.strictEqual(editar.filtrar(regs, '').length, 120);
// páginas de 50
const p3 = editar.paginar(regs, 3, 50);
assert.strictEqual(p3.linhas.length, 20); assert.strictEqual(p3.total, 3); assert.strictEqual(p3.pagina, 3);
assert.strictEqual(editar.paginar(regs, 9, 50).pagina, 3);      // página além do fim volta para a última
assert.strictEqual(editar.paginar([], 1, 50).total, 1);
// editar não apaga kit/folha/E-A/supervisor que o formulário não mostra
const original = { seq: 5, kit: 'CR-0002', folha: 'CR-0002-OP1', execAux: 'E', supervisor: 'Ozias', obs: 'x', nome: 'A' };
const novo = editar.mesclar(original, { nome: 'B', obs: null });
assert.deepStrictEqual([novo.kit, novo.folha, novo.execAux, novo.supervisor, novo.nome, novo.obs], ['CR-0002', 'CR-0002-OP1', 'E', 'Ozias', 'B', null]);
assert.strictEqual(original.nome, 'A');                          // não altera o original
console.log('OK editar');
