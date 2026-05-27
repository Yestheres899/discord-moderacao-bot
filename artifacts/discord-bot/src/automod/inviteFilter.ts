import { config } from "../config.js";
import { getConfig } from "../moderation/configStore.js";
import type { AutoModResult } from "../types/index.js";

export function checkInvite(content: string): AutoModResult {
  const { inviteFilter } = getConfig();
  if (!inviteFilter) return { triggered: false };

  if (config.invitePattern.test(content)) {
    return { triggered: true, reason: "Link de convite do Discord não permitido" };
  }
  return { triggered: false };
}
