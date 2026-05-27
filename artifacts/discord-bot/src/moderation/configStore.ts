import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { config as defaults } from "../config.js";

const DATA_DIR = "./data";
const CONFIG_FILE = "./data/automod-config.json";

interface DynamicConfig {
  bannedWords: string[];
  spam: { maxMessages: number; timeWindowMs: number };
  caps: { minLength: number; threshold: number };
  mentions: { max: number };
  inviteFilter: boolean;
  raid: { enabled: boolean; maxJoins: number; timeWindowMs: number; lockdownMinutes: number };
}

function load(): DynamicConfig {
  if (!existsSync(CONFIG_FILE)) {
    return {
      bannedWords: [...defaults.bannedWords],
      spam: { ...defaults.spam },
      caps: { ...defaults.caps },
      mentions: { ...defaults.mentions },
      inviteFilter: defaults.inviteFilter,
      raid: { ...defaults.raid },
    };
  }
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8")) as DynamicConfig;
  } catch {
    return {
      bannedWords: [...defaults.bannedWords],
      spam: { ...defaults.spam },
      caps: { ...defaults.caps },
      mentions: { ...defaults.mentions },
      inviteFilter: defaults.inviteFilter,
      raid: { ...defaults.raid },
    };
  }
}

function save(cfg: DynamicConfig): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
}

export function getConfig(): DynamicConfig {
  return load();
}

export function addBannedWord(word: string): boolean {
  const cfg = load();
  const normalized = word.toLowerCase().trim();
  if (cfg.bannedWords.map((w) => w.toLowerCase()).includes(normalized)) return false;
  cfg.bannedWords.push(normalized);
  save(cfg);
  return true;
}

export function removeBannedWord(word: string): boolean {
  const cfg = load();
  const normalized = word.toLowerCase().trim();
  const idx = cfg.bannedWords.findIndex((w) => w.toLowerCase() === normalized);
  if (idx === -1) return false;
  cfg.bannedWords.splice(idx, 1);
  save(cfg);
  return true;
}

export function setSpamConfig(maxMessages: number, timeWindowMs: number): void {
  const cfg = load();
  cfg.spam = { maxMessages, timeWindowMs };
  save(cfg);
}

export function setCapsConfig(minLength: number, threshold: number): void {
  const cfg = load();
  cfg.caps = { minLength, threshold };
  save(cfg);
}

export function setMentionsConfig(max: number): void {
  const cfg = load();
  cfg.mentions = { max };
  save(cfg);
}

export function setInviteFilter(enabled: boolean): void {
  const cfg = load();
  cfg.inviteFilter = enabled;
  save(cfg);
}

export function setRaidConfig(
  enabled: boolean,
  maxJoins: number,
  timeWindowMs: number,
  lockdownMinutes: number
): void {
  const cfg = load();
  cfg.raid = { enabled, maxJoins, timeWindowMs, lockdownMinutes };
  save(cfg);
}
