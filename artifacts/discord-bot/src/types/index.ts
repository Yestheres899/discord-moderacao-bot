import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export interface BotCommand {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface ExtendedClient extends Client {
  commands: Collection<string, BotCommand>;
}

export interface Warning {
  reason: string;
  timestamp: number;
  moderatorId: string;
}

export interface GuildWarnings {
  [userId: string]: Warning[];
}

export interface WarningsStore {
  [guildId: string]: GuildWarnings;
}

export interface AutoModResult {
  triggered: boolean;
  reason?: string;
}

export interface SpamEntry {
  timestamps: number[];
}
