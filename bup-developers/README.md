# Bup for Developers

Projeto separado do Bup. Estático + funções serverless (Vercel) + Neon.

Variáveis na Vercel: `DATABASE_URL` (Neon) e `AUTH_SECRET` (texto longo aleatório).
As tabelas (`dev_users`, `dev_apps`, `dev_links`) são criadas sozinhas no primeiro acesso.

Rotas: `/`, `/docs`, `/entrar`, `/criar-app`, `/painel`, `/conectar`.
API pública: `POST/GET /api/v1/link` com `Authorization: Bearer bup_sk_...`.
