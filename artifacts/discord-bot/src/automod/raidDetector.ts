import { Guild, GuildVerificationLevel, EmbedBuilder, Colors } from "discord.js";
import { getConfig } from "../moderation/configStore.js";

interface JoinEntry {
  timestamps: number[];
}

interface LockdownEntry {
  originalLevel: GuildVerificationLevel;
  timeout: NodeJS.Timeout;
}

const joinMap = new Map<string, JoinEntry>();
const lockdownState = new Map<string, LockdownEntry>();

export function isInLockdown(guildId: string): boolean {
  return lockdownState.has(guildId);
}

export async function activateLockdown(guild: Guild, reason: string): Promise<void> {
  if (lockdownState.has(guild.id)) return;

  const { raid } = getConfig();
  const originalLevel = guild.verificationLevel;

  const timeout = setTimeout(async () => {
    await deactivateLockdown(guild, "Lockdown automático encerrado");
  }, raid.lockdownMinutes * 60_000);

  lockdownState.set(guild.id, { originalLevel, timeout });

  try {
    await guild.setVerificationLevel(GuildVerificationLevel.High, reason);
  } catch {
    // sem permissão para alterar o nível de verificação
  }

  const logChannel = guild.channels.cache.find(
    (ch) => ch.name === "mod-log" && ch.isTextBased()
  );

  if (logChannel?.isTextBased()) {
    const embed = new EmbedBuilder()
      .setColor(Colors.DarkRed)
      .setTitle("🚨 LOCKDOWN ATIVADO")
      .setDescription(
        `**Motivo:** ${reason}\n**Duração:** ${raid.lockdownMinutes} minutos\n\nNível de verificação aumentado para **Alto**. Novos membros precisarão aguardar 10 minutos com email verificado.`
      )
      .setTimestamp();
    await logChannel.send({ content: "@here", embeds: [embed] });
  }
}

export async function deactivateLockdown(guild: Guild, reason: string): Promise<void> {
  const entry = lockdownState.get(guild.id);
  if (!entry) return;

  clearTimeout(entry.timeout);
  lockdownState.delete(guild.id);

  try {
    await guild.setVerificationLevel(entry.originalLevel, reason);
  } catch {
    // sem permissão
  }

  const logChannel = guild.channels.cache.find(
    (ch) => ch.name === "mod-log" && ch.isTextBased()
  );

  if (logChannel?.isTextBased()) {
    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle("✅ LOCKDOWN ENCERRADO")
      .setDescription(`**Motivo:** ${reason}\nNível de verificação restaurado.`)
      .setTimestamp();
    await logChannel.send({ embeds: [embed] });
  }
}

export async function checkRaid(guild: Guild): Promise<boolean> {
  const { raid } = getConfig();
  if (!raid.enabled) return false;

  const now = Date.now();
  const windowStart = now - raid.timeWindowMs;

  const entry = joinMap.get(guild.id) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
  entry.timestamps.push(now);
  joinMap.set(guild.id, entry);

  if (entry.timestamps.length >= raid.maxJoins) {
    entry.timestamps = [];
    joinMap.set(guild.id, entry);
    await activateLockdown(
      guild,
      `Raid detectado: ${raid.maxJoins} entradas em ${raid.timeWindowMs / 1000}s`
    );
    return true;
  }

  return false;
}
