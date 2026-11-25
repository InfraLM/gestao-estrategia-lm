# Edge functions

- AI functions call ia_registrar_uso via _shared/limiteIa right after auth: per-user daily cap with one-time raise, 429 beyond; alert e-mails reuse the shared Lovable Emails sender (_shared/enviarEmail.ts) and never block the call.
- All app e-mail goes through _shared/enviarEmail.ts (Lovable Emails, notifylv domain); never add Gmail/personal mailbox connectors or OAuth credentials.
- reunioes-receber (TI meetings app) writes to the LM Postgres, schema governanca, via governanca.reun_receber (docs/integracoes/reunioes-banco-lm.sql, applied directly there, not a Lovable migration). Secrets: REUNIOES_INGEST_TOKEN and REUNIOES_PG_URL (app_governanca user). The LM server has no SSL today (TI, 25/11); sslmode=require in the URL turns it on. GET with the token is a no-write health check. The public.reun_* tables (0129) stay unused; meeting data must not be stored in Lovable Cloud (TI/LGPD).
