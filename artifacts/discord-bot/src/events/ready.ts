import { Client, REST, Routes } from "discord.js";
import { getCommandsJson } from "../commands/index.js";

const AVATAR_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSn3J21kz3PlAqDv-sTYy9ChBMf-TJP9_Kolw&s";

async function registerGuildCommands(
  rest: REST,
  clientId: string,
  guildId: string,
  guildName: string
): Promise<void> {
  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: getCommandsJson(),
    });
    console.log(`✅ Comandos registrados em "${guildName}"`);
  } catch (err) {
    console.warn(`⚠️ Falha ao registrar em "${guildName}":`, err);
  }
}

export async function onReady(client: Client): Promise<void> {
  console.log(`✅ Bot online como ${client.user?.tag}`);

  try {
    const res = await fetch(AVATAR_URL);
    const buffer = Buffer.from(await res.arrayBuffer());
    await client.user?.setAvatar(buffer);
    console.log("✅ Foto de perfil atualizada.");
  } catch {
    console.warn("⚠️ Não foi possível atualizar a foto de perfil.");
  }

  const token = process.env.DISCORD_BOT_TOKEN!;
  const clientId = process.env.DISCORD_CLIENT_ID!;
  const rest = new REST({ version: "10" }).setToken(token);

  const guilds = client.guilds.cache;
  console.log(`⏳ Registrando comandos em ${guilds.size} servidor(es)...`);

  await Promise.all(
    guilds.map((guild) =>
      registerGuildCommands(rest, clientId, guild.id, guild.name)
    )
  );

  console.log("✅ Todos os servidores atualizados. Comandos aparecem imediatamente!");

  try {
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    console.log("✅ Comandos globais duplicados removidos.");
  } catch {
    // ignora se já estiver limpo
  }
}

export async function registerCommandsForGuild(
  rest: REST,
  clientId: string,
  guildId: string,
  guildName: string
): Promise<void> {
  await registerGuildCommands(rest, clientId, guildId, guildName);
}
