# Diagramas de fluxo

Diagramas do fluxo real do Aurora Food, gerados a partir das specs YAML
neste diretório com a
[excalidraw-flowdraw-skill](https://github.com/gapinto/excalidraw-flowdraw-skill).
O YAML é a fonte de verdade — os arquivos em `out/*.excalidraw` são sempre
gerados, nunca editados à mão. Para mudar um diagrama, edite o YAML e
regenere.

| Spec | Descreve |
|---|---|
| `pedido-pix-online.yaml` | Fluxo do cliente pagando via Pix na hora — cozinha libera pelo webhook do Asaas. |
| `pedido-pagar-no-caixa.yaml` | Fluxo do cliente pagando no caixa — cozinha libera só depois da confirmação manual do operador. |
| `arquitetura.yaml` | Mapa de dependências do app (Next.js) — Supabase e Asaas. |

## Regenerar

Precisa clonar `excalidraw-flowdraw-skill` à parte (repositório separado,
reutilizável por qualquer projeto — não é específico do Aurora Food) e
instalar as dependências dele (`pip install -r requirements.txt`, ver o
README de lá). Depois, a partir da raiz desse repositório da skill:

```bash
python scripts/generate.py <caminho-para-este-repo>/docs/diagramas/<spec>.yaml \
  -o <caminho-para-este-repo>/docs/diagramas/out/<spec>.excalidraw
python scripts/validate.py <caminho-para-este-repo>/docs/diagramas/out/<spec>.excalidraw
```

`scripts/render.py` (revisão visual em PNG) não foi usado pra gerar os
arquivos atuais — depende de baixar um Chromium via Playwright e carregar a
lib Excalidraw de um CDN (`esm.sh`), e o ambiente onde estes diagramas
foram gerados bloqueia egress de rede pra hosts fora de uma allowlist. Os
arquivos `.excalidraw` foram validados só estruturalmente
(`validate.py` — sem sobreposição, bindings corretos) e por leitura direta
do JSON. Rodar `render.py` num ambiente com rede liberada antes de confiar
100% no visual pra apresentação a terceiros.
