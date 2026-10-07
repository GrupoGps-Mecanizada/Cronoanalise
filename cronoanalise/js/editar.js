// Tela Editar: lista os lançamentos do banco, com busca, filtros, páginas de 50, editar e excluir.
// Tabela e formulário vêm da aba "Lançamentos" do sistema (3); a gravação agora é no Supabase.
(function (raiz) {
  const Crono = raiz.Crono;
  const POR_PAGINA = 50;
  const CAMPOS_BUSCA = ['data', 'nome', 'area', 'vaga', 'placa', 'equip', 'desc', 'obs', 'turno', 'folha'];

  function filtrar(registros, busca) {
    const q = String(busca || '').trim().toLowerCase();
    if (!q) return registros;
    return registros.filter(r => CAMPOS_BUSCA.some(c => r[c] != null && String(r[c]).toLowerCase().includes(q)));
  }

  function paginar(lista, pagina, tamanho) {
    const total = Math.max(1, Math.ceil(lista.length / tamanho));
    const atual = Math.min(Math.max(1, pagina), total);
    return { linhas: lista.slice((atual - 1) * tamanho, atual * tamanho), total, pagina: atual };
  }

  // O formulário não mostra kit, folha, E/A e supervisor: eles continuam como estavam.
  const mesclar = (original, campos) => Object.assign({}, original, campos);

  // ---------------- tela (só no navegador) ----------------
  const EQUIP_LABEL = { 'Alta Pressão': 'Alta Pressão', 'Vácuo': 'Auto Vácuo', 'Hiper Vácuo': 'Hiper Vácuo', 'Aspirador de Pó': 'Aspirador' };
  const CLS_BADGE_STYLE = {
    'Produzindo': 'background:var(--good-soft); color:var(--good);',
    'Improdutivo necessário': 'background:var(--warn-soft); color:var(--warn);',
    'Improdutivo': 'background:var(--bad-soft); color:var(--bad);'
  };
  const CAMPOS_FORM = ['fData', 'fTurno', 'fHorario', 'fArea', 'fNome', 'fPapel', 'fEquip', 'fVaga', 'fHi', 'fHf', 'fCod', 'fDesc', 'fCls', 'fObs'];
  let registros = [];
  let pagina = 1;
  let editando = null;
  let iniciado = false;
  const el = id => document.getElementById(id);

  function avisar(texto, erro) {
    const a = el('edAviso');
    a.textContent = texto;
    a.style.color = erro ? 'var(--bad)' : '';
  }

  function linhaHtml(r) {
    const esc = Crono.esc;
    return '<td data-label="Data">' + esc(r.data || '—') + '</td>' +
      '<td data-label="Turno">' + esc(r.turno || '—') + '</td>' +
      '<td data-label="Área">' + esc(r.area || '—') + '</td>' +
      '<td data-label="Nome">' + esc(r.nome || '—') + '</td>' +
      '<td data-label="Papel">' + esc(r.papel || '—') + '</td>' +
      '<td data-label="Vaga/Placa">' + esc(r.vaga || r.placa || '—') + '</td>' +
      '<td data-label="Equipamento">' + esc(EQUIP_LABEL[r.equip] || r.equip || '—') + '</td>' +
      '<td data-label="Início">' + esc(r.hi || '—') + '</td>' +
      '<td data-label="Fim">' + esc(r.hf || '—') + '</td>' +
      '<td data-label="Atividade" class="lanc-truncate" title="' + esc((r.cod != null ? r.cod + ' · ' : '') + (r.desc || '')) + '">' +
        (r.cod != null ? esc(r.cod) + ' · ' : '') + esc(r.desc || '—') + '</td>' +
      '<td data-label="Classificação"><span class="badge" style="' +
        (CLS_BADGE_STYLE[r.cls] || 'background:var(--nodata-soft); color:var(--text-3);') + '">' + esc(r.cls || '—') + '</span></td>' +
      '<td data-label="Observações" class="lanc-truncate" title="' + esc(r.obs || '') + '">' + esc(r.obs || '—') + '</td>' +
      '<td><div class="row-actions">' +
        '<button type="button" class="btn-icon" data-act="edit" data-seq="' + esc(r.seq) + '" title="Editar" aria-label="Editar"><svg class="ic" aria-hidden="true"><use href="#i-editar"/></svg></button>' +
        '<button type="button" class="btn-icon danger" data-act="del" data-seq="' + esc(r.seq) + '" title="Excluir" aria-label="Excluir"><svg class="ic" aria-hidden="true"><use href="#i-lixeira"/></svg></button>' +
      '</div></td>';
  }

  function desenharTabela() {
    const lista = filtrar(registros, el('lancSearch').value);
    const pag = paginar(lista, pagina, POR_PAGINA);
    pagina = pag.pagina;
    const tbody = el('lancTableBody');
    tbody.innerHTML = '';
    pag.linhas.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = linhaHtml(r);
      tbody.appendChild(tr);
    });
    el('lancEmpty').style.display = pag.linhas.length ? 'none' : 'block';
    el('lancEmpty').textContent = 'Nenhum lançamento encontrado.';
    el('edPag').textContent = `Página ${pag.pagina} de ${pag.total} · ${lista.length} linha(s)`;
    el('edAnt').disabled = pag.pagina <= 1;
    el('edProx').disabled = pag.pagina >= pag.total;
  }

  async function recarregar() {
    el('lancEmpty').style.display = 'block';
    el('lancEmpty').textContent = 'Carregando…';
    try {
      registros = await Crono.banco.listarRegistros({
        de: el('edDe').value || null, ate: el('edAte').value || null,
        folha: el('edFolha').value.trim().toUpperCase() || null
      });
      desenharTabela();
    } catch (e) {
      el('lancTableBody').innerHTML = '';
      el('lancEmpty').innerHTML = Crono.esc(e.message) + ' <button type="button" class="btn" id="edTentar">Tentar de novo</button>';
      el('edTentar').addEventListener('click', recarregar);
    }
  }

  function abrirModal(r) {
    const f = {};
    CAMPOS_FORM.forEach(id => { f[id] = el(id); });
    editando = r || null;
    el('lancModalTitle').textContent = r ? 'Editar lançamento' : 'Novo lançamento';
    f.fData.value = r ? (r.data || '') : '';
    f.fTurno.value = r ? (r.turno || 'ADM') : 'ADM';
    f.fHorario.value = r ? (r.horario || '') : '';
    f.fArea.value = r ? (r.area || '') : '';
    f.fNome.value = r ? (r.nome || '') : '';
    f.fPapel.value = r ? (r.papel || 'Motorista') : 'Motorista';
    f.fEquip.value = r ? (r.equip || 'Alta Pressão') : 'Alta Pressão';
    f.fVaga.value = r ? (r.vaga || r.placa || '') : '';
    f.fHi.value = r ? (r.hi || '') : '';
    f.fHf.value = r ? (r.hf || '') : '';
    f.fCod.value = r && r.cod != null ? r.cod : '';
    f.fDesc.value = r ? (r.desc || '') : '';
    f.fCls.value = r ? (r.cls || 'Produzindo') : 'Produzindo';
    f.fObs.value = r ? (r.obs || '') : '';
    el('lancModalOverlay').classList.add('open');
  }

  function fecharModal() { el('lancModalOverlay').classList.remove('open'); editando = null; }

  function aoDigitarCodigo() {
    const cod = Number(el('fCod').value);
    const desc = Crono.config.DESC[cod];
    if (!desc) return;
    el('fDesc').value = desc;
    el('fCls').value = Crono.config.classe(cod);
  }

  async function salvar(e) {
    e.preventDefault();
    const botao = el('lancForm').querySelector('button[type="submit"]');
    const campos = {
      data: el('fData').value, turno: el('fTurno').value, horario: el('fHorario').value,
      area: el('fArea').value, nome: el('fNome').value, papel: el('fPapel').value,
      equip: el('fEquip').value, vaga: el('fVaga').value, hi: el('fHi').value, hf: el('fHf').value,
      cod: el('fCod').value, desc: el('fDesc').value, cls: el('fCls').value, obs: el('fObs').value || null
    };
    botao.disabled = true;
    try {
      if (editando) await Crono.banco.atualizarRegistro(editando.seq, mesclar(editando, campos));
      else await Crono.banco.inserirRegistros([campos]);
      fecharModal();
      avisar('Salvo no banco.');
      Crono.app.painelDesatualizado();
      await recarregar();
    } catch (erro) {
      window.alert(erro.message);
    } finally {
      botao.disabled = false;
    }
  }

  async function excluir(seq) {
    if (!window.confirm('Excluir este lançamento? Essa ação não pode ser desfeita.')) return;
    try {
      await Crono.banco.excluirRegistro(seq);
      avisar('Lançamento excluído.');
      Crono.app.painelDesatualizado();
      await recarregar();
    } catch (erro) {
      avisar(erro.message, true);
    }
  }

  function iniciar() {
    iniciado = true;
    el('fTurno').innerHTML = Crono.config.TURNOS.map(t => `<option value="${t}">${t}</option>`).join('');
    el('lancTableBody').addEventListener('click', e => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const seq = Number(b.dataset.seq);
      if (b.dataset.act === 'edit') abrirModal(registros.find(r => r.seq === seq));
      else excluir(seq);
    });
    el('lancNewBtn').addEventListener('click', () => abrirModal(null));
    el('lancModalClose').addEventListener('click', fecharModal);
    el('lancCancelBtn').addEventListener('click', fecharModal);
    el('lancModalOverlay').addEventListener('click', e => { if (e.target === el('lancModalOverlay')) fecharModal(); });
    el('lancForm').addEventListener('submit', salvar);
    el('fCod').addEventListener('input', aoDigitarCodigo);
    el('lancSearch').addEventListener('input', () => { pagina = 1; desenharTabela(); });
    ['edDe', 'edAte', 'edFolha'].forEach(id => el(id).addEventListener('change', () => { pagina = 1; recarregar(); }));
    el('edAnt').addEventListener('click', () => { pagina -= 1; desenharTabela(); });
    el('edProx').addEventListener('click', () => { pagina += 1; desenharTabela(); });
    recarregar();
  }

  // Abre o Editar já filtrado por uma folha (usado pelo Lançar).
  function abrirFolha(idFolha) {
    el('edFolha').value = idFolha;
    location.hash = '#editar';
    if (iniciado) { pagina = 1; recarregar(); }
  }

  Crono.editar = { filtrar, paginar, mesclar, iniciar, abrirFolha };
  if (typeof module !== 'undefined') module.exports = Crono;
})(typeof window !== 'undefined' ? window : globalThis);
