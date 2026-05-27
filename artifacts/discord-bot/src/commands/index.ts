import { Collection } from "discord.js";
import type { BotCommand, ExtendedClient } from "../types/index.js";
import ban from "./ban.js";
import kick from "./kick.js";
import mute from "./mute.js";
import warn from "./warn.js";
import unban from "./unban.js";
import clear from "./clear.js";
import warnings from "./warnings.js";
import automod from "./automod.js";
import lockdown from "./lockdown.js";
import verificar from "./verificar.js";
import backup from "./backup.js";

const commandList: BotCommand[] = [
  ban,
  kick,
  mute,
  warn,
  unban,
  clear,
  warnings,
  automod,
  lockdown,
  verificar,
  backup,
];

export function loadCommands(client: ExtendedClient): void {
  client.commands = new Collection();
  for (const command of commandList) {
    client.commands.set(command.data.name, command);
  }
}

export function getCommandsJson() {
  return commandList.map((c) => c.data.toJSON());
}
