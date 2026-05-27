import { getConfig } from "../moderation/configStore.js";
import type { AutoModResult } from "../types/index.js";

const LEET_MAP: Record<string, string> = {
  "4": "a",
  "@": "a",
  "3": "e",
  "€": "e",
  "1": "i",
  "|": "i",
  "!": "i",
  "0": "o",
  "5": "s",
  "$": "s",
  "7": "t",
  "+": "t",
  "9": "g",
  "8": "b",
  "2": "z",
  "6": "g",
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[048@3€1|!57$+962]/g, (c) => LEET_MAP[c] ?? c)
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/(.)\1+/g, "$1")
    .trim();
}

function jaroSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matchDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array<boolean>(a.length).fill(false);
  const bMatches = new Array<boolean>(b.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  return (
    (matches / a.length +
      matches / b.length +
      (matches - transpositions / 2) / matches) /
    3
  );
}

function jaroWinkler(a: string, b: string, p = 0.1): number {
  const jaro = jaroSimilarity(a, b);
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }
  return jaro + prefix * p * (1 - jaro);
}

const SIMILARITY_THRESHOLD = 0.82;

function isSimilar(word: string, banned: string): boolean {
  if (word.length < 3) return word === banned;
  if (word.includes(banned) || banned.includes(word)) return true;
  return jaroWinkler(word, banned) >= SIMILARITY_THRESHOLD;
}

export function checkBannedWords(content: string): AutoModResult {
  const { bannedWords } = getConfig();
  if (bannedWords.length === 0) return { triggered: false };

  const normalized = normalize(content);
  const words = normalized.split(/\s+/).filter(Boolean);
  const normalizedBanned = bannedWords.map((w) => normalize(w));

  for (const word of words) {
    for (const banned of normalizedBanned) {
      if (isSimilar(word, banned)) {
        return {
          triggered: true,
          reason: `Palavra proibida detectada (variação de: "${banned}")`,
        };
      }
    }
  }

  const fullNorm = normalize(content.replace(/\s+/g, ""));
  for (const banned of normalizedBanned) {
    if (fullNorm.includes(banned)) {
      return {
        triggered: true,
        reason: `Palavra proibida detectada (variação de: "${banned}")`,
      };
    }
  }

  return { triggered: false };
}
