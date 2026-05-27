import { getConfig } from "../moderation/configStore.js";
import type { AutoModResult } from "../types/index.js";

export function checkCaps(content: string): AutoModResult {
  const { caps } = getConfig();
  const letters = content.replace(/[^a-zA-Z]/g, "");
  if (letters.length < caps.minLength) return { triggered: false };

  const upperCount = letters.replace(/[^A-Z]/g, "").length;
  const ratio = upperCount / letters.length;

  if (ratio >= caps.threshold) {
    return {
      triggered: true,
      reason: `Excesso de letras maiúsculas (${Math.round(ratio * 100)}%)`,
    };
  }

  return { triggered: false };
}
