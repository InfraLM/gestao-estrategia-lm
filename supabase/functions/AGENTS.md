# Edge functions

- AI functions call ia_registrar_uso via _shared/limiteIa right after auth: per-user daily cap with one-time raise, 429 beyond; alert e-mails reuse the shared Lovable Emails sender (_shared/enviarEmail.ts) and never block the call.
- All app e-mail goes through _shared/enviarEmail.ts (Lovable Emails, notifylv domain); never add Gmail/personal mailbox connectors or OAuth credentials.
