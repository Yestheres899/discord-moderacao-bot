import { Client, Collection, GatewayIntentBits, Guild, Partials, REST } from "discord.js";
import type { ExtendedClient } from "./types/index.js";
import { loadCommands } from "./commands/index.js";
import { onReady, registerCommandsForGuild } from "./events/ready.js";
import { onMessageCreate } from "./events/messageCreate.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { onGuildMemberAdd } from "./events/guildMemberAdd.js";
import { onChannelCreate } from "./events/channelCreate.js";

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token) throw new Error("DISCORD_BOT_TOKEN não está definido.");
if (!clientId) throw new Error("DISCORD_CLIENT_ID não está definido.");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Channel, Partials.Message],
}) as ExtendedClient;

client.commands = new Collection();
loadCommands(client);

client.once("ready", () => onReady(client));

client.on("guildCreate", (guild: Guild) => {
  const rest = new REST({ version: "10" }).setToken(token!);
  registerCommandsForGuild(rest, clientId!, guild.id, guild.name).catch(console.error);
});

client.on("messageCreate", (msg) => {
  onMessageCreate(msg).catch(console.error);
});

client.on("interactionCreate", (interaction) => {
  onInteractionCreate(client, interaction).catch(console.error);
});

client.on("guildMemberAdd", (member) => {
  onGuildMemberAdd(member).catch(console.error);
});

client.on("channelCreate", (channel) => {
  if (!channel.isDMBased()) onChannelCreate(channel).catch(console.error);
});

process.on("unhandledRejection", (err) => {
  console.error("Erro não tratado:", err);
});

await client.login(token);
