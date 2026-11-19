# Makaria
Aplicativo financeiro pessoal com identidade Makaria.

## 1. Supabase
Crie um projeto no Supabase. No SQL Editor, execute todo o conteúdo de `supabase.sql`.
Depois, em Project Settings > API, copie a Project URL e a chave anon/public.

## 2. Configurar o app
Abra `app.js` e preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY` no início do arquivo.

A chave anon/public é própria para uso no navegador com RLS. Nunca coloque uma service_role key no aplicativo.

## 3. GitHub Pages
Envie os arquivos para a raiz de um repositório público e ative Settings > Pages > Deploy from branch > main > /(root).

## 4. Segurança
Login e dados financeiros são protegidos pelo Supabase Auth + Row Level Security. O PIN é armazenado apenas no dispositivo como camada local de bloqueio; não é uma senha do servidor.

## 5. Android
Abra o GitHub Pages no Chrome e escolha “Instalar aplicativo”/“Adicionar à tela inicial”.
