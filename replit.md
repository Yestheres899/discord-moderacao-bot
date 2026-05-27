# Discord Moderação Bot

Bot de moderação para Discord com auto-moderação por regras e comandos slash.

## Run & Operate

- `pnpm --filter @workspace/discord-bot run dev` — rodar o bot
- `pnpm --filter @workspace/discord-bot run typecheck` — checar tipos
- Secrets necessários: `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- discord.js v14
- tsx (TypeScript runner, sem compilação)

## Where things live

- `artifacts/discord-bot/src/index.ts` — entrada principal do bot
- `artifacts/discord-bot/src/config.ts` — configurações (palavras banidas, thresholds)
- `artifacts/discord-bot/src/commands/` — slash commands
- `artifacts/discord-bot/src/automod/` — módulos de auto-moderação
- `artifacts/discord-bot/src/moderation/` — ações, avisos e logs
- `artifacts/discord-bot/data/warnings.json` — avisos persistidos (criado automaticamente)

## Architecture decisions

- Avisos salvos em `data/warnings.json` para persistência entre reinicializações
- Auto-mod usa checks em cadeia: palavras → spam → caps → invites → mentions
- Mute implementado via Discord Timeout nativo (não precisa de cargo)
- Slash commands registrados globalmente no evento `ready` (pode levar até 1 hora para propagar)
- Moderadores com permissão `ManageMessages` são ignorados pelo auto-mod

## Product

- Auto-moderação: palavras proibidas, spam, caps excessivo, links de convite, mention spam
- Comandos: `/ban`, `/kick`, `/mute`, `/warn`, `/unban`, `/clear`, `/warnings`
- Sistema de avisos com ações automáticas: 3 avisos = mute 10min, 5 = kick, 7 = ban
- Log de moderação no canal `#mod-log`

## Gotchas

- **Privileged Intents obrigatórias**: No Discord Developer Portal → Bot → habilitar "SERVER MEMBERS INTENT" e "MESSAGE CONTENT INTENT"
- Canal de log deve se chamar exatamente `mod-log`
- Slash commands globais levam até 1 hora para aparecer; use guild commands para testes imediatos
- O bot precisa ter permissões de administrador ou as permissões específicas no servidor

## Como adicionar o bot ao servidor

Use este link (substitua CLIENT_ID pelo seu):
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=1374389534848&scope=bot%20applications.commands
```
