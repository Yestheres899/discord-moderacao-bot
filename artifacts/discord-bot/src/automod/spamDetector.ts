import { getConfig } from "../moderation/configStore.js";
import type { AutoModResult, SpamEntry } from "../types/index.js";

const spamMap = new Map<string, SpamEntry>();

export function checkSpam(guildId: string, userId: string): AutoModResult {
  const { spam } = getConfig();
  const key = `${guildId}:${userId}`;
  const now = Date.now();
  const windowStart = now - spam.timeWindowMs;

  const entry = spamMap.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
  entry.timestamps.push(now);
  spamMap.set(key, entry);

  if (entry.timestamps.length > spam.maxMessages) {
    return {
      triggered: true,
      reason: `Spam detectado (${entry.timestamps.length} mensagens em ${spam.timeWindowMs / 1000}s)`,
    };
  }

  return { triggered: false };
}

export function resetSpam(guildId: string, userId: string): void {
  spamMap.delete(`${guildId}:${userId}`);
}
