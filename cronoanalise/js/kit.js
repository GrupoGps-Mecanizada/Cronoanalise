// Tela "Novo documento": monta e imprime o kit de folhas com o código vindo do banco.
(function () {
/* ===================== CONFIGURAÇÃO ===================== */
const CHAVE_HISTORICO = 'crono_kits_v1';

const EQUIPAMENTOS = {
  ap: { nome: 'Alta Pressão',    papeis: ['MOT', 'OP1', 'OP2'] },
  av: { nome: 'Auto Vácuo',      papeis: ['MOT', 'OP1'] },
  hv: { nome: 'Hiper Vácuo',     papeis: ['MOT', 'OP1', 'OP2'] },
  as: { nome: 'Aspirador de Pó', papeis: ['OP1', 'OP2'] }
};

const HORARIOS = ['07–17', '07–19', '19–07', '07–15', '15–23', '23–07'];
const TURNOS = ['A', 'B', 'C', 'D', 'ADM'];

// Vagas conforme o sistema de vagas (timeline_motor_vaga). HV-04 e Aspirador: lista informada pelo usuário.
const VAGAS = {
  ap: Array.from({ length: 10 }, (_, i) => 'AP-' + String(i + 1).padStart(2, '0')),
  av: Array.from({ length: 8 },  (_, i) => 'AV-' + String(i + 1).padStart(2, '0')),
  hv: Array.from({ length: 4 },  (_, i) => 'HV-' + String(i + 1).padStart(2, '0')),
  as: Array.from({ length: 10 }, (_, i) => 'ASP-' + String(i + 1).padStart(2, '0'))
};
const REGIME_VAGA = { 'AP-01': '24 HS', 'AP-07': '16 HS', 'AP-08': '24 HS',
                      'AV-01': '24 HS', 'AV-07': '16 HS', 'AV-08': '24 HS' };

const SUPERVISORES = [
  { nome: 'Ozias',          turno: 'A' },
  { nome: 'Matusalém',      turno: 'B' },
  { nome: 'Israel',         turno: 'C' },
  { nome: 'Fábio',          turno: 'D' },
  { nome: 'Júnior Pereira', turno: 'ADM' },
  { nome: 'Genésio',        turno: 'ADM' },
  { nome: 'Donizete',       turno: 'ADM' }
];

/* ===================== CÓDIGOS ===================== */
const CODIGOS_GERAIS = [
  [1, 'Outra atividade (descrever)'], [2, 'Bater ponto'], [3, 'Trajeto (bica/área/garagem)'],
  [4, 'Café'], [5, 'Almoço / refeição'], [6, 'DDS'], [7, 'Preparação / sinalização'],
  [8, 'Isolamento'], [9, 'Descarte de resíduos'], [10, 'PPT / ART'], [11, 'Documentação / fechamento'],
  [12, 'Abastec. / carreg. água'], [13, 'Bloqueio'], [14, 'Checklist'], [15, 'Retirada de bloqueio'],
  [16, 'Desmobilização'], [17, 'Troca de turno'], [18, 'Recolher ferramentas'], [19, 'Banho'],
  [20, 'Pausa de segurança'], [21, 'Desloc. centro de controle'], [22, 'Espera / aguardando DDS'],
  [23, 'Aguard. liberação da área'], [24, 'Crachá bloqueado'], [25, 'Programação incompleta'],
  [26, 'Aguardando bloqueio'], [27, 'Manutenção'], [28, 'Aguardando operador'], [29, 'Aguard. cliente/Usiminas']
];

const CODIGOS_ESPECIFICOS = {
  30: 'Montagem de mangueiras, engates e laços',
  31: 'Içamento e amarração de mangueira',
  32: 'Hidrojateamento – Pistola',
  33: 'Hidrojateamento – Torpedo',
  34: 'Hidrojateamento – Rabicho',
  35: 'Hidrojateamento – Vareta',
  36: 'Hidrojateamento – Pistola cano longo',
  37: 'Auxílio ao colega (pedal, mangueira, vigia)',
  38: 'Recolhimento de mangueiras e implementos',
  39: 'Troca de bico / o-ring / ajuste',
  40: 'Retirada e posicionamento de mangotes',
  41: 'Içamento e fixação de mangote',
  42: 'Sucção / aspiração de resíduo',
  43: 'Direcionar material ao mangote (pá, água)',
  44: 'Desobstrução de mangote / válvula',
  45: 'Descarga por válvula (gravidade)',
  46: 'Basculamento do tanque',
  47: 'Limpeza de válvulas e bocais',
  48: 'Esvaziamento do depurador / tanquinho',
  49: 'Recolhimento de mangotes',
  50: 'Auxílio ao colega (sinalização, mangote)',
  55: 'Ligar cabo 440V no painel',
  56: 'Instalação de mangotes',
  57: 'Sucção de resíduo',
  58: 'Içamento de caçamba e máquina',
  59: 'Descarregamento na baía de resíduos',
  60: 'Limpeza da caçamba',
  61: 'Limpeza do filtro',
  62: 'Recolhimento de mangotes e cabo',
  63: 'Desobstrução de mangote',
  64: 'Auxílio ao colega',
  65: 'Manobra / posicionamento do caminhão',
  66: 'Operação do motor estacionário / bomba (RPM)',
  67: 'Viagem de descarte (ida e volta)',
  68: 'Aguardando no caminhão (sem operação)',
  69: 'Abastecimento de combustível'
};

const intervalo = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/* ===================== MODELOS DE FOLHA ===================== */
const MODELOS = {
  'AP-MOT': { titulo: 'MOTORISTA DE ALTA PRESSÃO', motorista: true, descarte: false,
              codigos: [30, 31, 38, 65, 66, 68, 69] },
  'AP-OP':  { titulo: 'OPERADOR DE ALTA PRESSÃO', motorista: false,
              codigos: intervalo(30, 39) },
  'AV-MOT': { titulo: 'MOTORISTA DE AUTO VÁCUO', motorista: true, descarte: true,
              codigos: [40, 41, ...intervalo(45, 49), ...intervalo(65, 69)] },
  'AV-OP':  { titulo: 'OPERADOR DE AUTO VÁCUO', motorista: false,
              codigos: intervalo(40, 50) },
  'HV-MOT': { titulo: 'MOTORISTA DE HIPER VÁCUO', motorista: true, descarte: true,
              codigos: [40, 41, ...intervalo(45, 47), 49, ...intervalo(65, 69)] },
  'HV-OP':  { titulo: 'OPERADOR DE HIPER VÁCUO', motorista: false,
              codigos: [...intervalo(40, 47), 49, 50] },
  'AS-OP':  { titulo: 'OPERADOR DE ASPIRADOR DE PÓ', motorista: false,
              codigos: intervalo(55, 64) }
};

const modeloDe = (tipo, papel) => `${tipo.toUpperCase()}-${papel === 'MOT' ? 'MOT' : 'OP'}`;

/* ===================== ID ÚNICO (Supabase) ===================== */
// O banco cria o kit e devolve o código (CR-0001). Folha: kit + "-MOT/-OP1/-OP2".
const gerarCodigoKit = dados => Crono.banco.gerarKit(dados);

/* ===================== HISTÓRICO LOCAL ===================== */
function lerHistorico() {
  try { return JSON.parse(localStorage.getItem(CHAVE_HISTORICO)) || []; }
  catch (_) { return []; }
}

function salvarNoHistorico(kit) {
  try {
    const lista = lerHistorico();
    lista.unshift(kit);
    localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(lista.slice(0, 500)));
  } catch (_) { /* navegador sem armazenamento: segue sem histórico */ }
}

function mostrarHistorico() {
  const lista = lerHistorico();
  const alvo = document.getElementById('historico');
  if (!lista.length) { alvo.textContent = 'Nenhum kit gerado ainda neste computador.'; return; }
  const linhas = lista.slice(0, 30).map((k, i) => `
    <tr>
      <td><b>${esc(k.codigo)}</b></td>
      <td>${esc(EQUIPAMENTOS[k.tipo].nome)}</td>
      <td>${esc(k.vaga || '-')}</td>
      <td>${esc(k.supervisor || '-')}</td>
      <td>${esc(k.data ? formatarData(k.data) : '-')}</td>
      <td>${esc(new Date(k.criadoEm).toLocaleString('pt-BR'))}</td>
      <td><button type="button" data-reimprimir="${i}">Reimprimir</button></td>
    </tr>`).join('');
  alvo.innerHTML = `<table class="hist"><thead><tr><th>Kit</th><th>Equipamento</th><th>Vaga</th><th>Supervisor</th><th>Data</th><th>Gerado em</th><th></th></tr></thead><tbody>${linhas}</tbody></table>`;
}

/* ===================== VAGAS E SUPERVISORES ===================== */
function preencherVagas() {
  const tipo = document.getElementById('tipo').value;
  document.getElementById('vaga').innerHTML = '<option value="">(escolha a vaga)</option>' +
    VAGAS[tipo].map(v => `<option value="${v}">${v}${REGIME_VAGA[v] ? ' – ' + REGIME_VAGA[v] : ''}</option>`).join('');
}

function preencherSupervisores() {
  document.getElementById('supervisor').innerHTML = '<option value="">(escolha o supervisor)</option>' +
    SUPERVISORES.map((s, i) => `<option value="${i}">${esc(s.nome)} – turno ${s.turno}</option>`).join('');
}

function aoEscolherSupervisor() {
  const sup = SUPERVISORES[document.getElementById('supervisor').value];
  if (sup) document.getElementById('turno').value = sup.turno;
}

/* ===================== MONTAR FOLHAS ===================== */
function lerFormulario() {
  return {
    tipo: document.getElementById('tipo').value,
    vaga: document.getElementById('vaga').value,
    supervisor: (SUPERVISORES[document.getElementById('supervisor').value] || {}).nome || '',
    placa: document.getElementById('placa').value.trim().toUpperCase(),
    data: document.getElementById('data').value,
    turno: document.getElementById('turno').value,
    horario: document.getElementById('horario').value,
    area: document.getElementById('area').value.trim()
  };
}

function montarKit(dados, previa) {
  const area = document.getElementById('areaFolhas');
  area.innerHTML = '';
  const papeis = EQUIPAMENTOS[dados.tipo].papeis;
  papeis.forEach((papel, i) => {
    area.appendChild(montarFolha(dados, papel, i + 1, papeis.length, previa));
    area.appendChild(montarVerso(dados, papel, previa));
  });
  document.getElementById('previaTitulo').textContent = previa
    ? 'Prévia (sem ID válido – não use para a medição):'
    : `Kit ${dados.codigo} – ${papeis.length} folha(s), frente e verso:`;
}

function montarFolha(dados, papel, num, total, previa) {
  const modelo = MODELOS[modeloDe(dados.tipo, papel)];
  const idFolha = `${dados.codigo}-${papel}`;
  const el = document.createElement('div');
  el.className = 'folha';
  el.innerHTML = `
    ${previa ? '<div class="marca-previa">PRÉVIA – SEM ID</div>' : ''}
    <div class="f-topo">
      <div class="f-titulo">
        <div class="f-empresa">GRUPO GPS · MECANIZADA · CRONOANÁLISE DE ATIVIDADES</div>
        <h1>CRONOANÁLISE – ${modelo.titulo}</h1>
        <div class="f-kit">Kit <b>${esc(dados.codigo)}</b> · Folha ${num} de ${total} · Equipe: ${EQUIPAMENTOS[dados.tipo].papeis.map(nomePapel).join(' + ')}</div>
      </div>
      <div class="f-id">
        <div class="qr"></div>
        <div class="txt">ID DA FOLHA<b>${esc(idFolha)}</b></div>
      </div>
    </div>
    ${montarCampos(dados, papel, modelo)}
    <div class="f-corpo">
      ${modelo.motorista ? montarTabelaMotorista(modelo) : montarTabelaOperador(modelo)}
    </div>
    <div class="f-obs"><b>OBSERVAÇÕES GERAIS:</b></div>
    <div class="f-ass">
      <div>Assinatura do funcionário</div>
      <div>Visto do supervisor</div>
    </div>
    <div class="f-rodape">
      <span>Anote cada mudança de atividade: hora de início, hora de fim e o código. <b>Os códigos estão no verso.</b></span>
      <span>${esc(idFolha)}</span>
    </div>`;
  new QRCode(el.querySelector('.qr'), { text: idFolha, width: 160, height: 160, correctLevel: QRCode.CorrectLevel.M });
  return el;
}

function montarCampos(dados, papel, modelo) {
  const turnos = TURNOS.map(t => caixa(t, dados.turno === t)).join('');
  const horarios = HORARIOS.map(h => caixa(h, dados.horario === h)).join('');
  const funcao = modelo.motorista
    ? '<span class="papel-destaque">MOTORISTA</span>'
    : `<span class="papel-destaque">${caixa('OPERADOR 1', papel === 'OP1')}${caixa('OPERADOR 2', papel === 'OP2')}</span>`;
  return `
    <div class="f-campos">
      <div class="f-linha">
        <div class="f-c" style="flex:.8"><span class="r">DATA</span><span class="v">${dados.data ? esc(formatarData(dados.data)) : '____/____/______'}</span></div>
        <div class="f-c" style="flex:1.25"><span class="r">TURNO</span>${turnos}</div>
        <div class="f-c" style="flex:1.15"><span class="r">FUNÇÃO</span>${funcao}</div>
      </div>
      <div class="f-linha">
        <div class="f-c" style="flex:1.75"><span class="r">HORÁRIO</span>${horarios}</div>
        <div class="f-c" style="flex:1"><span class="r">SUPERVISOR</span><span class="v">${esc(dados.supervisor || '')}</span></div>
      </div>
      <div class="f-linha">
        <div class="f-c" style="flex:2.6"><span class="r">NOME</span></div>
        <div class="f-c" style="flex:1"><span class="r">MATRÍCULA</span></div>
      </div>
      <div class="f-linha">
        <div class="f-c" style="flex:1.2"><span class="r">EQUIPAMENTO</span><span class="v">${esc(EQUIPAMENTOS[dados.tipo].nome)}</span></div>
        <div class="f-c" style="flex:.8"><span class="r">VAGA</span><span class="v">${esc(dados.vaga || '')}</span></div>
        <div class="f-c" style="flex:.8"><span class="r">PLACA</span><span class="v">${esc(dados.placa || '')}</span></div>
        <div class="f-c" style="flex:1.8"><span class="r">ÁREA</span><span class="v">${esc(dados.area || '')}</span></div>
      </div>
    </div>`;
}

function montarTabelaOperador() {
  const execAux = '<div class="cxs"><span class="cx"><i></i>Exec.</span><span class="cx"><i></i>Aux.</span></div>';
  const corpo = `<tr><td class="sep">:</td><td class="sep">:</td><td></td><td>${execAux}</td><td></td></tr>`.repeat(24);
  return `
    <table class="ap">
      <thead><tr>
        <th style="width:13%">HORA INÍCIO</th><th style="width:13%">HORA FIM</th><th style="width:9%">CÓD.</th><th style="width:19%">EXECUTANDO / AUXILIANDO</th><th>OBSERVAÇÃO</th>
      </tr></thead>
      <tbody>${corpo}</tbody>
    </table>
    <p class="aviso-verso"><span style="float:left;font-weight:normal">Marque X: <b>Exec.</b> = você estava executando o serviço · <b>Aux.</b> = você estava auxiliando o colega.</span>CÓDIGOS NO VERSO DA FOLHA ➜</p>`;
}

function montarTabelaMotorista(modelo) {
  const corpo = '<tr><td class="sep">:</td><td class="sep">:</td><td></td><td></td></tr>'.repeat(20);
  const bica = `
    <div class="bloco" style="flex:${modelo.descarte ? '0 0 62mm' : '1'}">
      <div class="bt">ABASTECIMENTO NA BICA</div>
      <table><thead><tr><th>Chegada</th><th>Saída</th><th>Nº cargas</th></tr></thead>
      <tbody>${'<tr><td>:</td><td>:</td><td></td></tr>'.repeat(4)}</tbody></table>
    </div>`;
  const descarte = !modelo.descarte ? '' : `
    <div class="bloco" style="flex:1">
      <div class="bt">VIAGENS DE DESCARTE</div>
      <table><thead><tr><th style="width:15%">Saída área</th><th style="width:15%">Chegada baía</th><th>Local</th><th style="width:24%">Tipo</th><th style="width:14%">Retorno</th></tr></thead>
      <tbody>${'<tr><td>:</td><td>:</td><td></td><td>Válv. &nbsp;/&nbsp; Basc.</td><td>:</td></tr>'.repeat(4)}</tbody></table>
    </div>`;
  return `
    <table class="ap">
      <thead><tr>
        <th style="width:14%">HORA INÍCIO</th><th style="width:14%">HORA FIM</th><th style="width:10%">CÓD.</th><th>OBSERVAÇÃO</th>
      </tr></thead>
      <tbody>${corpo}</tbody>
    </table>
    <p class="aviso-verso">CÓDIGOS NO VERSO DA FOLHA ➜</p>
    <div class="blocos">${bica}${descarte}</div>`;
}

function montarVerso(dados, papel, previa) {
  const modelo = MODELOS[modeloDe(dados.tipo, papel)];
  const idFolha = `${dados.codigo}-${papel}`;
  const especificos = modelo.codigos.map(c =>
    `<div><b>${c}</b>${esc(CODIGOS_ESPECIFICOS[c])}</div>`).join('');
  const gerais = CODIGOS_GERAIS.map(([c, d]) =>
    `<div><b>${String(c).padStart(2, '0')}</b>${esc(d)}</div>`).join('');
  const el = document.createElement('div');
  el.className = 'folha';
  el.innerHTML = `
    ${previa ? '<div class="marca-previa">PRÉVIA – SEM ID</div>' : ''}
    <div class="v-topo">
      <h1>CÓDIGOS – ${modelo.titulo}</h1>
      <div class="vid">Verso da folha<b>${esc(idFolha)}</b></div>
    </div>
    <div class="v-sec">
      <h2>ETAPAS DA SUA FUNÇÃO</h2>
      <div class="v-esp">${especificos}</div>
    </div>
    <div class="v-sec">
      <h2>CÓDIGOS GERAIS (todas as funções)</h2>
      <div class="v-ger">${gerais}</div>
    </div>
    <div class="v-sec">
      <h2>COMO PREENCHER</h2>
      <div class="v-como">
        <table>
          <thead><tr><th>INÍCIO</th><th>FIM</th><th>CÓD.</th><th>OBSERVAÇÃO</th></tr></thead>
          <tbody>
            <tr><td>06:40</td><td>07:10</td><td>06</td><td style="text-align:left">DDS</td></tr>
            <tr><td>07:10</td><td>07:40</td><td>14</td><td style="text-align:left">Checklist</td></tr>
            <tr><td>07:40</td><td>08:30</td><td>03</td><td style="text-align:left">Trajeto até a área</td></tr>
            <tr><td>08:30</td><td>09:00</td><td>10</td><td style="text-align:left">PPT / ART</td></tr>
          </tbody>
        </table>
        <ul>
          <li>Mudou de atividade? <b>Nova linha.</b></li>
          <li>A <b>hora fim</b> de uma linha é a <b>hora início</b> da próxima.</li>
          <li>Use só os códigos deste verso.</li>
          <li>Código <b>01</b> = outra atividade: escreva o que foi na observação.</li>
          <li>Ficou parado esperando? Use o código de espera (22 a 29) e anote o motivo.</li>
        </ul>
      </div>
    </div>`;
  return el;
}

/* ===================== AÇÕES ===================== */
async function gerarEImprimir() {
  const aviso = document.getElementById('avisoKit');
  const botao = document.getElementById('btnGerar');
  const dados = lerFormulario();
  if (!dados.vaga || !dados.supervisor) {
    aviso.className = 'aviso erro';
    aviso.textContent = 'Escolha a vaga e o supervisor antes de gerar o kit.';
    return;
  }
  botao.disabled = true;
  aviso.className = 'aviso ok';
  aviso.textContent = 'Gerando o kit no banco…';
  try {
    dados.codigo = await gerarCodigoKit(dados);
  } catch (erro) {
    aviso.className = 'aviso erro';
    aviso.textContent = erro.message;
    return;
  } finally {
    botao.disabled = false;
  }
  dados.criadoEm = new Date().toISOString();
  salvarNoHistorico(dados);
  mostrarHistorico();
  montarKit(dados, false);
  aviso.className = 'aviso ok';
  aviso.textContent = `Kit ${dados.codigo} gerado. Abrindo a impressão…`;
  setTimeout(() => window.print(), 400);
}

function verPrevia() {
  const dados = lerFormulario();
  dados.codigo = 'CR-PREVIA';
  montarKit(dados, true);
  document.getElementById('previaTitulo').scrollIntoView({ behavior: 'smooth' });
}

async function reimprimirPeloCodigo() {
  const aviso = document.getElementById('avisoReimpressao');
  const codigo = document.getElementById('codigoReimpressao').value.trim().toUpperCase();
  if (!/^CR-\d{4,}$/.test(codigo)) {
    aviso.className = 'aviso erro';
    aviso.textContent = 'Digite o código do kit, como CR-0002.';
    return;
  }
  try {
    const kit = await Crono.banco.buscarKit(codigo);
    if (!kit) { aviso.className = 'aviso erro'; aviso.textContent = 'Kit não encontrado.'; return; }
    aviso.className = 'aviso ok';
    aviso.textContent = `Kit ${kit.codigo} encontrado. Abrindo a impressão…`;
    montarKit({ tipo: kit.tipo, vaga: kit.vaga || '', supervisor: '', placa: kit.placa || '', data: kit.data || '',
                turno: kit.turno || '', horario: kit.horario || '', area: kit.area || '', codigo: kit.codigo }, false);
    setTimeout(() => window.print(), 400);
  } catch (erro) {
    aviso.className = 'aviso erro';
    aviso.textContent = erro.message;
  }
}

function reimprimir(indice) {
  const kit = lerHistorico()[indice];
  if (!kit) return;
  montarKit(kit, false);
  setTimeout(() => window.print(), 400);
}

/* ===================== UTILITÁRIOS ===================== */
function caixa(texto, marcado) {
  return `<span class="cx"><i>${marcado ? 'X' : ''}</i>${esc(texto)}</span>`;
}

function nomePapel(p) {
  return p === 'MOT' ? 'Motorista' : p === 'OP1' ? 'Operador 1' : 'Operador 2';
}

function formatarData(iso) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ===================== INÍCIO ===================== */
Crono.kit = {
  iniciar() {
    document.getElementById('horario').insertAdjacentHTML('beforeend', HORARIOS.map(h => `<option>${h}</option>`).join(''));
    document.getElementById('data').value = new Date().toLocaleDateString('sv-SE');
    document.getElementById('tipo').addEventListener('change', preencherVagas);
    document.getElementById('supervisor').addEventListener('change', aoEscolherSupervisor);
    document.getElementById('btnGerar').addEventListener('click', gerarEImprimir);
    document.getElementById('btnPrevia').addEventListener('click', verPrevia);
    document.getElementById('btnReimprimirCodigo').addEventListener('click', reimprimirPeloCodigo);
    document.getElementById('historico').addEventListener('click', e => {
      const b = e.target.closest('[data-reimprimir]');
      if (b) reimprimir(Number(b.dataset.reimprimir));
    });
    preencherVagas();
    preencherSupervisores();
    mostrarHistorico();
  }
};
})();
