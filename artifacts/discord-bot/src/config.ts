export const config = {
  bannedWords: [] as string[],

  spam: {
    maxMessages: 12,
    timeWindowMs: 6_000,
  },

  caps: {
    minLength: 20,
    threshold: 0.90,
  },

  mentions: {
    max: 8,
  },

  invitePattern: /discord\.gg\/[a-zA-Z0-9]+|discord\.com\/invite\/[a-zA-Z0-9]+/i,

  inviteFilter: false,

  raid: {
    enabled: true,
    maxJoins: 8,
    timeWindowMs: 10_000,
    lockdownMinutes: 15,
  },

  warningActions: [
    { atWarnings: 5, action: "timeout" as const, durationMs: 10 * 60 * 1000 },
    { atWarnings: 10, action: "kick" as const },
    { atWarnings: 15, action: "ban" as const },
  ],

  modLogChannel: "mod-log",

  warningsFile: "./data/warnings.json",
};
