#!/bin/bash
set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN não encontrado."
  exit 1
fi

REMOTE_URL="https://Yestheres899:$GITHUB_TOKEN@github.com/Yestheres899/discord-moderacao-bot.git"

git remote remove github 2>/dev/null || true
git remote add github "$REMOTE_URL"

echo "⏳ Subindo para GitHub..."
git push github main

echo ""
echo "✅ Pronto! Repositório disponível em:"
echo "   https://github.com/Yestheres899/discord-moderacao-bot"

git remote remove github
