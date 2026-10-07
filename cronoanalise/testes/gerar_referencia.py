"""Gera testes/referencia.json: registros fictícios + painel calculado pelo Python."""
import json, os, random, sys
from datetime import date
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import gerar_demo as g

rng = random.Random(20261006)
kits = g.gerar_kits(rng, date(2026, 9, 14), date(2026, 10, 6))
regs = g.montar_registros(kits, rng)
painel = g.calcular_painel(regs, kits)
saida = [{k: v for k, v in r.items() if not k.startswith('_')} for r in regs]
destino = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'referencia.json')
with open(destino, 'w', encoding='utf-8') as f:
    json.dump({'registros': saida, 'painel': painel}, f, ensure_ascii=False)
print(len(saida), 'registros ->', destino)
