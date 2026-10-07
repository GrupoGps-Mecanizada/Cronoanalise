// Menu e troca de telas. Cada tela só é montada na primeira vez que é aberta.
(function () {
  const TELAS = ['painel', 'kit', 'lancar', 'editar'];
  let desatualizado = false;
  const iniciadas = {};

  function ir(tela) {
    if (!TELAS.includes(tela)) tela = 'painel';
    if (tela === 'painel' && desatualizado) { location.reload(); return; }
    TELAS.forEach(t => document.getElementById('tela-' + t).classList.toggle('ativa', t === tela));
    document.querySelectorAll('#menu a').forEach(a => a.classList.toggle('ativo', a.dataset.tela === tela));
    // As folhas montadas pelo kit só aparecem na tela do kit (e na impressão).
    document.getElementById('areaFolhas').style.display = tela === 'kit' ? '' : 'none';
    const modulo = { painel: Crono.painel, kit: Crono.kit, lancar: Crono.lancar, editar: Crono.editar }[tela];
    if (modulo && !iniciadas[tela]) { iniciadas[tela] = true; modulo.iniciar(); }
  }

  Crono.esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  Crono.app = { ir, painelDesatualizado: () => { desatualizado = true; } };
  window.addEventListener('hashchange', () => ir(location.hash.slice(1)));
  ir(location.hash.slice(1) || 'painel');
})();
