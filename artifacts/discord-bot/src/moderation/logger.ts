import {
  Colors,
  EmbedBuilder,
  Guild,
  GuildTextBasedChannel,
  User,
} from "discord.js";
import { config } from "../config.js";

export type ModAction =
  | "BAN"
  | "UNBAN"
  | "KICK"
  | "MUTE"
  | "WARN"
  | "AUTO-MOD"
  | "CLEAR";

const actionColors: Record<ModAction, number> = {
  BAN: Colors.Red,
  UNBAN: Colors.Green,
  KICK: Colors.Orange,
  MUTE: Colors.Yellow,
  WARN: Colors.Blue,
  "AUTO-MOD": Colors.Purple,
  CLEAR: Colors.Grey,
};

export async function logModAction(options: {
  guild: Guild;
  action: ModAction;
  target: User;
  moderator: User;
  reason: string;
  duration?: string;
  extra?: string;
}): Promise<void> {
  const { guild, action, target, moderator, reason, duration, extra } = options;

  const channel = guild.channels.cache.find(
    (ch) =>
      ch.name === config.modLogChannel && ch.isTextBased()
  ) as GuildTextBasedChannel | undefined;

  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(actionColors[action])
    .setTitle(`🔨 ${action}`)
    .addFields(
      { name: "Usuário", value: `${target.tag} (${target.id})`, inline: true },
      { name: "Moderador", value: `${moderator.tag}`, inline: true },
      { name: "Motivo", value: reason }
    )
    .setThumbnail(target.displayAvatarURL())
    .setTimestamp();

  if (duration) embed.addFields({ name: "Duração", value: duration, inline: true });
  if (extra) embed.addFields({ name: "Info", value: extra });

  await channel.send({ embeds: [embed] });
}
