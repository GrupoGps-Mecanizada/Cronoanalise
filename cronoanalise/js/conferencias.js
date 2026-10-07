// Conferências do Lançar: códigos válidos por folha e horários (bloqueios e avisos).
(function (raiz) {
  const Crono = raiz.Crono;
  const faixa = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const GERAIS = faixa(1, 29);
  Crono.CODIGOS_DA_FOLHA = {
    'AP-MOT': new Set([...GERAIS, 30, 31, 38, 65, 66, 68, 69]),
    'AP-OP': new Set([...GERAIS, ...faixa(30, 39)]),
    'AV-MOT': new Set([...GERAIS, 40, 41, ...faixa(45, 49), ...faixa(65, 69)]),
    'AV-OP': new Set([...GERAIS, ...faixa(40, 50)]),
    'HV-MOT': new Set([...GERAIS, 40, 41, ...faixa(45, 47), 49, ...faixa(65, 69)]),
    'HV-OP': new Set([...GERAIS, ...faixa(40, 47), 49, 50]),
    'AS-OP': new Set([...GERAIS, ...faixa(55, 64)])
  };
  const HHMM = /^[0-2]\d:[0-5]\d$/;

  // "07–17" (kit) → "07h às 17h" (formato da DEMO). Outros formatos ficam como estão.
  Crono.horarioPadrao = function (horario) {
    const m = /^\s*(\d{2})\s*[–-]\s*(\d{2})\s*$/.exec(horario || '');
    return m ? `${m[1]}h às ${m[2]}h` : (horario || '');
  };

  Crono.conferirLinhas = function (linhas, { modelo, horario }) {
    const bloqueios = [], avisos = [], validos = Crono.CODIGOS_DA_FOLHA[modelo];
    const tempos = linhas.map((l, i) => {
      const n = i + 1;
      if (l.cod == null || l.cod === '') bloqueios.push(`Linha ${n}: sem código.`);
      else if (validos && !validos.has(Number(l.cod))) bloqueios.push(`Linha ${n}: o código ${l.cod} não vale para esta folha.`);
      if (!HHMM.test(l.hi || '') || !HHMM.test(l.hf || '')) {
        bloqueios.push(`Linha ${n}: falta o início ou o fim.`);
        return null;
      }
      const ini = Crono.minutosDoDia(l.hi, horario); let fim = Crono.minutosDoDia(l.hf, horario);
      if (fim < ini) { if (ini >= 18 * 60 && fim + 1440 - ini <= 12 * 60) fim += 1440; else bloqueios.push(`Linha ${n}: fim antes do início.`); }
      return { ini, fim, n };
    });
    const comHora = tempos.filter(Boolean);
    for (let i = 1; i < comHora.length; i++) {
      const a = comHora[i - 1], b = comHora[i];
      if (b.ini < a.fim) bloqueios.push(`Linhas ${a.n} e ${b.n}: horários se sobrepõem.`);
      else if (b.ini > a.fim) avisos.push(`Entre a linha ${a.n} e a ${b.n} há um buraco de ${b.ini - a.fim} min.`);
    }
    return { bloqueios, avisos };
  };
  if (typeof module !== 'undefined') module.exports = Crono;
})(typeof window !== 'undefined' ? window : globalThis);
