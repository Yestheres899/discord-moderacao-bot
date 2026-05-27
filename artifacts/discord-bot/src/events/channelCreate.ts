import { NonThreadGuildBasedChannel } from "discord.js";
import { UNVERIFIED_ROLE } from "../moderation/verification.js";

export async function onChannelCreate(channel: NonThreadGuildBasedChannel): Promise<void> {
  const unverifiedRole = channel.guild.roles.cache.find(
    (r) => r.name === UNVERIFIED_ROLE
  );
  if (!unverifiedRole) return;

  if (channel.name === "verificação") return;

  if (!("permissionOverwrites" in channel)) return;

  try {
    await channel.permissionOverwrites.edit(unverifiedRole, {
      ViewChannel: false,
    });
  } catch {
    // sem permissão
  }
}
