# seutelhadista.com.br

Landing page da Seu Telhadista, hospedada na Netlify (projeto `seutelhadista`). Segue o mesmo padrão validado do site da J.A Instalações: mobile-first, sem build, pronta para Google Ads.

## Estrutura

- `index.html` — página principal.
- `styles.css` / `script.js` — estilos e comportamento (sem frameworks).
- `privacidade.html` — política de privacidade (LGPD).
- `assets/` — mascote, favicon e fotos de obras.
- `robots.txt` / `sitemap.xml` — SEO técnico.
- `netlify.toml` — site estático, sem build; cabeçalhos de segurança e cache.

## Fluxo de publicação

1. Alterações são feitas em uma branch e abertas como Pull Request.
2. A Netlify gera um Deploy Preview para cada PR.
3. Ao fazer merge em `main`, a Netlify publica automaticamente em https://seutelhadista.com.br.

## Contato e captura de leads

- WhatsApp: `551150922446` (constante `WHATSAPP_NUMBER` em `script.js`).
- Todo botão de WhatsApp abre antes um passo curto (serviço, nome e WhatsApp). Os dados vão para o **Netlify Forms** (formulário `whatsapp`) e para o **Lead Hub**.
- O formulário de orçamento grava no **Netlify Forms** (formulário `orcamento`), no **Lead Hub** e abre o WhatsApp com a mensagem pronta.
- Cada envio grava também a origem do anúncio (UTMs, gclid, fbclid).

No painel da Netlify: **Forms** lista os envios. Para receber por e-mail: **Project configuration → Forms → Form notifications → Add notification**.

## Lead Hub e LGPD

- `tracker.js` do Lead Hub no `<head>` de todas as páginas, com `data-consent="banner"` (aviso de cookies Aceitar/Recusar).
- Google Consent Mode começa negado (`gtag('consent', 'default', …)`) e é liberado pelo Lead Hub quando a pessoa aceita.
- Antes de abrir o WhatsApp: `LeadHub.set(respostas)`, `LeadHub.identify({ name, phone })` e a URL passa por `LeadHub.whatsappUrl(url)`.

## Eventos de conversão (`dataLayer`)

| Evento | Quando dispara |
|---|---|
| `form_lead_telhado` | Envio do formulário (`lead_origem: formulario_sdr`) ou confirmação do passo de WhatsApp (`lead_origem`: `hero`, `cta_final`, `botao_flutuante`, `modal_servico`) |
| `form_submit` | Envio do formulário de orçamento |
| `whatsapp_click` | Confirmação do passo de WhatsApp |
| `phone_click` | Clique em qualquer link `tel:` |
| `service_modal_open` | Abertura do detalhe de um serviço |

O formulário também dispara a conversão do Google Ads `AW-18035199724/lir8ClDj9Y0cEOyd7ZdD`.
