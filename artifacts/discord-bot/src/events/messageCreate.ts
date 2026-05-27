import { Message, PermissionFlagsBits } from "discord.js";
import { checkBannedWords } from "../automod/wordFilter.js";
import { checkSpam } from "../automod/spamDetector.js";
import { checkCaps } from "../automod/capsFilter.js";
import { checkInvite } from "../automod/inviteFilter.js";
import { checkMentionSpam } from "../automod/mentionSpam.js";
import { autoModAction } from "../moderation/actions.js";
import { logModAction } from "../moderation/logger.js";

export async function onMessageCreate(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!message.guild) return;

  const member = message.member;
  if (!member) return;

  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

  const checks = [
    checkBannedWords(message.content),
    checkSpam(message.guild.id, message.author.id),
    checkCaps(message.content),
    checkInvite(message.content),
    checkMentionSpam(message),
  ];

  const triggered = checks.find((c) => c.triggered);

  if (!triggered) return;

  try {
    await message.delete();
  } catch {
    // mensagem já deletada ou sem permissão
  }

  try {
    await message.author.send(
      `⚠️ Sua mensagem em **${message.guild.name}** foi removida.\n**Motivo:** ${triggered.reason}`
    );
  } catch {
    // DMs bloqueadas
  }

  await logModAction({
    guild: message.guild,
    action: "AUTO-MOD",
    target: message.author,
    moderator: message.client.user!,
    reason: triggered.reason!,
    extra: `Canal: <#${message.channelId}>`,
  });

  await autoModAction(member, triggered.reason!);
}
