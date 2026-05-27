import { Message } from "discord.js";
import { getConfig } from "../moderation/configStore.js";
import type { AutoModResult } from "../types/index.js";

export function checkMentionSpam(message: Message): AutoModResult {
  const { mentions } = getConfig();
  const mentionCount =
    message.mentions.users.size + message.mentions.roles.size;

  if (mentionCount > mentions.max) {
    return {
      triggered: true,
      reason: `Mention spam (${mentionCount} menções)`,
    };
  }

  return { triggered: false };
}
