const assert = require('assert');
require('../js/config.js'); require('../js/painel-calculo.js');
const Crono = require('../js/conferencias.js');
const ctx = { modelo: 'AP-OP', horario: '07h às 17h' };
const ok = Crono.conferirLinhas([{ hi: '07:00', hf: '07:20', cod: 6 }, { hi: '07:20', hf: '08:00', cod: 32 }], ctx);
assert.deepStrictEqual(ok, { bloqueios: [], avisos: [] });
assert.match(Crono.conferirLinhas([{ hi: '07:00', hf: '07:20', cod: null }], ctx).bloqueios[0], /sem código/);
assert.match(Crono.conferirLinhas([{ hi: '07:00', hf: '07:20', cod: 42 }], ctx).bloqueios[0], /não vale/);
assert.match(Crono.conferirLinhas([{ hi: '08:00', hf: '07:00', cod: 6 }], ctx).bloqueios[0], /fim antes do início/);
assert.match(Crono.conferirLinhas([{ hi: '07:00', hf: '08:00', cod: 6 }, { hi: '07:30', hf: '09:00', cod: 32 }], ctx).bloqueios[0], /sobrep/);
assert.match(Crono.conferirLinhas([{ hi: '07:00', hf: '07:20', cod: 6 }, { hi: '07:40', hf: '08:00', cod: 32 }], ctx).avisos[0], /buraco/);
// noturno: 23:30 → 00:30 é válido
assert.deepStrictEqual(Crono.conferirLinhas([{ hi: '23:30', hf: '00:30', cod: 6 }], { modelo: 'AP-OP', horario: '19h às 07h' }).bloqueios, []);
// linha sem horário bloqueia
assert.match(Crono.conferirLinhas([{ hi: '', hf: '07:20', cod: 6 }], ctx).bloqueios[0], /falta o início ou o fim/);
// horário do kit (07–17) vira o formato da DEMO (07h às 17h)
assert.strictEqual(Crono.horarioPadrao('07–17'), '07h às 17h');
assert.strictEqual(Crono.horarioPadrao('19-07'), '19h às 07h');
assert.strictEqual(Crono.horarioPadrao('07h às 17h'), '07h às 17h');
assert.strictEqual(Crono.horarioPadrao(''), '');
console.log('OK conferencias');
