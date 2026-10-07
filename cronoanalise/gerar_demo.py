"""Gera uma cópia de demonstração do sistema oficial com dados FICTÍCIOS de cronoanálise.

Uso:  python gerar_demo.py "<sistema oficial>.html" "<saida>.html"

- Lê o sistema oficial (não altera o original).
- Cria lançamentos fictícios com os códigos novos (30+) e as 3 classificações:
  Produzindo · Improdutivo necessário · Improdutivo.
- Recalcula os blocos 'sistema-data' (painel) e 'sistema-records' (lançamentos).
"""
import json
import random
import re
import sys
from datetime import date, timedelta

PROD, NEC, IMP = 'Produzindo', 'Improdutivo necessário', 'Improdutivo'
CLS_ORDER = [PROD, NEC, IMP]

# ---------------------------------------------------------------- códigos
GERAIS = {
    1: 'Atividade (outra – descrever)', 2: 'Bater Ponto', 3: 'Trajeto (Bica/Área/Vest./Garagem)', 4: 'Café',
    5: 'Almoço / Refeição', 6: 'DDS', 7: 'Preparação / Sinalização', 8: 'Isolamento', 9: 'Descarte de Resíduos',
    10: 'PPT / ART', 11: 'Documentação / Fechamento', 12: 'Abastec. / Carreg. de Água', 13: 'Bloqueio',
    14: 'Checklist', 15: 'Retirada de Bloqueio', 16: 'Desmobilização', 17: 'Troca de Turno',
    18: 'Recolhimento de Ferramentas', 19: 'Banho', 20: 'Pausa de Segurança', 21: 'Deslocamento p/ Centro de Controle',
    22: 'Espera / Aguardando DDS', 23: 'Aguardando Liberação da Área', 24: 'Crachá Bloqueado',
    25: 'Programação Incompleta', 26: 'Aguardando Bloqueio', 27: 'Manutenção', 28: 'Aguardando Operador',
    29: 'Aguardando Cliente/Usiminas',
}
ESPECIFICOS = {
    30: 'Montagem de mangueiras, engates e laços', 31: 'Içamento e amarração de mangueira',
    32: 'Hidrojateamento – Pistola', 33: 'Hidrojateamento – Torpedo', 34: 'Hidrojateamento – Rabicho',
    35: 'Hidrojateamento – Vareta', 36: 'Hidrojateamento – Pistola cano longo',
    37: 'Auxílio ao colega (pedal, mangueira, vigia)', 38: 'Recolhimento de mangueiras e implementos',
    39: 'Troca de bico / o-ring / ajuste',
    40: 'Retirada e posicionamento de mangotes', 41: 'Içamento e fixação de mangote', 42: 'Sucção / aspiração de resíduo',
    43: 'Direcionar material ao mangote (pá, água)', 44: 'Desobstrução de mangote / válvula',
    45: 'Descarga por válvula (gravidade)', 46: 'Basculamento do tanque', 47: 'Limpeza de válvulas e bocais',
    48: 'Esvaziamento do depurador / tanquinho', 49: 'Recolhimento de mangotes', 50: 'Auxílio ao colega (sinalização, mangote)',
    55: 'Ligar cabo 440V no painel', 56: 'Instalação de mangotes', 57: 'Sucção de resíduo',
    58: 'Içamento de caçamba e máquina', 59: 'Descarregamento na baía de resíduos', 60: 'Limpeza da caçamba',
    61: 'Limpeza do filtro', 62: 'Recolhimento de mangotes e cabo', 63: 'Desobstrução de mangote', 64: 'Auxílio ao colega',
    65: 'Manobra / posicionamento do caminhão', 66: 'Operação do motor estacionário / bomba (RPM)',
    67: 'Viagem de descarte (ida e volta)', 68: 'Aguardando no caminhão (sem operação)', 69: 'Abastecimento de combustível',
}
DESC = {**GERAIS, **ESPECIFICOS}

PRODUZINDO = {1, 32, 33, 34, 35, 36, 37, 42, 43, 50, 57, 64, 66}
IMPRODUTIVO = set(range(22, 30)) | {44, 63, 68}


def classe(cod):
    if cod in PRODUZINDO:
        return PROD
    if cod in IMPRODUTIVO:
        return IMP
    return NEC


# ---------------------------------------------------------------- equipes
EQUIP = {
    'ap': {'nome': 'Alta Pressão', 'chave': 'alta_pressao', 'label': 'Alta Pressão', 'vaga': 'AP', 'slots': 10,
           'papeis': ['MOT', 'OP1', 'OP2']},
    'av': {'nome': 'Vácuo', 'chave': 'auto_vacuo', 'label': 'Auto Vácuo', 'vaga': 'AV', 'slots': 8,
           'papeis': ['MOT', 'OP1']},
    'hv': {'nome': 'Hiper Vácuo', 'chave': 'hiper_vacuo', 'label': 'Hiper Vácuo', 'vaga': 'HV', 'slots': 4,
           'papeis': ['MOT', 'OP1', 'OP2']},
    'as': {'nome': 'Aspirador de Pó', 'chave': 'aspirador', 'label': 'Aspirador', 'vaga': 'ASP', 'slots': 10,
           'papeis': ['OP1', 'OP2']},
}
PAPEL_NOME = {'MOT': 'Motorista', 'OP1': 'Operador 1', 'OP2': 'Operador 2'}
SUPERVISORES = [('Ozias', 'A'), ('Matusalém', 'B'), ('Israel', 'C'), ('Fábio', 'D'),
                ('Júnior Pereira', 'ADM'), ('Genésio', 'ADM'), ('Donizete', 'ADM')]
NOMES = ['Carlos Andrade', 'Rafael Moura', 'Diego Pacheco', 'Lucas Ferreira', 'Bruno Teixeira', 'Thiago Rocha',
         'Marcelo Duarte', 'Anderson Lima', 'Gustavo Prado', 'Felipe Nogueira', 'Rodrigo Campos', 'Leandro Souza',
         'Paulo Ribeiro', 'Vinícius Alves', 'Eduardo Martins', 'Júlio Cardoso', 'Renato Barros', 'Fábio Mendes',
         'Sérgio Pinto', 'Alexandre Reis', 'Wellington Costa', 'Mateus Freitas', 'Igor Batista', 'Danilo Araújo']
AREAS = ['Alto Forno 1', 'Alto Forno 3', 'Aciaria 2', 'Coqueria 3', 'Sinterização 2', 'Laminação a Quente',
         'Calcinação', 'ETE Central', 'Galeria de Cabos – Aciaria', 'Pátio de Carvão']
OBS_ESPERA = {
    23: ['Área sem PT liberada', 'Operação da área atrasou a liberação'],
    25: ['Programação veio sem local definido'],
    26: ['Aguardando eletricista para bloqueio'],
    27: ['Bomba com vazamento, acionada a Servitec', 'Pneu com avaria'],
    28: ['Operador foi buscar EPI no almoxarifado'],
    29: ['Cliente pediu para parar a limpeza'],
}

TODOS = object()


def fase(nome, dur, mapa, fill=None):
    """Uma etapa do dia. 'mapa' diz o que CADA função faz nessa etapa:
    código (int), (código, 'Exec'/'Aux') ou lista de opções [(código, exec_aux, peso)] que se alternam."""
    return {'nome': nome, 'dur': dur, 'mapa': mapa, 'fill': fill}


def mix(*opcoes):
    return list(opcoes)


def esperas(rng):
    lista = []
    if rng.random() < .6:
        lista.append(fase('esp', (15, 60), {'MOT': mix((23, None, 6), (68, None, 4)), TODOS: 23}))
    if rng.random() < .25:
        cod = rng.choice([25, 26, 29])
        lista.append(fase('esp2', (15, 40), {'MOT': 68, TODOS: cod}))
    return lista


def roteiro(tipo, rng):
    """Sequência de etapas do dia, com o que cada função (MOT, OP1, OP2) faz em cada uma."""
    r = [fase('ponto', (5, 10), {TODOS: 2}),
         fase('dds', (15, 30), {TODOS: 6}),
         fase('check', (20, 35), {'MOT': 14, 'OP1': 14, 'OP2': mix((14, 'Exec', 6), (18, 'Exec', 4))})]
    if tipo == 'ap':
        i1, i2 = rng.sample([32, 32, 33, 34, 35, 36], 2)
        r += [fase('bica', (25, 45), {'MOT': 12, 'OP1': mix((3, 'Exec', 6), (4, 'Exec', 4)), 'OP2': 3}),
              fase('traj', (15, 35), {TODOS: 3})]
        r += esperas(rng)
        r += [fase('ppt', (20, 40), {'MOT': mix((10, None, 5), (68, None, 5)), 'OP1': 10, 'OP2': mix((10, 'Exec', 7), (13, 'Exec', 3))}),
              fase('sinal', (15, 25), {'MOT': 65, 'OP1': (7, 'Exec'), 'OP2': (8, 'Exec')}),
              fase('mont', (20, 40), {'MOT': mix((30, None, 5), (68, None, 5)), 'OP1': (30, 'Exec'), 'OP2': mix((31, 'Exec', 6), (30, 'Exec', 4))}),
              fase('prod1', None, {'MOT': mix((66, None, 8), (68, None, 2)),
                                   'OP1': mix((i1, 'Exec', 8), (20, 'Exec', 1), (39, 'Exec', 1)),
                                   'OP2': mix((37, 'Aux', 8), (20, 'Aux', 2))}, fill=.5),
              fase('almoco', (60, 60), {TODOS: 5})]
        if rng.random() < .3:
            r.append(fase('comb', (15, 30), {'MOT': 69, 'OP1': 28, 'OP2': 28}))
        if rng.random() < .15:
            r.append(fase('manut', (30, 80), {'MOT': 27, TODOS: 27}))
        r += [fase('prod2', None, {'MOT': mix((66, None, 8), (68, None, 2)),
                                   'OP1': mix((37, 'Aux', 8), (20, 'Aux', 2)),
                                   'OP2': mix((i2, 'Exec', 8), (39, 'Exec', 1), (20, 'Exec', 1))}, fill=.5),
              fase('recolhe', (20, 35), {'MOT': 38, 'OP1': (38, 'Exec'), 'OP2': (18, 'Exec')}),
              fase('trajret', (15, 30), {TODOS: 3}),
              fase('doc', (10, 20), {'MOT': 11, 'OP1': 11, 'OP2': 16}),
              fase('banho', (15, 25), {'MOT': 16, TODOS: 19})]
    elif tipo in ('av', 'hv'):
        descarga = 45 if tipo == 'av' else 46
        if tipo == 'av':
            r.append(fase('depur', (15, 30), {'MOT': 48, 'OP1': (48, 'Aux')}))
        r.append(fase('traj', (15, 35), {TODOS: 3}))
        r += esperas(rng)
        r += [fase('ppt', (20, 40), {'MOT': mix((10, None, 5), (68, None, 5)), TODOS: 10}),
              fase('manobra', (10, 20), {'MOT': 65, 'OP1': (7, 'Exec'), 'OP2': (8, 'Exec')}),
              fase('mangote', (20, 35), {'MOT': mix((40, None, 6), (41, None, 4)), 'OP1': (40, 'Exec'), 'OP2': mix((41, 'Exec', 5), (40, 'Exec', 5))}),
              fase('suc1', None, {'MOT': mix((66, None, 8), (68, None, 2)),
                                  'OP1': mix((42, 'Exec', 7), (43, 'Exec', 2), (20, 'Exec', 1)),
                                  'OP2': mix((43, 'Aux', 5), (50, 'Aux', 4), (20, 'Aux', 1))}, fill=.35)]
        if rng.random() < .35:
            r.append(fase('desob', (15, 40), {'MOT': 68, 'OP1': (44, 'Exec'), 'OP2': (50, 'Aux')}))
        r += [fase('almoco', (60, 60), {TODOS: 5}),
              fase('suc2', None, {'MOT': mix((66, None, 8), (68, None, 2)),
                                  'OP1': mix((50, 'Aux', 5), (43, 'Aux', 4), (20, 'Aux', 1)) if tipo == 'hv'
                                  else mix((42, 'Exec', 6), (43, 'Exec', 3), (20, 'Exec', 1)),
                                  'OP2': mix((42, 'Exec', 7), (43, 'Exec', 2), (20, 'Exec', 1))}, fill=.35),
              fase('viagem', (30, 50), {'MOT': 67, TODOS: 3}),
              fase('descarga', (15, 30), {'MOT': descarga, 'OP1': (descarga, 'Aux'), 'OP2': (8, 'Exec')}),
              fase('limpv', (10, 20), {'MOT': 68, 'OP1': (47, 'Exec'), 'OP2': (47, 'Aux')}),
              fase('suc3', None, {'MOT': mix((66, None, 8), (68, None, 2)),
                                  'OP1': mix((42, 'Exec', 7), (43, 'Exec', 3)),
                                  'OP2': mix((50, 'Aux', 6), (43, 'Aux', 4))}, fill=.3),
              fase('recolhe', (15, 25), {'MOT': 49, 'OP1': (49, 'Exec'), 'OP2': (18, 'Exec')}),
              fase('trajret', (15, 30), {TODOS: 3}),
              fase('doc', (10, 20), {'MOT': 11, 'OP1': 11, 'OP2': 16}),
              fase('banho', (15, 25), {'MOT': 16, TODOS: 19})]
    else:  # aspirador: só operadores
        r.append(fase('traj', (15, 35), {TODOS: 3}))
        r += esperas(rng)
        r += [fase('ppt', (20, 40), {'OP1': 10, 'OP2': mix((10, 'Exec', 6), (13, 'Exec', 4))}),
              fase('cabo', (10, 20), {'OP1': (55, 'Exec'), 'OP2': (8, 'Exec')}),
              fase('mangote', (20, 30), {'OP1': (56, 'Exec'), 'OP2': (56, 'Aux')}),
              fase('suc1', None, {'OP1': mix((57, 'Exec', 8), (63, 'Exec', 1), (20, 'Exec', 1)),
                                  'OP2': mix((64, 'Aux', 8), (20, 'Aux', 2))}, fill=.5),
              fase('almoco', (60, 60), {TODOS: 5}),
              fase('suc2', None, {'OP1': mix((64, 'Aux', 8), (20, 'Aux', 2)),
                                  'OP2': mix((57, 'Exec', 8), (63, 'Exec', 1), (20, 'Exec', 1))}, fill=.5),
              fase('icam', (15, 30), {'OP1': (58, 'Exec'), 'OP2': (8, 'Exec')}),
              fase('descarr', (20, 35), {'OP1': (59, 'Exec'), 'OP2': (59, 'Aux')}),
              fase('limpc', (15, 25), {'OP1': (60, 'Exec'), 'OP2': (61, 'Exec')}),
              fase('recolhe', (15, 25), {'OP1': (62, 'Exec'), 'OP2': (18, 'Exec')}),
              fase('doc', (10, 20), {'OP1': 11, 'OP2': 16}),
              fase('banho', (15, 25), {TODOS: 19})]
    return r


def pedacos(valor, papel, duracao, rng):
    """Transforma o que a função faz numa etapa em pedaços (código, exec/aux, minutos)."""
    padrao_ea = None if papel == 'MOT' else 'Exec'
    if isinstance(valor, int):
        return [(valor, padrao_ea, duracao)]
    if isinstance(valor, tuple):
        return [(valor[0], valor[1] if papel != 'MOT' else None, duracao)]
    saida, resto = [], duracao
    pesos = [o[2] for o in valor]
    while resto > 0:
        bloco = min(resto, rng.randint(3, 9) * 5)
        if resto - bloco < 10:
            bloco = resto
        cod, ea, _ = rng.choices(valor, weights=pesos)[0]
        ea = None if papel == 'MOT' else (ea or 'Exec')
        if saida and saida[-1][0] == cod:
            saida[-1] = (cod, ea, saida[-1][2] + bloco)
        else:
            saida.append((cod, ea, bloco))
        resto -= bloco
    return saida


# ---------------------------------------------------------------- geração
def hhmm(m):
    m %= 1440
    return f'{m // 60:02d}:{m % 60:02d}'


def gerar_kits(rng, inicio, fim):
    kits, d, n = [], inicio, 0
    tipos = ['ap', 'ap', 'av', 'av', 'hv', 'as', 'as']
    while d <= fim:
        if d.weekday() != 6:  # sem domingo
            tipo = rng.choice(tipos)
            sup, turno = rng.choice(SUPERVISORES)
            if turno == 'ADM':
                horario, ini_min, dur = '07h às 17h', 7 * 60, 600
            elif rng.random() < .65:
                horario, ini_min, dur = '07h às 19h', 7 * 60, 720
            else:
                horario, ini_min, dur = '19h às 07h', 19 * 60, 720
            n += 1
            sufixo = ''.join(rng.choice('ABCDEFGHJKMNPQRSTUVWXYZ23456789') for _ in range(4))
            kits.append({'tipo': tipo, 'data': d.isoformat(), 'turno': turno, 'horario': horario,
                         'supervisor': sup, 'ini': ini_min, 'dur': dur,
                         'vaga': f"{EQUIP[tipo]['vaga']}-{rng.randint(1, EQUIP[tipo]['slots']):02d}",
                         'area': rng.choice(AREAS),
                         'codigo': f"CR-{d.strftime('%y%m%d')}-{sufixo}"})
        d += timedelta(days=1)
    return kits


def montar_registros(kits, rng):
    registros, seq = [], 0
    faltantes = set(rng.sample(range(len(kits)), 3))  # 3 kits com uma folha ainda não lançada
    for k_i, kit in enumerate(kits):
        eq = EQUIP[kit['tipo']]
        fases = roteiro(kit['tipo'], rng)
        fixas = {id(f): rng.randint(*f['dur']) for f in fases if f['dur']}
        sobra = kit['dur'] - sum(fixas.values())
        total_fill = sum(f['fill'] for f in fases if f['fill'])
        dur_de = {id(f): fixas.get(id(f)) or max(20, round(sobra * f['fill'] / total_fill / 5) * 5) for f in fases}
        nomes = rng.sample(NOMES, len(eq['papeis']))
        papeis = list(eq['papeis'])
        if k_i in faltantes:
            papeis.pop(rng.randrange(len(papeis)))
        for papel in papeis:
            nome = nomes[eq['papeis'].index(papel)]
            t = kit['ini'] + (0 if papel == 'MOT' else rng.choice([0, 5, 10]))
            for f in fases:
                # cada função tem o seu ritmo: a mesma etapa dura um pouco mais ou menos para cada um
                d = max(5, dur_de[id(f)] + rng.choice([-10, -5, 0, 5, 10]))
                valor = f['mapa'].get(papel, f['mapa'].get(TODOS))
                for cod, ea, minutos in pedacos(valor, papel, d, rng):
                    obs = None
                    if cod in OBS_ESPERA and rng.random() < .7:
                        obs = rng.choice(OBS_ESPERA[cod])
                    registros.append({
                        'seq': seq, 'data': kit['data'], 'turno': kit['turno'], 'horario': kit['horario'],
                        'area': kit['area'], 'nome': nome, 'papel': PAPEL_NOME[papel], 'placa': None,
                        'vaga': kit['vaga'], 'equip': eq['nome'], 'hi': hhmm(t), 'hf': hhmm(t + minutos),
                        'cod': cod, 'desc': DESC[cod], 'cls': classe(cod), 'obs': obs, 'row': None,
                        'kit': kit['codigo'], 'folha': f"{kit['codigo']}-{papel}", 'execAux': ea,
                        'supervisor': kit['supervisor'], '_ini': t, '_fim': t + minutos,
                    })
                    seq += 1
                    t += minutos
    return registros


# ---------------------------------------------------------------- totais do painel
def zero():
    return {c: 0.0 for c in CLS_ORDER}


def resumo(tot):
    total = round(sum(tot.values()), 2)
    return {'totals': {c: round(v, 2) for c, v in tot.items()}, 'totalH': total,
            'pctProd': (100 * tot[PROD] / total) if total else None}


def grupo(papel):
    return 'Motorista' if papel == 'Motorista' else 'Operador'


def calcular_painel(registros, kits):
    crews, cid = [], 0
    eq_por_nome = {e['nome']: e for e in EQUIP.values()}
    for kit in kits:
        eq = EQUIP[kit['tipo']]
        regs = [r for r in registros if r['kit'] == kit['codigo']]
        esperados = [PAPEL_NOME[p] for p in eq['papeis']]
        roles = {}
        for papel in esperados:
            segs = [r for r in regs if r['papel'] == papel]
            if not segs:
                continue
            tot = zero()
            seg_out = []
            for r in segs:
                tot[r['cls']] += (r['_fim'] - r['_ini']) / 60
                s = {k: v for k, v in r.items() if not k.startswith('_')}
                s.update(startMin=r['_ini'], endMin=r['_fim'])
                seg_out.append(s)
            roles[papel] = {'nome': segs[0]['nome'], 'segments': seg_out,
                            'totals': {c: round(v, 2) for c, v in tot.items()}}
        todos = [s for r in roles.values() for s in r['segments']]
        crews.append({'id': cid, 'data': kit['data'], 'equip': eq['nome'], 'equipLabel': eq['label'],
                      'vaga': kit['vaga'], 'placa': None, 'area': kit['area'], 'turno': kit['turno'],
                      'horario': kit['horario'], 'expectedRoles': esperados, 'roles': roles,
                      'rolesWithData': list(roles.keys()), 'completenessNum': len(roles),
                      'completenessDen': len(esperados),
                      'globalMin': min(s['startMin'] for s in todos), 'globalMax': max(s['endMin'] for s in todos),
                      'kit': kit['codigo'], 'supervisor': kit['supervisor']})
        cid += 1
    crews.sort(key=lambda c: c['data'], reverse=True)
    for i, c in enumerate(crews):
        c['id'] = i

    por_cls = zero()
    for r in registros:
        por_cls[r['cls']] += (r['_fim'] - r['_ini']) / 60
    completos = sum(1 for c in crews if c['completenessNum'] >= c['completenessDen'])
    overall = {'totalHoras': round(sum(por_cls.values()), 2), 'totalRegistros': len(registros),
               'porClassificacao': {c: round(v, 2) for c, v in por_cls.items()},
               'totalCrews': len(crews), 'crewsCompletos': completos, 'crewsIncompletos': len(crews) - completos}

    def acumula(alvo, chave, r, h):
        alvo.setdefault(chave, zero())
        alvo[chave][r['cls']] += h

    eq_chart = {e['chave']: {'label': e['label'], 'slots': e['slots'], 'hasMotorista': 'MOT' in e['papeis'],
                             'vagas': {}} for e in EQUIP.values()}
    vaga_rg, vaga_role, vaga_nome, vaga_obs_rg, vaga_obs_role = {}, {}, {}, {}, {}
    turno_rg, turno_obs, hor_rg, hor_obs, eq_rg, role_rg = {}, {}, {}, {}, {}, {}
    for r in registros:
        h = (r['_fim'] - r['_ini']) / 60
        e = eq_por_nome[r['equip']]
        ek = e['chave']
        vk = (ek, str(int(r['vaga'].split('-')[1])))
        rg = grupo(r['papel'])
        acumula(vaga_rg.setdefault(vk, {}), rg, r, h)
        acumula(vaga_role.setdefault(vk, {}), r['papel'], r, h)
        vaga_nome.setdefault(vk, {})[r['papel']] = r['nome']
        acumula(turno_rg.setdefault(r['turno'], {}), rg, r, h)
        acumula(hor_rg.setdefault(r['horario'], {}), rg, r, h)
        acumula(eq_rg.setdefault(ek, {}), rg, r, h)
        acumula(role_rg, rg, r, h)
        if r['obs']:
            item = {'texto': r['obs'], 'meta': f"{r['data']} {r['hi']}"}
            vaga_obs_rg.setdefault(vk, {}).setdefault(rg, []).append(item)
            vaga_obs_role.setdefault(vk, {}).setdefault(r['papel'], []).append(item)
            turno_obs.setdefault(r['turno'], {}).setdefault(rg, []).append(item)
            hor_obs.setdefault(r['horario'], {}).setdefault(rg, []).append(item)

    for (ek, n), grupos in vaga_rg.items():
        eq_chart[ek]['vagas'][n] = {
            'roleGroup': {g: resumo(grupos.get(g, zero())) for g in ('Motorista', 'Operador')},
            'roles': {p: {**resumo(t), 'nome': vaga_nome[(ek, n)][p]} for p, t in vaga_role[(ek, n)].items()},
            'obsByRoleGroup': vaga_obs_rg.get((ek, n), {}),
            'obsByRole': vaga_obs_role.get((ek, n), {}),
        }

    def por_chave(acc, obs):
        return {k: {'obs': obs.get(k, {}), **{g: resumo(v.get(g, zero())) for g in ('Motorista', 'Operador')}}
                for k, v in acc.items()}

    charts = {
        'clsOrder': CLS_ORDER,
        'equip': eq_chart,
        'turno': por_chave(turno_rg, turno_obs),
        'horario': por_chave(hor_rg, hor_obs),
        'equipOverall': {ek: {g: resumo(eq_rg.get(ek, {}).get(g, zero())) for g in ('Motorista', 'Operador')}
                         for ek in eq_chart},
        'overallRole': {g: resumo(role_rg.get(g, zero())) for g in ('Motorista', 'Operador')},
    }
    timeline = {
        'equipConfig': {e['nome']: {'label': e['label'], 'roles': [PAPEL_NOME[p] for p in e['papeis']]}
                        for e in EQUIP.values()},
        'crews': crews,
        'overall': overall,
        'legend': [{'cod': c, 'desc': DESC[c], 'cls': classe(c)} for c in sorted(DESC)],
    }
    return {'timeline': timeline, 'charts': charts}


# ---------------------------------------------------------------- textos da tela
def renomear_classificacoes(html):
    trocas = [
        ("'Produtivo'", "'Produzindo'"), ("'Necessário'", "'Improdutivo necessário'"),
        ('"Produtivo"', '"Produzindo"'), ('"Necessário"', '"Improdutivo necessário"'),
        ('>Produtivo<', '>Produzindo<'), ('>Necessário<', '>Improdutivo necessário<'),
        ('% Produtivo', '% Produzindo'), ('<span>Produtivo <b>', '<span>Produzindo <b>'),
        ('Tempo produtivo (geral)', 'Tempo produzindo (geral)'),
        ('produtivo de ', 'produzindo de '), ('tempo produtivo', 'tempo produzindo'),
        ("'gps-lancamentos-v1'", "'gps-lancamentos-demo-v1'"),
    ]
    for a, b in trocas:
        html = html.replace(a, b)
    return html


FAIXA_DEMO = ('<div style="position:sticky;top:0;z-index:9999;background:#B42318;color:#fff;text-align:center;'
              'font:700 13px/1.4 sans-serif;padding:6px 10px">DEMONSTRAÇÃO – DADOS FICTÍCIOS de cronoanálise '
              '(classificação: Produzindo · Improdutivo necessário · Improdutivo)</div>')


def main(origem, destino):
    html = open(origem, encoding='utf-8').read()
    rng = random.Random(20261006)
    kits = gerar_kits(rng, date(2026, 9, 14), date(2026, 10, 6))
    registros = montar_registros(kits, rng)
    painel = calcular_painel(registros, kits)
    registros_out = [{k: v for k, v in r.items() if not k.startswith('_')} for r in registros]

    def bloco(nome, conteudo):
        nonlocal html
        padrao = re.compile(r'(<script id="' + nome + r'" type="application/json">)(.*?)(</script>)', re.S)
        assert padrao.search(html), nome
        texto = json.dumps(conteudo, ensure_ascii=False).replace('</', '<\\/')
        html = padrao.sub(lambda m: m.group(1) + texto + m.group(3), html, count=1)

    # 1º troca os textos da tela (fora dos dados), depois injeta os dados novos
    html = renomear_classificacoes(html)
    bloco('sistema-data', painel)
    bloco('sistema-records', registros_out)
    assert '<header class="app-header">' in html
    html = html.replace('<header class="app-header">', FAIXA_DEMO + '<header class="app-header">', 1)
    open(destino, 'w', encoding='utf-8').write(html)
    print(f'{len(kits)} kits | {len(registros)} lancamentos | '
          f"{painel['timeline']['overall']['crewsCompletos']} equipes completas -> {destino}")


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
