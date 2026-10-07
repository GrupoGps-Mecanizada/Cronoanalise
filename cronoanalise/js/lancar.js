// Tela Lançar: passa uma folha preenchida para o banco, pelo ID impresso (ex.: CR-0002-OP1).
(function (raiz) {
  const Crono = raiz.Crono;
  const { DESC, classe, EQUIP, PAPEL_NOME, TURNOS, SUPERVISORES } = Crono.config;
  const ID_FOLHA = /^CR-\d{4,}-(MOT|OP1|OP2)$/;
  const vazioParaNull = v => (v === '' || v == null ? null : v);

  function horaInicial(horario) {
    const m = /^\s*(\d{1,2})/.exec(horario || '');
    return m ? String(m[1]).padStart(2, '0') + ':00' : '';
  }

  // Turno com um supervisor só (A, B, C, D) já sugere o nome; no ADM há três, então fica em branco.
  function supervisorDoTurno(turno) {
    const doTurno = SUPERVISORES.filter(s => s.turno === turno);
    return doTurno.length === 1 ? doTurno[0].nome : '';
  }

  // Folha + cabeçalho + linhas digitadas → registros no formato da DEMO.
  function montarRegistros(folha, kit, cab, linhas) {
    const equip = (EQUIP[kit.tipo] || {}).nome;
    return linhas.map(l => {
      const cod = Number(l.cod);
      return {
        data: cab.data, turno: vazioParaNull(cab.turno), horario: Crono.horarioPadrao(cab.horario),
        area: kit.area || null, nome: vazioParaNull(cab.nome), papel: PAPEL_NOME[folha.papel],
        placa: kit.placa || null, vaga: kit.vaga || null, equip,
        hi: l.hi, hf: l.hf, cod, desc: DESC[cod] || null, cls: classe(cod),
        obs: vazioParaNull(l.obs), execAux: vazioParaNull(l.execAux), supervisor: vazioParaNull(cab.supervisor),
        kit: kit.codigo, folha: folha.id
      };
    });
  }

  // ---------------- tela (só no navegador) ----------------
  const el = id => document.getElementById(id);
  let atual = null;      // { folha, kit }
  let linhas = [];

  function avisar(alvo, texto, erro) {
    el(alvo).textContent = texto;
    el(alvo).style.color = erro ? 'var(--bad)' : '';
  }

  const chaveRascunho = () => 'crono_rascunho_' + atual.folha.id;
  function cabecalho() {
    return { nome: el('lcNome').value.trim(), data: el('lcData').value, turno: el('lcTurno').value, horario: el('lcHorario').value.trim(), supervisor: el('lcSupervisor').value };
  }
  function guardarRascunho() {
    try { localStorage.setItem(chaveRascunho(), JSON.stringify({ cab: cabecalho(), linhas })); } catch (_) { /* sem armazenamento */ }
  }
  function lerRascunho() {
    try { return JSON.parse(localStorage.getItem(chaveRascunho())); } catch (_) { return null; }
  }
  function apagarRascunho() {
    try { localStorage.removeItem(chaveRascunho()); } catch (_) { /* sem armazenamento */ }
  }

  function linhaNova() {
    const anterior = linhas[linhas.length - 1];
    return { hi: anterior ? anterior.hf : horaInicial(el('lcHorario').value), hf: '', cod: '', execAux: '', obs: '' };
  }

  function textoAtividade(cod) {
    const n = Number(cod);
    return DESC[n] ? `${DESC[n]} · ${classe(n)}` : (cod === '' ? '' : 'Código não existe');
  }

  function desenharLinhas() {
    const esc = Crono.esc;
    el('lcLinhas').innerHTML = linhas.map((l, i) => `
      <tr data-i="${i}">
        <td><input type="time" data-campo="hi" value="${esc(l.hi)}" aria-label="Início da linha ${i + 1}"></td>
        <td><input type="time" data-campo="hf" value="${esc(l.hf)}" aria-label="Fim da linha ${i + 1}"></td>
        <td><input type="number" min="1" max="69" data-campo="cod" value="${esc(l.cod)}" style="width:5em" aria-label="Código da linha ${i + 1}"></td>
        <td data-atividade>${esc(textoAtividade(l.cod))}</td>
        <td><select data-campo="execAux" aria-label="E/A da linha ${i + 1}">
          ${['', 'E', 'A'].map(v => `<option value="${v}"${l.execAux === v ? ' selected' : ''}>${v || '–'}</option>`).join('')}
        </select></td>
        <td><input type="text" maxlength="300" data-campo="obs" value="${esc(l.obs)}" aria-label="Observação da linha ${i + 1}"></td>
        <td><button type="button" class="btn-icon danger" data-remover="${i}" title="Remover linha">🗑</button></td>
      </tr>`).join('');
  }

  function aoMudarLinha(e) {
    const campo = e.target.dataset.campo;
    const tr = e.target.closest('tr[data-i]');
    if (!campo || !tr) return;
    const l = linhas[Number(tr.dataset.i)];
    l[campo] = e.target.value;
    if (campo === 'cod') tr.querySelector('[data-atividade]').textContent = textoAtividade(l.cod);
    guardarRascunho();
  }

  function mostrarFolha(folha, kit) {
    atual = { folha, kit };
    const equip = EQUIP[kit.tipo] || { label: kit.tipo };
    el('lcTitulo').textContent = `Folha ${folha.id} – ${PAPEL_NOME[folha.papel]} de ${equip.label}`;
    el('lcResumo').textContent = [`Vaga ${kit.vaga || '—'}`, `Placa ${kit.placa || '—'}`, `Área ${kit.area || '—'}`].join(' · ');
    el('lcNome').value = '';
    el('lcData').value = kit.data || '';
    el('lcTurno').value = kit.turno || '';
    el('lcHorario').value = Crono.horarioPadrao(kit.horario || '');
    el('lcSupervisor').value = supervisorDoTurno(kit.turno || '');
    linhas = [];
    const rascunho = lerRascunho();
    if (rascunho && window.confirm('Há um rascunho desta folha neste aparelho. Continuar de onde parou?')) {
      el('lcNome').value = rascunho.cab.nome || '';
      el('lcData').value = rascunho.cab.data || el('lcData').value;
      el('lcTurno').value = rascunho.cab.turno || '';
      el('lcHorario').value = rascunho.cab.horario || el('lcHorario').value;
      el('lcSupervisor').value = rascunho.cab.supervisor || el('lcSupervisor').value;
      linhas = rascunho.linhas || [];
    }
    if (!linhas.length) linhas.push(linhaNova());
    desenharLinhas();
    avisar('lcAvisoSalvar', '');
    el('lcCartao').hidden = false;
  }

  async function buscar() {
    const id = el('lcFolha').value.trim().toUpperCase();
    el('lcCartao').hidden = true;
    el('lcFolha').value = id;
    if (!ID_FOLHA.test(id)) { avisar('lcAviso', 'Código inválido. Ele tem este formato: CR-0002-OP1.', true); return; }
    const botao = el('lcBuscar');
    botao.disabled = true;
    avisar('lcAviso', 'Buscando…');
    try {
      if (await Crono.banco.folhaJaLancada(id)) {
        el('lcAviso').innerHTML = 'Esta folha já foi lançada. <button type="button" class="btn" id="lcAbrirEditar">Abrir em Editar</button>';
        el('lcAviso').style.color = '';
        el('lcAbrirEditar').addEventListener('click', () => Crono.editar.abrirFolha(id));
        return;
      }
      const achado = await Crono.banco.buscarFolha(id);
      if (!achado || !achado.kit) { avisar('lcAviso', 'Folha não encontrada. Confira o código impresso no topo da folha.', true); return; }
      if (achado.kit.status === 'cancelado') { avisar('lcAviso', `O kit ${achado.kit.codigo} foi cancelado. Use a folha de outro kit.`, true); return; }
      avisar('lcAviso', '');
      mostrarFolha(achado.folha, achado.kit);
    } catch (e) {
      avisar('lcAviso', e.message, true);
    } finally {
      botao.disabled = false;
    }
  }

  async function salvar() {
    const cab = cabecalho();
    const { bloqueios, avisos } = Crono.conferirLinhas(linhas, { modelo: atual.folha.modelo, horario: cab.horario });
    if (!cab.data) bloqueios.unshift('Falta a data.');
    if (bloqueios.length) { avisar('lcAvisoSalvar', 'Não dá para salvar ainda: ' + bloqueios.join(' '), true); return; }
    if (avisos.length && !window.confirm(avisos.join('\n') + '\n\nSalvar mesmo assim?')) return;
    const botao = el('lcSalvar');
    botao.disabled = true;
    avisar('lcAvisoSalvar', 'Salvando…');
    try {
      if (await Crono.banco.folhaJaLancada(atual.folha.id)) {
        avisar('lcAvisoSalvar', 'Esta folha já foi lançada por outra pessoa. Confira no Editar.', true);
        return;
      }
      const gravados = await Crono.banco.inserirRegistros(montarRegistros(atual.folha, atual.kit, cab, linhas));
      apagarRascunho();
      avisar('lcAviso', `Folha ${atual.folha.id} lançada (${gravados.length} linhas).`);
      el('lcCartao').hidden = true;
      el('lcFolha').value = '';
      atual = null;
      Crono.app.painelDesatualizado();
    } catch (e) {
      avisar('lcAvisoSalvar', e.message + ' O que foi digitado continua guardado.', true);
    } finally {
      botao.disabled = false;
    }
  }

  function iniciar() {
    el('lcTurno').innerHTML = '<option value="">(sem turno)</option>' + TURNOS.map(t => `<option value="${t}">${t}</option>`).join('');
    el('lcSupervisor').innerHTML = '<option value="">(escolha)</option>' +
      SUPERVISORES.map(s => `<option value="${Crono.esc(s.nome)}">${Crono.esc(s.nome)} – turno ${s.turno}</option>`).join('');
    el('lcTurno').addEventListener('change', () => { if (!el('lcSupervisor').value) el('lcSupervisor').value = supervisorDoTurno(el('lcTurno').value); });
    el('lcBuscar').addEventListener('click', buscar);
    el('lcFolha').addEventListener('keydown', e => { if (e.key === 'Enter') buscar(); });
    el('lcLinhas').addEventListener('input', aoMudarLinha);
    el('lcLinhas').addEventListener('change', aoMudarLinha);
    el('lcLinhas').addEventListener('click', e => {
      const b = e.target.closest('[data-remover]');
      if (!b) return;
      linhas.splice(Number(b.dataset.remover), 1);
      desenharLinhas();
      guardarRascunho();
    });
    ['lcNome', 'lcData', 'lcTurno', 'lcHorario', 'lcSupervisor'].forEach(id => el(id).addEventListener('change', guardarRascunho));
    el('lcMais').addEventListener('click', () => { linhas.push(linhaNova()); desenharLinhas(); guardarRascunho(); });
    el('lcSalvar').addEventListener('click', salvar);
  }

  Crono.lancar = { montarRegistros, horaInicial, supervisorDoTurno, iniciar };
  if (typeof module !== 'undefined') module.exports = Crono;
})(typeof window !== 'undefined' ? window : globalThis);
