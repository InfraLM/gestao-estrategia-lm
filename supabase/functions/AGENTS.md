# Edge functions

- AI functions call ia_registrar_uso via _shared/limiteIa right after auth: per-user daily cap with one-time raise, 429 beyond; alert e-mails reuse the shared Gmail sender (_shared/gmail.ts) and never block the call.
