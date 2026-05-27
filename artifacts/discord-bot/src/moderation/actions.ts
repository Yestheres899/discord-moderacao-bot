import { GuildMember, User } from "discord.js";
import { logModAction } from "./logger.js";
import { addWarning, getWarningCount, getWarningAction } from "./warnings.js";

export async function banMember(
  member: GuildMember,
  moderator: User,
  reason: string,
  deleteMessageDays = 0
): Promise<void> {
  await member.ban({ reason, deleteMessageSeconds: deleteMessageDays * 86400 });
  await logModAction({
    guild: member.guild,
    action: "BAN",
    target: member.user,
    moderator,
    reason,
  });
}

export async function kickMember(
  member: GuildMember,
  moderator: User,
  reason: string
): Promise<void> {
  await member.kick(reason);
  await logModAction({
    guild: member.guild,
    action: "KICK",
    target: member.user,
    moderator,
    reason,
  });
}

export async function muteMember(
  member: GuildMember,
  moderator: User,
  reason: string,
  durationMs: number
): Promise<void> {
  await member.timeout(durationMs, reason);
  const minutes = Math.round(durationMs / 60_000);
  await logModAction({
    guild: member.guild,
    action: "MUTE",
    target: member.user,
    moderator,
    reason,
    duration: `${minutes} minuto(s)`,
  });
}

export async function warnMember(
  member: GuildMember,
  moderator: User,
  reason: string
): Promise<{ count: number; actionTaken?: string }> {
  const warnings = addWarning(member.guild.id, member.id, reason, moderator.id);
  const count = warnings.length;

  await logModAction({
    guild: member.guild,
    action: "WARN",
    target: member.user,
    moderator,
    reason,
    extra: `Total de avisos: ${count}`,
  });

  try {
    await member.send(
      `⚠️ Você recebeu um aviso em **${member.guild.name}**.\n**Motivo:** ${reason}\n**Total de avisos:** ${count}`
    );
  } catch {
    // DMs disabled
  }

  const autoAction = getWarningAction(count);
  if (!autoAction) return { count };

  if (autoAction.action === "timeout" && autoAction.durationMs) {
    await muteMember(member, moderator, `${count} avisos acumulados`, autoAction.durationMs);
    return { count, actionTaken: `mute automático (${count} avisos)` };
  }

  if (autoAction.action === "kick") {
    await kickMember(member, moderator, `${count} avisos acumulados`);
    return { count, actionTaken: `kick automático (${count} avisos)` };
  }

  if (autoAction.action === "ban") {
    await banMember(member, moderator, `${count} avisos acumulados`);
    return { count, actionTaken: `ban automático (${count} avisos)` };
  }

  return { count };
}

export async function autoModAction(
  member: GuildMember,
  reason: string
): Promise<void> {
  const botUser = member.guild.client.user!;
  await warnMember(member, botUser, `[Auto-Mod] ${reason}`);
}
