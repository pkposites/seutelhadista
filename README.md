# seutelhadista.com.br

Landing page da Seu Telhadista, hospedada na Netlify (projeto `seutelhadista`).

## Estrutura

- `index.html` — página única (CSS, JS e parte das imagens embutidos).
- `netlify.toml` — site estático, sem build; publica a raiz do repositório.

## Fluxo de publicação

1. Alterações são feitas em uma branch e abertas como Pull Request.
2. A Netlify gera um Deploy Preview para cada PR.
3. Ao fazer merge em `main`, a Netlify publica automaticamente em https://seutelhadista.com.br.
