# Sistema de Cronoanálise — Especificação

Data: 06/10/2026 · Status: aprovada · Revisão 2 (06/10/2026)

> **Revisão 2 – o que mudou depois da aprovação**
> - Sem sorteio: o supervisor escolhe a **vaga** (AP-01..10, AV-01..08, HV-01..04, ASP-01..10) e o **supervisor** (Ozias=A, Matusalém=B, Israel=C, Fábio=D, Júnior Pereira/Genésio/Donizete=ADM; o turno sai marcado sozinho).
> - Sem colunas de implemento e Exec./Aux.: viraram códigos. AP: 32 Pistola, 33 Torpedo, 34 Rabicho, 35 Vareta, 36 Cano longo, 37 Auxílio ao colega, 38 Recolhimento, 39 Troca de bico/o-ring. Vácuo: +50 Auxílio ao colega. Aspirador: +64 Auxílio ao colega.
> - Motorista também ajuda: AP-MOT ganha 30, 31, 38; AV-MOT e HV-MOT ganham 40, 41, 49.
> - Legenda vai no **verso** de cada folha, com letra grande e exemplo de preenchimento. Imprimir frente e verso.
> - ID gerado na página (CR-AAMMDD-XXXX), sem gravar no banco por enquanto. As tabelas 6.2 a 6.6 abaixo são da versão 1.

## 1. Objetivo

Medir como cada função da equipe usa o tempo do turno (Produtivo, Necessário, Improdutivo) em 4 equipamentos: Alta Pressão (AP), Auto Vácuo (AV), Hiper Vácuo (HV) e Aspirador de Pó (AS).

O supervisor sorteia 1 equipamento por dia e imprime um **kit de folhas** com ID único. Cada funcionário preenche a própria folha à mão. Depois as folhas são lançadas no sistema pelo ID. As folhas do mesmo kit ficam ligadas, o que permite comparar Motorista × OP1 × OP2 na mesma janela de tempo.

**Sucesso =** nenhuma folha com ID repetido, todo lançamento ligado ao kit certo, código errado barrado na digitação, e o Excel exportado encaixando na planilha de lançamentos que já existe.

## 2. Decisões tomadas com o usuário

| Tema | Decisão |
|---|---|
| Códigos | Manter os códigos 1–29 atuais e acrescentar códigos de etapa (30+) tirados dos procedimentos |
| Onde roda | HTML + Supabase (plano grátis), projeto **PRODUTIVIDADE** (`mfsyrsegkvjmefcdaegh`) |
| Motorista | Folha própria com os quadros **Abastecimento na bica** e **Viagens de descarte** (este só no AV e no HV) |
| Sorteio | Livre (pode repetir) |
| Quem preenche | O próprio funcionário: letra grande, folha simples |
| Chaves | Só URL + chave `publishable` no navegador. A chave secreta nunca é usada. Recomendado gerar uma nova, porque ela foi colada no chat |

## 3. Equipes e folhas (7 modelos)

| Equipamento | Folhas do kit | Modelos |
|---|---|---|
| Alta Pressão | MOT, OP1, OP2 | `AP-MOT`, `AP-OP` (☐OP1 ☐OP2) |
| Auto Vácuo | MOT, OP1 | `AV-MOT`, `AV-OP` |
| Hiper Vácuo | MOT, OP1, OP2 | `HV-MOT`, `HV-OP` (☐OP1 ☐OP2) |
| Aspirador | OP1, OP2 | `AS-OP` (☐OP1 ☐OP2), sem motorista |

Títulos impressos:
- CRONOANÁLISE – MOTORISTA DE ALTA PRESSÃO
- CRONOANÁLISE – OPERADOR DE ALTA PRESSÃO
- CRONOANÁLISE – MOTORISTA DE AUTO VÁCUO
- CRONOANÁLISE – OPERADOR DE AUTO VÁCUO
- CRONOANÁLISE – MOTORISTA DE HIPER VÁCUO
- CRONOANÁLISE – OPERADOR DE HIPER VÁCUO
- CRONOANÁLISE – OPERADOR DE ASPIRADOR DE PÓ

Nas folhas de operador, o quadrado OP1/OP2 já sai **marcado pelo sistema** de acordo com a folha. Assim, ninguém troca.

## 4. ID único

- **Kit:** `CR-0001`, `CR-0002`… O número vem de uma sequência do banco, então nunca se repete, mesmo com dois PCs imprimindo ao mesmo tempo.
- **Folha:** ID do kit + papel, por exemplo `CR-0123-MOT`, `CR-0123-OP1`, `CR-0123-OP2`.
- **QR code** no canto da folha. Ele guarda o endereço do sistema com `?folha=CR-0123-OP1`, e ler pelo celular abre direto a tela de lançamento. Enquanto o sistema não estiver publicado na internet, o QR guarda só o ID.
- O ID também sai impresso em letra grande, para digitar à mão.

## 5. Folha impressa (A4 retrato, 1 página)

**Cabeçalho (todas):** logo SGE · título · ID + QR · Data · Turno (☐A ☐B ☐C ☐D ☐ADM) · Horário (☐07–17 ☐07–19 ☐19–07 ☐07–15 ☐15–23 ☐23–07) · Nome · Matrícula · Área · Placa e Vaga (já impressas pelo sorteio) · ☐OP1 ☐OP2 (só operador).

**Operador: 22 linhas.**

| Hora início | Hora fim | Cód. | Implemento | E/A | Observação |
|---|---|---|---|---|---|

- *Implemento:* AP = Pistola, Torpedo, Rabicho, Vareta, Cano longo; AV/HV/AS = Mangote. A folha imprime as siglas para circular.
- *E/A:* E = executando, A = auxiliando.

**Motorista: 16 linhas.**

| Hora início | Hora fim | Cód. | Observação |
|---|---|---|---|

Mais os quadros:
- **Abastecimento na bica** (4 linhas): Chegada | Saída | Nº de cargas.
- **Viagens de descarte** (só AV e HV, 5 linhas): Saída da área | Chegada na baía | Local | ☐Válvula ☐Basculamento | Retorno.

**Rodapé:** legenda só com os códigos válidos daquela folha · "Assinatura do funcionário" · "Visto do supervisor".

## 6. Códigos

### 6.1 Gerais (1–29): continuam iguais e aparecem em todas as folhas

| Cód | Descrição | Classificação |
|---|---|---|
| 1 | Atividade (outra — descrever na obs.) | Produtivo |
| 2 | Bater Ponto | Necessário |
| 3 | Trajeto (Bica/Área/Vest./Garagem) | Necessário |
| 4 | Café | Necessário |
| 5 | Almoço / Refeição | Necessário |
| 6 | DDS | Necessário |
| 7 | Preparação/Sinalização/Isolamento | Necessário |
| 8 | Isolamento | Necessário |
| 9 | Descarte de Resíduos | Necessário |
| 10 | PPT / ART | Necessário |
| 11 | Documentação / Fecham. Doc. | Necessário |
| 12 | Abastec. / Carreg. de Água | Necessário |
| 13 | Bloqueio | Necessário |
| 14 | Checklist | Necessário |
| 15 | Retirada de Bloqueio | Necessário |
| 16 | Desmobilização | Necessário |
| 17 | Troca de Turno | Necessário |
| 18 | Recolhimento de Ferramentas | Necessário |
| 19 | Banho | Necessário |
| 20 | Pausa de Segurança | Necessário |
| 21 | Deslocamento p/ Centro de Controle | Necessário |
| 22 | Espera / Aguardando DDS | Improdutivo |
| 23 | Aguardando Liberação da Área | Improdutivo |
| 24 | Crachá Bloqueado | Improdutivo |
| 25 | Programação Incompleta | Improdutivo |
| 26 | Aguardando Bloqueio | Improdutivo |
| 27 | Manutenção | Improdutivo |
| 28 | Aguardando Operador | Improdutivo |
| 29 | Aguardando Cliente/Usiminas | Improdutivo |

O código 1 continua existindo para não quebrar o histórico, mas nas folhas novas o certo é usar as etapas abaixo.

### 6.2 Alta Pressão — operador (30–37) · fonte: P0 Alta Pressão REV02

| Cód | Descrição | Classificação |
|---|---|---|
| 30 | Montagem de mangueiras, engates e laços tipo 8 | Necessário |
| 31 | Içamento e amarração de mangueira | Necessário |
| 32 | Hidrojateamento com pistola | Produtivo |
| 33 | Hidrojateamento com torpedo / rabicho | Produtivo |
| 34 | Hidrojateamento com vareta / pistola cano longo | Produtivo |
| 35 | Auxílio ao executante (pedal, mangueira, vigia) | Produtivo |
| 36 | Recolhimento de mangueiras e implementos | Necessário |
| 37 | Troca de bico / o-ring / ajuste de implemento | Necessário |

### 6.3 Vácuo — Auto Vácuo e Hiper Vácuo (40–49) · fonte: Procedimento Altovácuo REV04 e POLM 06

| Cód | Descrição | Classificação | Folhas |
|---|---|---|---|
| 40 | Retirada e posicionamento de mangotes (emendas, amarração) | Necessário | AV-OP, HV-OP |
| 41 | Içamento e fixação de mangote | Necessário | AV-OP, HV-OP |
| 42 | Sucção / aspiração de resíduo (controle do mangote) | Produtivo | AV-OP, HV-OP |
| 43 | Direcionar material ao mangote (pá, enxada, água) | Produtivo | AV-OP, HV-OP |
| 44 | Desobstrução de mangote / válvula | Improdutivo | AV-OP, HV-OP |
| 45 | Descarga por válvula (gravidade) | Necessário | AV-OP, HV-OP, AV-MOT, HV-MOT |
| 46 | Basculamento do tanque | Necessário | AV-OP, HV-OP, AV-MOT, HV-MOT |
| 47 | Limpeza de válvulas e bocais após descarga | Necessário | AV-OP, HV-OP, AV-MOT, HV-MOT |
| 48 | Esvaziamento do depurador / tanquinho | Necessário | AV-OP, AV-MOT |
| 49 | Recolhimento de mangotes | Necessário | AV-OP, HV-OP |

### 6.4 Aspirador de Pó — operador (55–63) · fonte: PO Aspirador de Pó REV02

| Cód | Descrição | Classificação |
|---|---|---|
| 55 | Ligar cabo 440V no painel | Necessário |
| 56 | Instalação de mangotes | Necessário |
| 57 | Sucção de resíduo | Produtivo |
| 58 | Içamento de caçamba e máquina | Necessário |
| 59 | Descarregamento na baía de resíduos | Necessário |
| 60 | Limpeza da caçamba | Necessário |
| 61 | Limpeza do filtro | Necessário |
| 62 | Recolhimento de mangotes e cabo | Necessário |
| 63 | Desobstrução de mangote | Improdutivo |

### 6.5 Motorista (65–69)

| Cód | Descrição | Classificação | Folhas |
|---|---|---|---|
| 65 | Manobra / posicionamento do caminhão (com auxílio) | Necessário | todas MOT |
| 66 | Operação do motor estacionário / bomba (controle de RPM) | Produtivo | todas MOT |
| 67 | Viagem de descarte (ida e volta) | Necessário | AV-MOT, HV-MOT |
| 68 | Aguardando no caminhão (sem operação) | Improdutivo | todas MOT |
| 69 | Abastecimento de combustível | Necessário | todas MOT |

### 6.6 Resumo: códigos válidos por folha

| Folha | Códigos |
|---|---|
| AP-MOT | 1–29, 65, 66, 68, 69 |
| AP-OP | 1–29, 30–37 |
| AV-MOT | 1–29, 45–48, 65–69 |
| AV-OP | 1–29, 40–49 |
| HV-MOT | 1–29, 45–47, 65–69 |
| HV-OP | 1–29, 40–47, 49 |
| AS-OP | 1–29, 55–63 |

Todas as classificações ficam numa tabela e podem ser mudadas sem mexer no código.

## 7. Telas do sistema (1 página HTML, login obrigatório)

1. **Entrar:** e-mail e senha (Supabase Auth do projeto PRODUTIVIDADE).
2. **Sortear e imprimir:**
   - Botão "Sortear": primeiro o tipo (AP/AV/HV/AS, 25% de chance cada), depois uma placa ATIVA desse tipo, da tabela `frota_equipamento`.
   - O supervisor pode sortear de novo ou trocar a placa à mão, antes de confirmar.
   - Preenche data, turno e área. Os nomes são opcionais: em branco, a pessoa escreve à mão.
   - "Gerar kit" cria o kit e as folhas no banco e abre a impressão com todas as folhas do kit, uma por página.
   - "Reimprimir": busca um kit pelo ID e imprime de novo, **com o mesmo ID**.
3. **Lançar folha:**
   - Digita ou abre pelo QR o ID da folha. O sistema mostra o modelo certo, já com equipamento, placa e papel preenchidos.
   - Digitar: nome, matrícula, turno, horário e as linhas (início, fim, código, implemento, E/A, obs.). Na folha do motorista, também os quadros de bica e de descarte.
   - Conferências na hora de salvar:
     - fim antes do início (exceto no turno que passa da meia-noite);
     - horários que se sobrepõem;
     - buraco entre uma linha e a próxima (só um alerta, não bloqueia);
     - código que não vale para aquela folha (bloqueia);
     - linha sem código (bloqueia).
   - Salvar marca a folha como "lançada". Para editar depois, basta abrir pelo mesmo ID.
4. **Kits:** lista dos kits, com o status de cada folha (impressa/lançada) e o progresso do kit (ex.: 2 de 3 folhas lançadas).
5. **Comparar equipe:** linha do tempo colorida (Produtivo verde, Necessário amarelo, Improdutivo vermelho) do MOT, OP1 e OP2 do kit, lado a lado, com o total de horas e o % de cada classificação.
6. **Exportar Excel:** filtro por período. Colunas na ordem da planilha atual (Data, Turno, Horário, Área, Nome, Papel, Placa, Vaga, Equipamento, Hora Início, Hora Final, Código, Descrição, Classificação), mais **ID Kit, ID Folha, Implemento, E/A, Observação**. A bica e os descartes saem em abas separadas.

## 8. Banco de dados (tabelas novas, prefixo `crono_`)

Nenhuma tabela existente é alterada. A `frota_equipamento` só é **lida**.

- `crono_codigos` (codigo int PK, descricao, classificacao, grupo, folhas text[], ativo)
- `crono_kits` (id identity, codigo text único `CR-0001` gerado pelo banco, tipo `ap|av|hv|as`, equipamento_id → frota_equipamento, placa, vaga, data, turno, horario, area, status `impresso|parcial|concluido|cancelado`, criado_por, criado_em)
- `crono_folhas` (id text PK `CR-0001-OP1`, kit_id → crono_kits, modelo `AP-MOT…AS-OP`, papel `MOT|OP1|OP2`, nome, matricula, status `impressa|lancada`, lancado_por, lancado_em)
- `crono_apontamentos` (id, folha_id → crono_folhas, ordem, inicio time, fim time, codigo → crono_codigos, implemento, funcao `E|A`, obs)
- `crono_bica` (id, folha_id, chegada, saida, cargas)
- `crono_descartes` (id, folha_id, saida, chegada, local, tipo `VALVULA|BASCULAMENTO`, retorno)
- Uma função do banco, `crono_gerar_kit(tipo, equipamento_id, data, turno, horario, area)`, cria o kit e as folhas certas numa operação só. Assim não sobra kit pela metade.
- Uma regra no banco recusa um apontamento cujo código não vale para o modelo da folha. É a mesma conferência da tela, repetida no servidor.
- **RLS ligada em todas.** Ler e gravar só com login (`authenticated`). Ninguém apaga pelo navegador: cancelar um kit muda o status para `cancelado`.

## 9. Arquivos

```
CRONOANALISE/
  cronoanalise/
    index.html        telas (usa sge-core.css/js e supabase-js)
    app.js            telas, login, sorteio, lançamento, comparação, exportação
    folhas.js         os 7 modelos de folha e o desenho de impressão
    codigos.js        cópia de segurança da legenda (o banco é a fonte)
    sql/001_crono.sql tabelas, função, RLS e carga dos códigos
  docs/superpowers/specs/ (este documento)
```

Bibliotecas, todas grátis e por CDN: supabase-js, qrcodejs (QR) e SheetJS (Excel). Visual pelo `sge-core` v1 (classe `sge`).

O login usa o Supabase Auth do próprio projeto PRODUTIVIDADE, não o `sso_client.js`, porque os dados ficam em outro projeto. O login do SGE não é alterado.

## 10. Erros e situações especiais

- **Sem internet:** não dá para gerar ID novo (o número vem do banco). O sistema avisa em linguagem simples. A digitação de uma folha fica salva no rascunho (`SGE.rascunho`) até voltar a conexão.
- **ID digitado errado:** aparece "Folha não encontrada", com sugestão dos kits recentes.
- **Folha já lançada:** abre para conferir e editar, mostrando quem lançou e quando.
- **Turno noturno (19–07, 23–07):** uma hora de fim menor que a de início é aceita como "dia seguinte".
- **Kit impresso e não usado:** o supervisor marca como cancelado. O ID não é reaproveitado.

## 11. Testes

1. Gerar um kit de cada tipo e conferir a impressão (1 página por folha, ID e QR legíveis, OP1/OP2 marcado certo, legenda certa).
2. Gerar 2 kits seguidos e confirmar que os IDs são diferentes.
3. Lançar a folha da foto de exemplo (06:40–18:10) e conferir os totais.
4. Tentar salvar um código de outro equipamento (ex.: 57 numa folha AP-OP) e confirmar que é barrado na tela e no banco.
5. Tentar ler os dados sem login e confirmar que o acesso é negado.
6. Exportar o Excel e colar na planilha atual para conferir as colunas.
7. Apagar os dados de teste no fim.

## 12. Fora do escopo (agora)

- Leitura de QR pela webcam do PC (o celular já faz isso sozinho).
- Painel/dashboard novo: o Excel exportado alimenta o dashboard que já existe.
- Publicação no GitHub Pages: fica para depois, com a habilidade `checklist-publicar`.
