const assert = require('assert');
require('../js/config.js'); require('../js/painel-calculo.js'); require('../js/conferencias.js');
const Crono = require('../js/resumo.js');
const seg = (startMin, endMin, cod) => ({ startMin, endMin, cod, desc: Crono.config.DESC[cod] });

// atividades seguidas do mesmo grupo viram um bloco só
const blocos = Crono.blocosSimples([seg(0, 10, 6), seg(10, 30, 14), seg(30, 90, 66), seg(90, 100, 66), seg(100, 130, 29), seg(140, 150, 3)]);
assert.deepStrictEqual(blocos.map(b => [b.grupo.chave, b.startMin, b.endMin, b.itens.length]),
  [['seguranca', 0, 30, 2], ['operacao', 30, 100, 2], ['esperas', 100, 130, 1], ['logistica', 140, 150, 1]]);
// rótulos em palavras simples
assert.strictEqual(blocos[1].grupo.rotulo, 'Trabalhando');
assert.strictEqual(Crono.config.grupoDe(29).rotulo, 'Parado esperando');
// semáforo do placar
assert.strictEqual(Crono.corDoPlacar(55), 'verde');
assert.strictEqual(Crono.corDoPlacar(35), 'amarelo');
assert.strictEqual(Crono.corDoPlacar(10), 'vermelho');
assert.strictEqual(Crono.corDoPlacar(null), 'neutro');
console.log('OK blocos');
