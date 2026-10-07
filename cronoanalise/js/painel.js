// Tela Painel: desenha os gráficos do sistema (3) a partir dos registros do banco.
// O desenho (desenhar) é o código da DEMO; os dados chegam já escapados (Crono.banco.escaparRegistro).
(function () {
function desenhar(ALL) {
  "use strict";
  var DATA = ALL.timeline;
  var CH = ALL.charts;
  // Papel sem folha lançada não vem em c.roles: desenha como "sem registro".
  var PAPEL_VAZIO = {nome:null, segments:[], totals:{}};
  var CLS_KEY = {'Produzindo':'prod','Improdutivo necessário':'nec','Improdutivo':'imp'};
  var CLS_VAR = {'Produzindo':'--good','Improdutivo necessário':'--warn','Improdutivo':'--bad'};

  function fmtHM(min){
    var d = Math.floor(min/1440); var m = ((min%1440)+1440)%1440;
    var h = Math.floor(m/60), mm = m%60;
    var s = (h<10?'0':'')+h+':'+(mm<10?'0':'')+mm;
    return d>0 ? s+' (+'+d+'d)' : s;
  }
  function fmtH(h){ return h.toFixed(1).replace('.',',')+'h'; }
  function obsHtml(list, limit){
    if (!list || !list.length) return '';
    limit = limit || 3;
    var shown = list.slice(0, limit).map(function(o){
      return '<div style="margin-top:4px;"><span style="opacity:.7;">'+(o.meta||'')+'</span> '+o.texto+'</div>';
    }).join('');
    var extra = list.length>limit ? '<div style="margin-top:4px;opacity:.7;">+'+(list.length-limit)+' observação(ões)</div>' : '';
    return '<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.2);"><b style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;opacity:.8;">Observações</b>'+shown+extra+'</div>';
  }
  function pctstr(v){ return v==null ? '—' : v.toFixed(0)+'%'; }
  function getVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  document.getElementById('dataBadge').textContent = DATA.overall.totalRegistros + ' lançamentos';

  // ================= TOP TABS =================
  var topBtns = document.querySelectorAll('#topTabs .tab');
  topBtns.forEach(function(b){
    b.addEventListener('click', function(){
      topBtns.forEach(function(x){x.classList.remove('active');});
      b.classList.add('active');
      document.querySelectorAll('#tela-painel .view').forEach(function(v){v.classList.remove('active');});
      document.getElementById('view-'+b.dataset.view).classList.add('active');
    });
  });

  // ================= DASHBOARD =================
  var o = DATA.overall;
  var pctv = function(cls){ return o.totalHoras ? (100*(o.porClassificacao[cls]||0)/o.totalHoras) : 0; };
  var kpis = [
    [fmtH(o.totalHoras), 'Horas registradas'],
    [o.totalRegistros, 'Lançamentos na base'],
    [pctv('Produzindo').toFixed(0)+'%', 'Tempo produzindo (geral)'],
    [o.crewsCompletos+' / '+o.totalCrews, 'Equipes com comparação completa']
  ];
  var kr = document.getElementById('kpiRow');
  kpis.forEach(function(k){
    var d = document.createElement('div'); d.className='kpi';
    d.innerHTML = '<div class="kpi-label">'+k[1]+'</div><div class="kpi-value">'+k[0]+'</div>';
    kr.appendChild(d);
  });

  var ovr = CH.overallRole;
  document.getElementById('miniCompare').innerHTML =
    '<div class="mc-item"><div class="mc-role"><span class="sw" style="background:var(--s-motorista)"></span>Motorista</div>'+
      '<div class="mc-pct">'+pctstr(ovr.Motorista.pctProd)+'</div><div class="mc-hrs">produzindo de '+fmtH(ovr.Motorista.totalH)+' registradas</div></div>'+
    '<div class="mc-item"><div class="mc-role"><span class="sw" style="background:var(--s-operador)"></span>Operador</div>'+
      '<div class="mc-pct">'+pctstr(ovr.Operador.pctProd)+'</div><div class="mc-hrs">produzindo de '+fmtH(ovr.Operador.totalH)+' registradas</div></div>';

  var rtb = document.getElementById('roleTableBody');
  var EQUIP_ORDER = ['alta_pressao','auto_vacuo','hiper_vacuo','aspirador'];
  var ROLE_LABEL = {alta_pressao:['Motorista','Operador 1','Operador 2'], auto_vacuo:['Motorista','Operador 1'], hiper_vacuo:['Motorista','Operador 1','Operador 2'], aspirador:['Operador 1','Operador 2']};
  EQUIP_ORDER.forEach(function(k){
    var cfg = CH.equip[k];
    var tr = document.createElement('tr');
    var chips = ROLE_LABEL[k].map(function(r){return '<span class="role-chip">'+r+'</span>';}).join('');
    tr.innerHTML = '<td style="font-weight:700;">'+cfg.label+(k==='aspirador'?' <span class="badge badge-brand" style="margin-left:6px;">10 vagas</span>':'')+'</td><td>'+cfg.slots+'</td><td>'+chips+'</td>';
    rtb.appendChild(tr);
  });

  // coverage bars
  var covWrap = document.getElementById('coverageBars');
  EQUIP_ORDER.forEach(function(k){
    var cfg = CH.equip[k];
    var withData = Object.keys(cfg.vagas).filter(function(vk){
      var v = cfg.vagas[vk];
      return Object.keys(v.roles||{}).some(function(role){ return v.roles[role].totalH>0; });
    }).length;
    var pct = cfg.slots ? (100*withData/cfg.slots) : 0;
    var row = document.createElement('div');
    row.style.marginBottom='12px';
    row.innerHTML = '<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;"><span style="font-weight:700;">'+cfg.label+'</span><span style="color:var(--text-2);">'+withData+' de '+cfg.slots+' vagas</span></div>'+
      '<div style="height:10px;border-radius:6px;background:var(--nodata-soft);overflow:hidden;"><div style="height:100%;width:'+pct+'%;background:var(--brand);border-radius:6px;"></div></div>';
    covWrap.appendChild(row);
  });

  // ================= TIMELINE (same behaviour as before) =================
  var list = document.getElementById('crewList');
  var current = 0;
  var defaultIdx = DATA.crews.findIndex(function(c){ return c.completenessNum>=2; });
  current = defaultIdx>=0 ? defaultIdx : 0;
  function dateLabel(iso){ var p = iso.split('-'); return p[2]+'/'+p[1]; }

  // date / equipamento / turno filters
  var crewDates = DATA.crews.map(function(c){ return c.data; }).filter(Boolean).sort();
  var dateFromEl = document.getElementById('dateFrom');
  var dateToEl = document.getElementById('dateTo');
  var dateClearBtn = document.getElementById('dateFilterClear');
  var dateCountEl = document.getElementById('dateFilterCount');
  var filterEquipEl = document.getElementById('filterEquip');
  var filterTurnoEl = document.getElementById('filterTurno');
  if (crewDates.length){
    dateFromEl.min = dateToEl.min = crewDates[0];
    dateFromEl.max = dateToEl.max = crewDates[crewDates.length-1];
  }
  var equipOptions = [];
  DATA.crews.forEach(function(c){ if (equipOptions.indexOf(c.equipLabel)===-1) equipOptions.push(c.equipLabel); });
  equipOptions.sort().forEach(function(e){
    var opt = document.createElement('option'); opt.value = e; opt.textContent = e;
    filterEquipEl.appendChild(opt);
  });
  var TURNO_ORDER = ['A','B','C','D','ADM','16 Horas'];
  var turnoOptions = [];
  DATA.crews.forEach(function(c){ if (c.turno && turnoOptions.indexOf(c.turno)===-1) turnoOptions.push(c.turno); });
  turnoOptions.sort(function(a,b){
    var ia = TURNO_ORDER.indexOf(a), ib = TURNO_ORDER.indexOf(b);
    if (ia===-1) ia = 99; if (ib===-1) ib = 99;
    return ia-ib;
  }).forEach(function(t){
    var opt = document.createElement('option'); opt.value = t;
    opt.textContent = (t==='ADM') ? 'ADM (regime administrativo)' : t;
    filterTurnoEl.appendChild(opt);
  });

  function buildCrewItem(c, i){
    var btn = document.createElement('button'); btn.className = 'crew-item';
    btn.dataset.idx = i;
    var full = c.completenessNum>=2;
    btn.innerHTML =
      '<div class="top"><span class="date">'+dateLabel(c.data)+' · '+c.equipLabel+'</span>'+
      '<span class="pillcount '+(full?'full':'partial')+'">'+c.completenessNum+'/'+c.completenessDen+'</span></div>'+
      '<span class="vaga">Vaga/Placa '+(c.vaga||'—')+' · '+(c.area||'')+'</span>';
    btn.addEventListener('click', function(){ select(i); });
    return btn;
  }

  function renderCrewList(){
    var from = dateFromEl.value || null;
    var to = dateToEl.value || null;
    var equipF = filterEquipEl.value || null;
    var turnoF = filterTurnoEl.value || null;
    list.innerHTML = '';
    var visibleIdx = [];
    DATA.crews.forEach(function(c, i){
      if (from && c.data < from) return;
      if (to && c.data > to) return;
      if (equipF && c.equipLabel !== equipF) return;
      if (turnoF && c.turno !== turnoF) return;
      list.appendChild(buildCrewItem(c, i));
      visibleIdx.push(i);
    });
    if (!visibleIdx.length){
      var empty = document.createElement('div');
      empty.style.padding = '18px 14px'; empty.style.fontSize = '12.5px'; empty.style.color = 'var(--text-3)';
      empty.textContent = 'Nenhuma equipe encontrada com esses filtros.';
      list.appendChild(empty);
    }
    if (from || to || equipF || turnoF){
      dateCountEl.textContent = visibleIdx.length + ' de ' + DATA.crews.length + ' equipes';
    } else {
      dateCountEl.textContent = '';
    }
    if (visibleIdx.indexOf(current) === -1 && visibleIdx.length){
      select(visibleIdx[0]);
    } else {
      markActive();
    }
  }

  [dateFromEl, dateToEl, filterEquipEl, filterTurnoEl].forEach(function(el){
    el.addEventListener('change', renderCrewList);
  });
  dateClearBtn.addEventListener('click', function(){
    dateFromEl.value = ''; dateToEl.value = ''; filterEquipEl.value = ''; filterTurnoEl.value = '';
    renderCrewList();
  });

  function markActive(){
    Array.prototype.forEach.call(list.children, function(el){
      if (!el.dataset) return;
      el.classList.toggle('active', Number(el.dataset.idx)===current);
    });
  }

  var tip = document.getElementById('tip');
  function showTip(e, html){ tip.innerHTML = html; tip.style.display='block'; positionTip(e); }
  function positionTip(e){
    var x=e.clientX, y=e.clientY, w=260;
    tip.style.left = Math.min(x+14, window.innerWidth-w-10)+'px';
    tip.style.top = Math.min(y+14, window.innerHeight-90)+'px';
  }
  function hideTip(){ tip.style.display='none'; }

  var cg = document.getElementById('codesGrid');
  DATA.legend.forEach(function(l){
    var varname = CLS_VAR[l.cls] || '--text-3';
    var row = document.createElement('div'); row.className='code-row';
    row.innerHTML = '<span class="cn">'+l.cod+'</span><span class="cc" style="background:var('+varname+')"></span><span class="cd">'+l.desc+'</span>';
    cg.appendChild(row);
  });

  function renderTimeline(c){
    document.getElementById('crewTitle').innerHTML = c.equipLabel + ' — ' + c.data.split('-').reverse().join('/');
    document.getElementById('crewMeta').innerHTML =
      (c.area||'Área não informada') + ' · Turno ' + (c.turno||'—') + ' (' + (c.horario||'—') + ') · Vaga/Placa ' + (c.vaga||c.placa||'—');
    var st = document.getElementById('crewStatus');
    var full = c.completenessNum>=2;
    st.textContent = full ? 'Comparação completa' : 'Cronoanálise parcial';
    st.className = 'status-note ' + (full?'full':'partial');

    var inner = document.getElementById('tlInner'); inner.innerHTML='';
    var gmin=c.globalMin, gmax=c.globalMax;
    if (gmin==null || !isFinite(gmin) || !isFinite(gmax)){ gmin=0; gmax=1440; }  // equipe sem segmentos não pode travar o laço das marcas
    if (gmax<=gmin) gmax = gmin+60;
    var span = gmax-gmin;

    var axis = document.createElement('div'); axis.className='tl-axis';
    var spacer = document.createElement('div');
    var ticks = document.createElement('div'); ticks.className='ticks';
    var stepMin = span>600?120:60;
    var firstTick = Math.ceil(gmin/stepMin)*stepMin;
    for (var t=firstTick; t<=gmax; t+=stepMin){
      var p2 = (t-gmin)/span*100;
      var el = document.createElement('div'); el.className='tick'; el.style.left=p2+'%';
      el.textContent = fmtHM(t).split(' ')[0];
      ticks.appendChild(el);
    }
    axis.appendChild(spacer); axis.appendChild(ticks); inner.appendChild(axis);

    c.expectedRoles.forEach(function(role){
      var rd = c.roles[role] || PAPEL_VAZIO;
      var lane = document.createElement('div'); lane.className='lane';
      var label = document.createElement('div'); label.className='lane-label';
      var totalH = 0; Object.keys(rd.totals).forEach(function(k){ totalH += rd.totals[k]; });
      label.innerHTML = '<span class="role">'+role+'</span>'+
        (rd.nome ? '<span class="nome">'+rd.nome+'</span>' : '<span class="nome">—</span>')+
        (rd.segments.length ? '<span class="hrs">'+fmtH(totalH)+'</span>' : '');
      lane.appendChild(label);
      if (!rd.segments.length){
        var empty = document.createElement('div'); empty.className='lane-empty';
        empty.textContent = 'Sem cronoanálise registrada para este papel';
        lane.appendChild(empty);
      } else {
        var track = document.createElement('div'); track.className='lane-track';
        rd.segments.forEach(function(seg){
          if (seg.startMin==null) return;
          var left=(seg.startMin-gmin)/span*100, width=Math.max((seg.endMin-seg.startMin)/span*100,0.3);
          var s = document.createElement('div'); var ck = CLS_KEY[seg.cls]||'unk';
          var grupo = Crono.config.grupoDe(seg.cod);
          if (modoTl === 'grupo') {
            s.className = 'seg seg-grupo'; s.style.background = grupo.cor;
            s.textContent = seg.cod != null ? seg.cod : '';
          } else {
            s.className = 'seg '+ck;
          }
          s.style.left=left+'%'; s.style.width=width+'%';
          s.addEventListener('mousemove', function(e){
            var clsVar = CLS_VAR[seg.cls]||'--text-3';
            showTip(e, '<b>'+(seg.desc||'Não classificado')+'</b>'+fmtHM(seg.startMin)+' – '+fmtHM(seg.endMin)+
              '<br><span style="opacity:.85">Código '+(seg.cod!=null?seg.cod:'—')+' · '+grupo.nome+'</span>'+
              (seg.obs?'<br><span style="opacity:.8">'+(seg.obs||'')+'</span>':'')+
              '<div class="cls-tag" style="background:var('+clsVar+');color:#fff">'+(seg.cls||'Não classificado')+'</div>');
          });
          s.addEventListener('mouseleave', hideTip);
          track.appendChild(s);
        });
        lane.appendChild(track);
      }
      inner.appendChild(lane);
    });
  }

  function renderCompare(c){
    var grid = document.getElementById('compareGrid'); grid.innerHTML='';
    var roleStats = [];
    c.expectedRoles.forEach(function(role){
      var rd = c.roles[role] || PAPEL_VAZIO;
      var totalH=0; ['Produzindo','Improdutivo necessário','Improdutivo'].forEach(function(k){ totalH += (rd.totals[k]||0); });
      var card = document.createElement('div');
      if (!rd.segments.length){
        card.className='role-card empty'; card.textContent = role+' — sem cronoanálise registrada';
        grid.appendChild(card); return;
      }
      card.className='role-card';
      var segs = ['Produzindo','Improdutivo necessário','Improdutivo'].map(function(k){
        var pv = totalH?(100*(rd.totals[k]||0)/totalH):0; var varname=CLS_VAR[k];
        return pv>0 ? '<div style="width:'+pv+'%;background:var('+varname+')"></div>' : '';
      }).join('');
      var pProd = totalH?(100*(rd.totals['Produzindo']||0)/totalH):0;
      card.innerHTML = '<div class="rc-top"><span class="rc-role">'+role+'</span><span class="rc-hrs">'+fmtH(totalH)+'</span></div>'+
        '<div class="rc-nome">'+(rd.nome||'—')+'</div><div class="stack">'+segs+'</div>'+
        '<div class="rc-pct"><span>Produzindo <b>'+pProd.toFixed(0)+'%</b></span></div>';
      grid.appendChild(card); roleStats.push({role:role, pProd:pProd, totalH:totalH});
    });
    var wc = document.getElementById('winnerCallout');
    if (roleStats.length>=2){
      roleStats.sort(function(a,b){ return b.pProd-a.pProd; });
      var top = roleStats[0], rest = roleStats.slice(1);
      var diffTxt = rest.map(function(r){ return r.role+' ('+r.pProd.toFixed(0)+'%)'; }).join(' e ');
      wc.innerHTML = '<div class="callout"><b>'+top.role+'</b> teve o maior percentual de tempo produzindo nesta equipe, com <b>'+top.pProd.toFixed(0)+'%</b>, contra '+diffTxt+'.</div>';
    } else {
      wc.innerHTML = '<div class="callout">Ainda não há dois papéis registrados nesta equipe para comparar produtividade lado a lado.</div>';
    }
  }

  function renderObs(c){
    var wrap = document.getElementById('obsList'); wrap.innerHTML = '';
    var items = [];
    c.expectedRoles.forEach(function(role){
      var rd = c.roles[role] || PAPEL_VAZIO;
      rd.segments.forEach(function(seg){
        if (seg.obs) items.push({role:role, seg:seg});
      });
    });
    items.sort(function(a,b){ return (a.seg.startMin||0)-(b.seg.startMin||0); });
    if (!items.length){
      wrap.innerHTML = '<div class="obs-empty">Sem observações registradas para esta equipe.</div>';
      return;
    }
    items.forEach(function(it){
      var div = document.createElement('div'); div.className='obs-item';
      var time = it.seg.startMin!=null ? fmtHM(it.seg.startMin) : '—';
      div.innerHTML = '<div class="obs-meta"><b>'+it.role+'</b>'+time+'</div><div>'+it.seg.obs+'</div>';
      wrap.appendChild(div);
    });
  }

  // ---------- modo da linha do tempo: Produtividade (3 classes) ou Atividades (grupo + código) ----------
  var modoTl = 'cls';
  var GRUPOS_LEG = Crono.config.GRUPOS;
  document.getElementById('legendaGrupo').innerHTML = GRUPOS_LEG.map(function(g){
    return '<span><span class="dot" style="background:'+g.cor+'"></span>'+g.nome+'</span>';
  }).join('');
  document.querySelectorAll('#tlModo .pill').forEach(function(b){
    b.addEventListener('click', function(){
      modoTl = b.dataset.modo;
      document.querySelectorAll('#tlModo .pill').forEach(function(x){ x.classList.toggle('active', x===b); });
      document.getElementById('legendaCls').hidden = modoTl !== 'cls';
      document.getElementById('legendaGrupo').hidden = modoTl !== 'grupo';
      renderTimeline(DATA.crews[current]);
    });
  });

  // ---------- Resumo da equipe ----------
  function fmtHoras(h){ var m = Math.round(h*60); return Math.floor(m/60)+'h'+(m%60<10?'0':'')+(m%60); }
  function renderResumo(c){
    var res = Crono.resumoEquipe(c);
    var alvo = document.getElementById('resumoEquipe');
    if (!res.papeis.length){ alvo.innerHTML = '<div class="obs-empty">Sem lançamentos nesta equipe.</div>'; return; }
    var linhas = res.papeis.map(function(p){
      var barras = GRUPOS_LEG.map(function(g){
        var h = p.porGrupo[g.chave]; if (!h) return '';
        return '<div class="rs-parte" style="width:'+(100*h/p.total)+'%;background:'+g.cor+'" title="'+g.nome+': '+fmtHoras(h)+'"></div>';
      }).join('');
      var lista = GRUPOS_LEG.filter(function(g){ return p.porGrupo[g.chave]; }).map(function(g){
        return '<span><span class="dot" style="background:'+g.cor+'"></span>'+g.nome+' <b>'+fmtHoras(p.porGrupo[g.chave])+'</b></span>';
      }).join('');
      return '<div class="rs-papel"><div class="rs-topo"><b>'+p.papel+'</b> <span class="rs-nome">'+(p.nome||'—')+'</span>'+
        '<span class="rs-total">'+fmtHoras(p.total)+' · '+(p.pctProd==null?'—':p.pctProd.toFixed(0)+'% em operação')+'</span></div>'+
        '<div class="rs-barra">'+barras+'</div><div class="rs-lista">'+lista+'</div></div>';
    }).join('');
    var achados = [];
    if (res.maiorPerda){
      achados.push('<li><b>Maior perda:</b> '+fmtHoras(res.maiorPerda.horas)+' de esperas no '+res.maiorPerda.papel+
        ', principalmente o código '+res.maiorPerda.cod+' ('+res.maiorPerda.desc+').</li>');
    } else {
      achados.push('<li><b>Sem esperas</b> lançadas nesta equipe.</li>');
    }
    var comPct = res.papeis.filter(function(p){ return p.pctProd!=null; }).sort(function(a,b){ return b.pctProd-a.pctProd; });
    if (comPct.length >= 2){
      var mais = comPct[0], menos = comPct[comPct.length-1];
      achados.push('<li><b>Operação:</b> '+mais.papel+' ficou '+mais.pctProd.toFixed(0)+'% do tempo em operação; '+
        menos.papel+', '+menos.pctProd.toFixed(0)+'%.</li>');
    }
    res.alertas.forEach(function(a){ achados.push('<li class="rs-alerta"><b>Conferir:</b> '+a+'</li>'); });
    alvo.innerHTML = linhas + '<ul class="rs-achados">'+achados.join('')+'</ul>';
  }

  function select(i){ current=i; markActive(); var c=DATA.crews[i]; renderTimeline(c); renderResumo(c); renderCompare(c); renderObs(c); }
  renderCrewList();
  select(current);

  // ================= PRODUTIVIDADE SUBTABS =================
  var subBtns = document.querySelectorAll('#produtSubtabs .pill');
  subBtns.forEach(function(b){
    b.addEventListener('click', function(){
      subBtns.forEach(function(x){x.classList.remove('active');});
      b.classList.add('active');
      document.querySelectorAll('.sub-view').forEach(function(v){v.style.display='none';});
      document.getElementById('sub-'+b.dataset.sub).style.display='block';
    });
  });

  // ================= CHART PRIMITIVES =================
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs){
    var e = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function groupedBarChart(container, categories, series, opts){
    opts = opts || {};
    container.innerHTML='';
    var W = Math.max(categories.length * (opts.catWidth||78) + 70, 340);
    var H = opts.height || 230;
    var padL=42, padR=14, padT=14, padB=44;
    var plotW = W-padL-padR, plotH = H-padT-padB;
    var svg = svgEl('svg', {width:W, height:H, viewBox:'0 0 '+W+' '+H, style:'max-width:100%; display:block;'});

    [0,25,50,75,100].forEach(function(v){
      var y = padT + plotH - (v/100)*plotH;
      svg.appendChild(svgEl('line',{x1:padL,x2:W-padR,y1:y,y2:y,class:'grid-line'}));
      var lbl = svgEl('text',{x:padL-8,y:y+3,'text-anchor':'end',class:'axis-label'});
      lbl.textContent = v+'%'; svg.appendChild(lbl);
    });
    svg.appendChild(svgEl('line',{x1:padL,x2:padL,y1:padT,y2:padT+plotH,class:'axis-line'}));
    svg.appendChild(svgEl('line',{x1:padL,x2:W-padR,y1:padT+plotH,y2:padT+plotH,class:'axis-line'}));

    var groupW = plotW/categories.length;
    var nS = series.length;
    var barW = Math.min(22, groupW/(nS+1.4));

    categories.forEach(function(cat, ci){
      var gx = padL + ci*groupW + groupW/2;
      var lbl = svgEl('text',{x:gx, y:H-padB+18, 'text-anchor':'middle', class:'cat-label'});
      lbl.textContent = cat.label; svg.appendChild(lbl);
      if (cat.sub){
        var lbl2 = svgEl('text',{x:gx, y:H-padB+31, 'text-anchor':'middle', class:'axis-label'});
        lbl2.textContent = cat.sub; svg.appendChild(lbl2);
      }
      series.forEach(function(s, si){
        var val = s.values[cat.key];
        var bx = gx - (nS*barW)/2 + si*barW + barW*0.08;
        var bw = barW*0.84;
        if (val==null){
          var eh = 10;
          var rect = svgEl('rect',{x:bx,y:padT+plotH-eh,width:bw,height:eh,rx:3,fill:'none',stroke:getVar('--nodata'),'stroke-width':1.3,'stroke-dasharray':'3,2'});
          svg.appendChild(rect);
        } else {
          var bh = Math.max((val/100)*plotH, 2);
          var by = padT+plotH-bh;
          var rect = svgEl('rect',{x:bx,y:by,width:bw,height:bh,rx:3,fill:s.color});
          rect.addEventListener('mousemove', function(e){
            var extra = s.extra ? s.extra(cat.key) : '';
            var obs = s.obsFn ? s.obsFn(cat.key) : '';
            showTip(e, '<b>'+s.name+' — '+cat.label+'</b>'+val.toFixed(0)+'% produtivo'+(extra?('<br>'+extra):'')+obs);
          });
          rect.addEventListener('mouseleave', hideTip);
          svg.appendChild(rect);
        }
      });
    });
    container.appendChild(svg);
  }

  function stackedHBar(container, rows){
    container.innerHTML='';
    var W = 620, rowH = 46, gap=18, padL=110, padR=70, padT=10;
    var H = padT + rows.length*(rowH+gap);
    var svg = svgEl('svg',{width:W,height:H,viewBox:'0 0 '+W+' '+H, style:'max-width:100%; display:block;'});
    rows.forEach(function(r, i){
      var y = padT + i*(rowH+gap);
      var lbl = svgEl('text',{x:padL-10,y:y+rowH/2+4,'text-anchor':'end','font-weight':700,'font-size':13, fill:getVar('--text')});
      lbl.textContent = r.name; svg.appendChild(lbl);
      var barMaxW = W-padL-padR;
      var tot = r.segs.reduce(function(a,s){return a+s.v;},0);
      var x = padL;
      r.segs.forEach(function(s){
        var w = tot? (s.v/tot)*barMaxW : 0;
        if (w<=0) return;
        var rect = svgEl('rect',{x:x,y:y,width:w,height:rowH,rx:6,fill:s.color});
        rect.addEventListener('mousemove', function(e){
          showTip(e, '<b>'+r.name+' — '+s.label+'</b>'+s.v.toFixed(1).replace('.',',')+'h ('+(tot?(100*s.v/tot).toFixed(0):0)+'%)');
        });
        rect.addEventListener('mouseleave', hideTip);
        svg.appendChild(rect);
        if (w>34){
          var t = svgEl('text',{x:x+w/2,y:y+rowH/2+4,'text-anchor':'middle','font-size':12,'font-weight':700,fill:'#fff'});
          t.textContent = (tot?(100*s.v/tot):0).toFixed(0)+'%';
          svg.appendChild(t);
        }
        x += w;
      });
      var tlab = svgEl('text',{x:W-padR+8,y:y+rowH/2+4,'font-size':12, fill:getVar('--text-2')});
      tlab.textContent = fmtH(tot); svg.appendChild(tlab);
    });
    container.appendChild(svg);
  }

  // ---- Chart: por equipamento ----
  (function(){
    var order = ['alta_pressao','auto_vacuo','hiper_vacuo','aspirador'];
    var cats = order.map(function(k){ return {key:k, label:CH.equip[k].label}; });
    var series = ['Motorista','Operador'].map(function(rg){
      var values = {};
      cats.forEach(function(c){
        var rd = CH.equipOverall[c.key] && CH.equipOverall[c.key][rg];
        values[c.key] = (rd && rd.totalH>0) ? rd.pctProd : null;
      });
      return {name:rg, color: rg==='Motorista'?getVar('--s-motorista'):getVar('--s-operador'), values:values,
        extra: function(ckey){ var rd = CH.equipOverall[ckey] && CH.equipOverall[ckey][rg]; return rd?(fmtH(rd.totalH)+' registradas'):''; } };
    });
    groupedBarChart(document.getElementById('equipChart'), cats, series, {catWidth:130, height:240});
  })();

  // ---- Chart: por vaga (equip tabs) ----
  var equipTabsEl = document.getElementById('equipTabs');
  var equipKeys = ['alta_pressao','auto_vacuo','hiper_vacuo','aspirador'];
  var curEquip = 'alta_pressao';
  equipKeys.forEach(function(k){
    var cfg = CH.equip[k];
    var b = document.createElement('button'); b.className='pill';
    b.textContent = cfg.label; b.dataset.key = k;
    if (k===curEquip) b.classList.add('active');
    b.addEventListener('click', function(){
      equipTabsEl.querySelectorAll('.pill').forEach(function(x){x.classList.remove('active');});
      b.classList.add('active'); curEquip=k; renderVagaChart(k); renderHeatmap(k);
    });
    equipTabsEl.appendChild(b);
  });

  function renderVagaChart(key){
    var cfg = CH.equip[key];
    var container = document.getElementById('vagaChart');
    var slots = cfg.slots;
    var cats = [];
    for (var n=1;n<=slots;n++) cats.push({key:String(n), label:'Vaga '+n});
    if (cfg.vagas['ni']) cats.push({key:'ni', label:'S/ identif.'});
    var seriesDef = cfg.hasMotorista ? ['Motorista','Operador'] : ['Operador'];
    var colorMap = {'Motorista':getVar('--s-motorista'),'Operador':getVar('--s-operador')};
    var series = seriesDef.map(function(rg){
      var values = {};
      cats.forEach(function(c){
        var v = cfg.vagas[c.key];
        var rd = v && v.roleGroup && v.roleGroup[rg];
        values[c.key] = (rd && rd.totalH>0) ? rd.pctProd : null;
      });
      return {name:rg, color:colorMap[rg], values:values,
        extra: function(ckey){
          var v = cfg.vagas[ckey]; var rd = v && v.roleGroup && v.roleGroup[rg];
          return rd ? (fmtH(rd.totalH)+' registradas') : '';
        },
        obsFn: function(ckey){
          var v = cfg.vagas[ckey];
          var list = v && v.obsByRoleGroup && v.obsByRoleGroup[rg];
          return obsHtml(list);
        }
      };
    });
    groupedBarChart(container, cats, series, {catWidth:60, height:220});
  }

  function renderHeatmap(key){
    var cfg = CH.equip[key];
    var wrap = document.getElementById('heatmapWrap');
    wrap.innerHTML='';
    var roles = cfg.hasMotorista ? ['Motorista','Operador 1','Operador 2'] : ['Operador 1','Operador 2'];
    var slots = cfg.slots;
    var cols = []; for (var n=1;n<=slots;n++) cols.push(String(n));
    if (cfg.vagas['ni']) cols.push('ni');

    var table = document.createElement('table'); table.className='heat-table';
    var thead = document.createElement('tr'); thead.appendChild(document.createElement('th'));
    cols.forEach(function(c){
      var th = document.createElement('th'); th.textContent = c==='ni'?'S/id.':c;
      thead.appendChild(th);
    });
    table.appendChild(thead);

    var seqSteps = ['--seq-1','--seq-2','--seq-3','--seq-4','--seq-5','--seq-6','--seq-7'];
    function seqColor(pct){ var idx = Math.min(6, Math.floor(pct/100*7)); return getVar(seqSteps[idx]); }

    roles.forEach(function(role){
      var tr = document.createElement('tr');
      var th = document.createElement('th'); th.className='rowhead heat-rowlabel'; th.textContent = role;
      tr.appendChild(th);
      cols.forEach(function(c){
        var v = cfg.vagas[c];
        var rd = v && v.roles && v.roles[role];
        var td = document.createElement('td');
        if (!rd || !(rd.totalH>0)){
          td.className='heat-cell empty'; td.textContent='—';
        } else {
          var pct = rd.pctProd||0;
          td.className='heat-cell';
          td.style.background = seqColor(pct);
          td.style.color = pct>55 ? '#fff' : getVar('--text');
          td.textContent = pct.toFixed(0)+'%';
          td.addEventListener('mousemove', function(e){
            var obsList = v.obsByRole && v.obsByRole[role];
            showTip(e, '<b>'+role+' — Vaga '+c+'</b>'+fmtH(rd.totalH)+' registradas<br>'+pct.toFixed(0)+'% produtivo'+(rd.nome?('<br>'+rd.nome):'')+obsHtml(obsList));
          });
          td.addEventListener('mouseleave', hideTip);
        }
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    wrap.appendChild(table);

    var legend = document.getElementById('heatLegend');
    legend.innerHTML = '<span>% produtivo:</span>' + seqSteps.map(function(s,i){
      return '<span class="sw" style="background:var('+s+')"></span>'+(i*100/7).toFixed(0)+'–'+((i+1)*100/7).toFixed(0)+'%';
    }).join(' ') + '<span><span class="sw" style="background:var(--nodata-soft); border:1px dashed var(--nodata)"></span>sem dados</span>';
  }

  // ---- Chart: por turno/letra/regime ----
  function renderTurnoChart(){
    var order = ['A','B','C','D','ADM','16 Horas'];
    var cats = order.filter(function(t){ return CH.turno[t]; }).map(function(t){ return {key:t, label:t}; });
    var series = ['Motorista','Operador'].map(function(rg){
      var values = {};
      cats.forEach(function(c){
        var rd = CH.turno[c.key][rg];
        values[c.key] = (rd && rd.totalH>0) ? rd.pctProd : null;
      });
      return {name:rg, color: rg==='Motorista'?getVar('--s-motorista'):getVar('--s-operador'), values:values,
        extra: function(ckey){ var rd = CH.turno[ckey][rg]; return rd?(fmtH(rd.totalH)+' registradas'):''; },
        obsFn: function(ckey){ return obsHtml(CH.turno[ckey].obs && CH.turno[ckey].obs[rg]); } };
    });
    groupedBarChart(document.getElementById('turnoChart'), cats, series, {catWidth:90, height:220});
  }

  // ---- Chart: por horário ----
  function renderHorarioChart(){
    var order = ['07h às 17h','07h às 19h','19h às 07h','07h às 15h','15h às 23h','23h às 07h'];
    // Horários fora da lista (digitados à mão) entram no fim, para nada sumir do gráfico.
    order = order.concat(Object.keys(CH.horario).filter(function(h){ return order.indexOf(h)===-1; }).sort());
    var cats = order.filter(function(h){ return CH.horario[h]; }).map(function(h){ return {key:h, label:h.replace(' às ','–').replace(/h/g,'h')}; });
    var series = ['Motorista','Operador'].map(function(rg){
      var values = {};
      cats.forEach(function(c){
        var rd = CH.horario[c.key][rg];
        values[c.key] = (rd && rd.totalH>0) ? rd.pctProd : null;
      });
      return {name:rg, color: rg==='Motorista'?getVar('--s-motorista'):getVar('--s-operador'), values:values,
        extra: function(ckey){ var rd = CH.horario[ckey][rg]; return rd?(fmtH(rd.totalH)+' registradas'):''; },
        obsFn: function(ckey){ return obsHtml(CH.horario[ckey].obs && CH.horario[ckey].obs[rg]); } };
    });
    groupedBarChart(document.getElementById('horarioChart'), cats, series, {catWidth:110, height:220});
  }

  renderVagaChart(curEquip);
  renderHeatmap(curEquip);
  renderTurnoChart();
  renderHorarioChart();

  // ================= EQUIPAMENTOS TABLE =================
  (function(){
    var tbody = document.getElementById('equipTableBody');
    EQUIP_ORDER.forEach(function(k){
      var cfg = CH.equip[k];
      var withData = Object.keys(cfg.vagas).filter(function(vk){
        var v = cfg.vagas[vk];
        return Object.keys(v.roles||{}).some(function(role){ return v.roles[role].totalH>0; });
      }).length;
      var ov = CH.equipOverall[k] || {};
      var totalH = 0;
      ['Motorista','Operador'].forEach(function(rg){ if (ov[rg]) totalH += ov[rg].totalH; });
      var motPct = ov.Motorista ? pctstr(ov.Motorista.pctProd) : '—';
      var opPct = ov.Operador ? pctstr(ov.Operador.pctProd) : '—';
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td data-label="Equipamento" style="font-weight:700;">'+cfg.label+(k==='aspirador'?' <span class="badge badge-brand">10 vagas</span>':'')+'</td>'+
        '<td data-label="Vagas fixas">'+cfg.slots+'</td>'+
        '<td data-label="Composição">'+ROLE_LABEL[k].join(' + ')+'</td>'+
        '<td data-label="Horas lançadas">'+fmtH(totalH)+'</td>'+
        '<td data-label="Vagas com registro">'+withData+' / '+cfg.slots+'</td>'+
        '<td data-label="% Produzindo Motorista">'+motPct+'</td>'+
        '<td data-label="% Produzindo Operador">'+opPct+'</td>';
      tbody.appendChild(tr);
    });
  })();

  window.addEventListener('resize', function(){
    renderVagaChart(curEquip); renderTurnoChart(); renderHorarioChart();
    (function(){
      var order = ['alta_pressao','auto_vacuo','hiper_vacuo','aspirador'];
      var cats = order.map(function(k){ return {key:k, label:CH.equip[k].label}; });
      var series = ['Motorista','Operador'].map(function(rg){
        var values = {};
        cats.forEach(function(c){
          var rd = CH.equipOverall[c.key] && CH.equipOverall[c.key][rg];
          values[c.key] = (rd && rd.totalH>0) ? rd.pctProd : null;
        });
        return {name:rg, color: rg==='Motorista'?getVar('--s-motorista'):getVar('--s-operador'), values:values};
      });
      groupedBarChart(document.getElementById('equipChart'), cats, series, {catWidth:130, height:240});
    })();
  });
}

Crono.painel = {
  desenhar, // usado pela página de teste testes/painel-offline.html
  async iniciar() {
    const estado = document.getElementById('painelEstado');
    try {
      const regs = (await Crono.banco.listarRegistros()).map(Crono.banco.escaparRegistro);
      if (!regs.length) { estado.textContent = 'Ainda não há lançamentos neste período.'; return; }
      desenhar(Crono.calcularPainel(regs));
      estado.remove();   // só depois de desenhar: se der erro, a mensagem continua na tela
    } catch (e) {
      estado.innerHTML = Crono.esc(e.message) + ' <button type="button" class="btn" onclick="location.reload()">Tentar de novo</button>';
    }
  }
};
})();
