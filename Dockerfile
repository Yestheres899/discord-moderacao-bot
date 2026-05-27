FROM node:24-slim

RUN npm install -g pnpm@10

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./

COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json         ./lib/api-spec/
COPY lib/api-zod/package.json          ./lib/api-zod/
COPY lib/db/package.json               ./lib/db/
COPY scripts/package.json              ./scripts/
COPY artifacts/discord-bot/package.json ./artifacts/discord-bot/

RUN pnpm install --frozen-lockfile --filter @workspace/discord-bot...

COPY artifacts/discord-bot/ ./artifacts/discord-bot/

RUN mkdir -p ./artifacts/discord-bot/data

CMD ["pnpm", "--filter", "@workspace/discord-bot", "run", "start"]
