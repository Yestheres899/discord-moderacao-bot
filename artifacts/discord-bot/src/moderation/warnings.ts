import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { config } from "../config.js";
import type { Warning, WarningsStore } from "../types/index.js";

const dataDir = "./data";
const filePath = config.warningsFile;

function loadStore(): WarningsStore {
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as WarningsStore;
  } catch {
    return {};
  }
}

function saveStore(store: WarningsStore): void {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function addWarning(
  guildId: string,
  userId: string,
  reason: string,
  moderatorId: string
): Warning[] {
  const store = loadStore();
  if (!store[guildId]) store[guildId] = {};
  if (!store[guildId][userId]) store[guildId][userId] = [];

  const warning: Warning = {
    reason,
    timestamp: Date.now(),
    moderatorId,
  };

  store[guildId][userId].push(warning);
  saveStore(store);
  return store[guildId][userId];
}

export function getWarnings(guildId: string, userId: string): Warning[] {
  const store = loadStore();
  return store[guildId]?.[userId] ?? [];
}

export function clearWarnings(guildId: string, userId: string): void {
  const store = loadStore();
  if (store[guildId]) {
    delete store[guildId][userId];
    saveStore(store);
  }
}

export function getWarningCount(guildId: string, userId: string): number {
  return getWarnings(guildId, userId).length;
}

export function getWarningAction(
  count: number
): { action: "timeout" | "kick" | "ban"; durationMs?: number } | null {
  const actions = [...config.warningActions].reverse();
  for (const entry of actions) {
    if (count >= entry.atWarnings) {
      return entry as { action: "timeout" | "kick" | "ban"; durationMs?: number };
    }
  }
  return null;
}
