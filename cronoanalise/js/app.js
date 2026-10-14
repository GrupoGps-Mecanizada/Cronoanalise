// Menu (padrão do SST: assuntos com submenus explicados) e troca de telas. Cada tela só é montada na primeira vez.
(function () {
  const ICONE = {
    dashboard: '<path d="M3 3v18h18"/><path d="M8 17v-6"/><path d="M13 17V7"/><path d="M18 17v-4"/>',
    timeline: '<path d="M3 6h10M3 12h16M3 18h7"/><circle cx="17" cy="6" r="2"/><circle cx="14" cy="18" r="2"/>',
    produtividade: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    equipamentos: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
    kit: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M12 12v6M9 15h6"/>',
    lancar: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    editar: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    seta: '<path d="m6 9 6 6 6-6"/>'
  };
  const SECOES = {
    Painel: { texto: 'Gráficos e análise das cronoanálises', icone: 'dashboard' },
    Folhas: { texto: 'Gerar, lançar e corrigir as folhas de campo', icone: 'lancar' }
  };
  const ROTAS = {
    dashboard: { tela: 'painel', view: 'dashboard', secao: 'Painel', rotulo: 'Dashboard', texto: 'Visão geral com gráficos e leitura automática' },
    timeline: { tela: 'painel', view: 'timeline', secao: 'Painel', rotulo: 'Linha do tempo', texto: 'O turno de cada equipe, atividade por atividade' },
    produtividade: { tela: 'painel', view: 'produtividade', secao: 'Painel', rotulo: 'Produtividade', texto: 'Por equipamento, vaga, turno e horário' },
    equipamentos: { tela: 'painel', view: 'equipamentos', secao: 'Painel', rotulo: 'Equipamentos', texto: 'Resumo por tipo de equipamento' },
    kit: { tela: 'kit', secao: 'Folhas', rotulo: 'Novo documento', texto: 'Gerar e imprimir o kit de folhas' },
    lancar: { tela: 'lancar', secao: 'Folhas', rotulo: 'Lançar', texto: 'Passar uma folha preenchida para o sistema' },
    editar: { tela: 'editar', secao: 'Folhas', rotulo: 'Editar', texto: 'Corrigir ou excluir lançamentos' }
  };
  const NA_BARRA_INFERIOR = ['dashboard', 'timeline', 'lancar', 'editar'];
  const TELAS = ['painel', 'kit', 'lancar', 'editar'];
  const PORTAL_SGE = 'https://sge-portal.pages.dev/';
  let desatualizado = false;
  const iniciadas = {};
  const el = id => document.getElementById(id);
  const svg = nome => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONE[nome]}</svg>`;

  Crono.esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Portal SGE: dentro da moldura, a barra da Cronoanálise se apresenta e a do portal some ----------
  function portal() {
    try { return window.top !== window ? window.top.SGEPortal || null : null; } catch (_) { return null; }
  }

  // ---------- endereço antigo (GitHub Pages): só o aviso de mudança ----------
  if (/github\.io$/.test(location.hostname)) {
    document.body.innerHTML = `<div class="mudou"><div class="mudou-cartao"><img src="assets/logo-sge.png" alt="SGE" width="56" height="56">
      <h1>A Cronoanálise mudou de endereço</h1><p>Agora ela fica dentro do Portal SGE, junto com os outros sistemas.</p>
      <a class="mudou-botao" href="${PORTAL_SGE}">Prosseguir para o Portal SGE</a></div></div>`;
    return;
  }

  // ---------- menu ----------
  const rotasDa = secao => Object.keys(ROTAS).filter(r => ROTAS[r].secao === secao);
  const itemSub = r => `<a href="#${r}" class="sub-item" data-rota="${r}"><span class="sub-icone">${svg(r)}</span>` +
    `<span class="sub-textos"><b>${ROTAS[r].rotulo}</b><small>${ROTAS[r].texto}</small></span></a>`;

  function gaveta(abrir) {
    el('gaveta').hidden = !abrir; el('gavetaFundo').hidden = !abrir;
    el('botaoGaveta').setAttribute('aria-expanded', String(abrir));
  }
  function fecharSubs() {
    document.querySelectorAll('.secao').forEach(sec => {
      sec.querySelector('.sub').hidden = true;
      sec.querySelector('.secao-botao').setAttribute('aria-expanded', 'false');
    });
  }

  function montarMenu() {
    el('barraMenu').innerHTML = Object.keys(SECOES).map(s =>
      `<div class="secao" data-secao="${s}"><button type="button" class="secao-botao" aria-expanded="false" aria-haspopup="true">` +
      `${svg(SECOES[s].icone)}<span>${s}</span>${svg('seta')}</button>` +
      `<div class="sub" hidden><p class="sub-titulo">${SECOES[s].texto}</p>${rotasDa(s).map(itemSub).join('')}</div></div>`).join('');
    el('gaveta').innerHTML = Object.keys(SECOES).map(s =>
      `<div class="gaveta-grupo"><p class="sub-titulo">${s}</p>${rotasDa(s).map(itemSub).join('')}</div>`).join('');
    el('barraInferior').innerHTML = NA_BARRA_INFERIOR.map(r =>
      `<a href="#${r}" data-rota="${r}">${svg(r)}<span>${ROTAS[r].rotulo}</span></a>`).join('');

    el('barraMenu').addEventListener('click', e => {
      const botao = e.target.closest('.secao-botao');
      if (botao) {
        const sub = botao.nextElementSibling, abrir = sub.hidden;
        fecharSubs(); sub.hidden = !abrir; botao.setAttribute('aria-expanded', String(abrir));
        return;
      }
      if (e.target.closest('.sub-item')) fecharSubs();
    });
    document.addEventListener('click', e => { if (!e.target.closest('.secao')) fecharSubs(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { fecharSubs(); gaveta(false); } });
    el('botaoGaveta').addEventListener('click', () => gaveta(el('gaveta').hidden));
    el('gavetaFundo').addEventListener('click', () => gaveta(false));
    el('gaveta').addEventListener('click', e => { if (e.target.closest('.sub-item')) gaveta(false); });
    el('barraMarca').addEventListener('click', e => {
      const p = portal();
      if (p && typeof p.inicio === 'function') { e.preventDefault(); p.inicio(); }
    });
  }

  // ---------- tema (grava a escolha; sem escolha, segue o aparelho) ----------
  function alternarTema() {
    const raiz = document.documentElement;
    const escuroAgora = raiz.dataset.theme ? raiz.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    raiz.dataset.theme = escuroAgora ? 'light' : 'dark';
    try { localStorage.setItem('crono_tema', raiz.dataset.theme); } catch (_) { /* sem armazenamento */ }
    // O gráfico dos dias (SVG) lê as cores na hora de desenhar.
    if (Crono.dashboard && Crono.dashboard.redesenhar) Crono.dashboard.redesenhar();
  }

  // ---------- troca de telas ----------
  function ir(rota) {
    if (!ROTAS[rota]) rota = 'dashboard';   // inclui o antigo #painel
    const r = ROTAS[rota];
    if (r.tela === 'painel' && desatualizado) { location.reload(); return; }
    TELAS.forEach(t => el('tela-' + t).classList.toggle('ativa', t === r.tela));
    if (r.view) {
      document.querySelectorAll('#tela-painel .view').forEach(v => v.classList.toggle('active', v.id === 'view-' + r.view));
      document.querySelectorAll('#topTabs .tab').forEach(b => b.classList.toggle('active', b.dataset.view === r.view));
      if (r.view === 'dashboard' && Crono.dashboard && Crono.dashboard.redesenhar) setTimeout(Crono.dashboard.redesenhar, 0);
    }
    document.querySelectorAll('[data-rota]').forEach(a => a.classList.toggle('ativo', a.dataset.rota === rota));
    document.querySelectorAll('.secao').forEach(s => s.classList.toggle('ativa', s.dataset.secao === r.secao));
    el('barraOnde').innerHTML = `${r.secao} <span>›</span> <b>${r.rotulo}</b>`;
    document.title = `${r.rotulo} · Cronoanálise`;
    // As folhas montadas pelo kit só aparecem na tela do kit (e na impressão).
    el('areaFolhas').style.display = r.tela === 'kit' ? '' : 'none';
    const modulo = { painel: Crono.painel, kit: Crono.kit, lancar: Crono.lancar, editar: Crono.editar }[r.tela];
    if (modulo && !iniciadas[r.tela]) { iniciadas[r.tela] = true; modulo.iniciar(); }
  }

  montarMenu();
  el('botaoTema').addEventListener('click', alternarTema);
  el('botaoTemaCelular').addEventListener('click', alternarTema);
  try { const p = portal(); if (p && typeof p.registrarBarra === 'function') p.registrarBarra(window); } catch (_) { /* portal antigo */ }

  // ir() pelo código também troca o endereço, para o "voltar" do navegador funcionar.
  Crono.app = {
    ir: rota => { if (location.hash.slice(1) === rota) ir(rota); else location.hash = rota; },
    painelDesatualizado: () => { desatualizado = true; }
  };
  window.addEventListener('hashchange', () => ir(location.hash.slice(1)));
  ir(location.hash.slice(1) || 'dashboard');
})();
