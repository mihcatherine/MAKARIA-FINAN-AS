# Makaria — Supabase v2

Arquivos prontos para publicar no GitHub Pages.

## Configuração já incluída
- Supabase URL: configurada
- Publishable key: configurada
- Login e criação de conta via Supabase Auth
- Dados separados por usuário com Row Level Security
- Perfil, lançamentos, metas, contas e configurações
- PIN local para bloqueio do aparelho

## No Supabase
1. Abra o SQL Editor.
2. Execute todo o conteúdo de `supabase.sql`.
3. Em Authentication > URL Configuration, adicione a URL do seu GitHub Pages, por exemplo `https://SEU-USUARIO.github.io/MAKARIA-FINAN-AS/`.

## No GitHub
Envie estes arquivos para a raiz do repositório:
`index.html`, `app.js`, `style.css`, `logo.svg`, `manifest.webmanifest`, `supabase.sql`, `README.md`.

Depois: Settings > Pages > Deploy from a branch > main > /(root) > Save.

Observação: a publishable key pode ficar no código do navegador. Nunca coloque a Secret Key do Supabase no GitHub.
