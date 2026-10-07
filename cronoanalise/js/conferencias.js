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

  const minutos = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const DOZE_HORAS = 12 * 60;

  // As linhas da folha são lidas em sequência: cada início é contado a partir do fim da linha anterior,
  // então a virada da meia-noite (23:50 → 00:20) não depende do horário do turno.
  Crono.conferirLinhas = function (linhas, { modelo }) {
    const bloqueios = [], avisos = [], validos = Crono.CODIGOS_DA_FOLHA[modelo];
    let anterior = null;
    linhas.forEach((l, i) => {
      const n = i + 1;
      if (l.cod == null || l.cod === '') bloqueios.push(`Linha ${n}: sem código.`);
      else if (validos && !validos.has(Number(l.cod))) bloqueios.push(`Linha ${n}: o código ${l.cod} não vale para esta folha.`);
      if (!HHMM.test(l.hi || '') || !HHMM.test(l.hf || '')) {
        bloqueios.push(`Linha ${n}: falta o início ou o fim.`);
        return;
      }
      let ini = minutos(l.hi);
      if (anterior) while (ini < anterior.fim - DOZE_HORAS) ini += 1440;
      let fim = minutos(l.hf) + (ini - minutos(l.hi));
      if (fim < ini) fim += 1440;
      if (fim - ini > DOZE_HORAS) { bloqueios.push(`Linha ${n}: fim antes do início.`); return; }
      if (anterior) {
        if (ini < anterior.fim) bloqueios.push(`Linhas ${anterior.n} e ${n}: horários se sobrepõem.`);
        else if (ini > anterior.fim) avisos.push(`Entre a linha ${anterior.n} e a ${n} há um buraco de ${ini - anterior.fim} min.`);
      }
      anterior = { fim, n };
    });
    return { bloqueios, avisos };
  };

  if (typeof module !== 'undefined') module.exports = Crono;
})(typeof window !== 'undefined' ? window : globalThis);
