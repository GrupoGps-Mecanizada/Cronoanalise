// Configuração única da Cronoanálise: banco (só chave pública), códigos e equipamentos.
// Códigos e classificação copiados de gerar_demo.py (fonte da DEMO).
(function (raiz) {
  const PROD = 'Produzindo', NEC = 'Improdutivo necessário', IMP = 'Improdutivo';
  const DESC = {
    1: "Atividade (outra – descrever)",
    2: "Bater Ponto",
    3: "Trajeto (Bica/Área/Vest./Garagem)",
    4: "Café",
    5: "Almoço / Refeição",
    6: "DDS",
    7: "Preparação / Sinalização",
    8: "Isolamento",
    9: "Descarte de Resíduos",
    10: "PPT / ART",
    11: "Documentação / Fechamento",
    12: "Abastec. / Carreg. de Água",
    13: "Bloqueio",
    14: "Checklist",
    15: "Retirada de Bloqueio",
    16: "Desmobilização",
    17: "Troca de Turno",
    18: "Recolhimento de Ferramentas",
    19: "Banho",
    20: "Pausa de Segurança",
    21: "Deslocamento p/ Centro de Controle",
    22: "Espera / Aguardando DDS",
    23: "Aguardando Liberação da Área",
    24: "Crachá Bloqueado",
    25: "Programação Incompleta",
    26: "Aguardando Bloqueio",
    27: "Manutenção",
    28: "Aguardando Operador",
    29: "Aguardando Cliente/Usiminas",
    30: "Montagem de mangueiras, engates e laços",
    31: "Içamento e amarração de mangueira",
    32: "Hidrojateamento – Pistola",
    33: "Hidrojateamento – Torpedo",
    34: "Hidrojateamento – Rabicho",
    35: "Hidrojateamento – Vareta",
    36: "Hidrojateamento – Pistola cano longo",
    37: "Auxílio ao colega (pedal, mangueira, vigia)",
    38: "Recolhimento de mangueiras e implementos",
    39: "Troca de bico / o-ring / ajuste",
    40: "Retirada e posicionamento de mangotes",
    41: "Içamento e fixação de mangote",
    42: "Sucção / aspiração de resíduo",
    43: "Direcionar material ao mangote (pá, água)",
    44: "Desobstrução de mangote / válvula",
    45: "Descarga por válvula (gravidade)",
    46: "Basculamento do tanque",
    47: "Limpeza de válvulas e bocais",
    48: "Esvaziamento do depurador / tanquinho",
    49: "Recolhimento de mangotes",
    50: "Auxílio ao colega (sinalização, mangote)",
    55: "Ligar cabo 440V no painel",
    56: "Instalação de mangotes",
    57: "Sucção de resíduo",
    58: "Içamento de caçamba e máquina",
    59: "Descarregamento na baía de resíduos",
    60: "Limpeza da caçamba",
    61: "Limpeza do filtro",
    62: "Recolhimento de mangotes e cabo",
    63: "Desobstrução de mangote",
    64: "Auxílio ao colega",
    65: "Manobra / posicionamento do caminhão",
    66: "Operação do motor estacionário / bomba (RPM)",
    67: "Viagem de descarte (ida e volta)",
    68: "Aguardando no caminhão (sem operação)",
    69: "Abastecimento de combustível"
  };
  const PRODUZINDO = new Set([1, 32, 33, 34, 35, 36, 37, 42, 43, 50, 57, 64, 66]);
  const IMPRODUTIVO = new Set([22, 23, 24, 25, 26, 27, 28, 29, 44, 63, 68]);
  // Grupos de atividade (modo "Atividades" da linha do tempo e Resumo da equipe).
  // Cada código pertence a um grupo só; o grupo segue a classificação do código.
  const faixa = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const GRUPOS = [
    { chave: 'operacao', nome: 'Operação', rotulo: 'Trabalhando', cls: PROD, cor: '#1F9D55',
      codigos: [1, 32, 33, 34, 35, 36, 37, 42, 43, 50, 57, 64, 66] },
    { chave: 'preparacao', nome: 'Preparação e apoio', rotulo: 'Preparando', cls: NEC, cor: '#2F6FB2',
      codigos: [7, 8, 13, 15, 16, 18, 30, 31, 38, 39, 40, 41, ...faixa(45, 49), 55, 56, ...faixa(58, 62), 65] },
    { chave: 'seguranca', nome: 'Segurança e documentação', rotulo: 'Segurança', cls: NEC, cor: '#7B5CC4', codigos: [6, 10, 11, 14, 20] },
    { chave: 'logistica', nome: 'Logística (trajeto, abastecimento, descarte)', rotulo: 'Deslocando', cls: NEC, cor: '#C98A12', codigos: [3, 9, 12, 21, 67, 69] },
    { chave: 'pausas', nome: 'Pausas e pessoal', rotulo: 'Pausa', cls: NEC, cor: '#7A8794', codigos: [2, 4, 5, 17, 19] },
    { chave: 'esperas', nome: 'Esperas e perdas', rotulo: 'Parado esperando', cls: IMP, cor: '#C8372D', codigos: [...faixa(22, 29), 44, 63, 68] }
  ];
  const OUTROS = { chave: 'outros', nome: 'Sem código', rotulo: 'Sem código', cls: null, cor: '#9AA5B1', codigos: [] };
  const grupoPorCodigo = new Map(GRUPOS.flatMap(g => g.codigos.map(c => [c, g])));

  const config = {
    SUPABASE_URL: 'https://mfsyrsegkvjmefcdaegh.supabase.co',
    SUPABASE_CHAVE: 'sb_publishable_rw878qLgcmUdixI8QsejBA_lSXYAsIv',
    CLS_ORDER: [PROD, NEC, IMP],
    DESC,
    GRUPOS,
    // Placar "tempo trabalhando": verde a partir de 50%, amarelo de 30% a 49%, vermelho abaixo de 30%.
    PLACAR: { verde: 50, amarelo: 30 },
    grupoDe: cod => grupoPorCodigo.get(Number(cod)) || OUTROS,
    classe: cod => PRODUZINDO.has(Number(cod)) ? PROD : IMPRODUTIVO.has(Number(cod)) ? IMP : NEC,
    EQUIP: {
      ap: { nome: 'Alta Pressão', chave: 'alta_pressao', label: 'Alta Pressão', slots: 10, papeis: ['MOT', 'OP1', 'OP2'] },
      av: { nome: 'Vácuo', chave: 'auto_vacuo', label: 'Auto Vácuo', slots: 8, papeis: ['MOT', 'OP1'] },
      hv: { nome: 'Hiper Vácuo', chave: 'hiper_vacuo', label: 'Hiper Vácuo', slots: 4, papeis: ['MOT', 'OP1', 'OP2'] },
      as: { nome: 'Aspirador de Pó', chave: 'aspirador', label: 'Aspirador', slots: 10, papeis: ['OP1', 'OP2'] }
    },
    PAPEL_NOME: { MOT: 'Motorista', OP1: 'Operador 1', OP2: 'Operador 2' },
    TURNOS: ['A', 'B', 'C', 'D', 'ADM', '16 Horas'],
    SUPERVISORES: [
      { nome: 'Ozias',          turno: 'A' },
      { nome: 'Matusalém',      turno: 'B' },
      { nome: 'Israel',         turno: 'C' },
      { nome: 'Fábio',          turno: 'D' },
      { nome: 'Júnior Pereira', turno: 'ADM' },
      { nome: 'Genésio',        turno: 'ADM' },
      { nome: 'Donizete',       turno: 'ADM' }
    ]
  };
  raiz.Crono = Object.assign(raiz.Crono || {}, { config });
  if (typeof module !== 'undefined') module.exports = raiz.Crono;
})(typeof window !== 'undefined' ? window : globalThis);
