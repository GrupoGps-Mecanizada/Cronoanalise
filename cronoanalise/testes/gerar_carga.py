"""Prepara a carga dos registros FICTÍCIOS (testes/referencia.json) para a tabela crono_registros.

Uso:  python -I testes/gerar_carga.py <pasta-de-saida>
Grava carga-1.json, carga-2.json… (200 linhas cada) fora do repositório, para enviar pela API pública
(POST /rest/v1/crono_registros). Todas as linhas saem com ficticio = true.
"""
import json, os, sys

ref = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'referencia.json'), encoding='utf-8'))
COLUNAS = {'data': 'data', 'turno': 'turno', 'horario': 'horario', 'area': 'area', 'nome': 'nome', 'papel': 'papel',
           'placa': 'placa', 'vaga': 'vaga', 'equip': 'equip', 'hi': 'hi', 'hf': 'hf', 'cod': 'cod', 'desc': 'descricao',
           'cls': 'cls', 'obs': 'obs', 'execAux': 'exec_aux', 'supervisor': 'supervisor', 'kit': 'kit', 'folha': 'folha'}
E_A = {'Exec': 'E', 'Aux': 'A', 'E': 'E', 'A': 'A', None: None}  # a DEMO grava Exec/Aux; o banco aceita E/A
linhas = [dict({COLUNAS[k]: r.get(k) for k in COLUNAS}, ficticio=True) for r in ref['registros']]
for l in linhas:
    l['exec_aux'] = E_A[l['exec_aux']]
assert len(linhas) == 974 and all(l['hi'] and l['hf'] and l['papel'] and l['equip'] for l in linhas)
saida = sys.argv[1]
os.makedirs(saida, exist_ok=True)
for i in range(0, len(linhas), 200):
    with open(os.path.join(saida, f'carga-{i // 200 + 1}.json'), 'w', encoding='utf-8') as f:
        json.dump(linhas[i:i + 200], f, ensure_ascii=False)
print(len(linhas), 'linhas em', (len(linhas) + 199) // 200, 'arquivos ->', saida)
