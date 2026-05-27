import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Colors,
  EmbedBuilder,
  Guild,
  GuildMember,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";

export const UNVERIFIED_ROLE = "Não Verificado";
export const VERIFY_BUTTON_ID = "verify_member";

export async function setupVerification(guild: Guild): Promise<string[]> {
  const log: string[] = [];

  let unverifiedRole = guild.roles.cache.find((r) => r.name === UNVERIFIED_ROLE);
  if (!unverifiedRole) {
    unverifiedRole = await guild.roles.create({
      name: UNVERIFIED_ROLE,
      color: Colors.Grey,
      permissions: [],
      reason: "Sistema de verificação automática",
    });
    log.push(`✅ Cargo "${UNVERIFIED_ROLE}" criado.`);
  } else {
    log.push(`ℹ️ Cargo "${UNVERIFIED_ROLE}" já existe.`);
  }

  let verifyChannel = guild.channels.cache.find(
    (ch) => ch.name === "verificação" && ch.isTextBased()
  ) as TextChannel | undefined;

  if (!verifyChannel) {
    verifyChannel = await guild.channels.create({
      name: "verificação",
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: unverifiedRole.id,
          allow: [PermissionFlagsBits.ViewChannel],
          deny: [PermissionFlagsBits.SendMessages],
        },
      ],
      reason: "Canal de verificação automática",
    });
    log.push(`✅ Canal #verificação criado.`);
  } else {
    await verifyChannel.permissionOverwrites.edit(unverifiedRole, {
      ViewChannel: true,
      SendMessages: false,
    });
    await verifyChannel.permissionOverwrites.edit(guild.id, {
      ViewChannel: false,
    });
    log.push(`ℹ️ Canal #verificação já existe — permissões atualizadas.`);
  }

  let blocked = 0;
  for (const [, ch] of guild.channels.cache) {
    if (ch.id === verifyChannel.id) continue;
    if (!("permissionOverwrites" in ch)) continue;
    try {
      await ch.permissionOverwrites.edit(unverifiedRole, {
        ViewChannel: false,
      });
      blocked++;
    } catch {
      // sem permissão nesse canal
    }
  }
  log.push(`✅ ${blocked} canal(is) bloqueado(s) para não verificados.`);

  const embed = new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle("🔐 Verificação de Membros")
    .setDescription(
      "Bem-vindo! Clique no botão abaixo para verificar sua conta e ter acesso a todos os canais do servidor."
    )
    .setFooter({ text: "Verificação automática" })
    .setTimestamp();

  const button = new ButtonBuilder()
    .setCustomId(VERIFY_BUTTON_ID)
    .setLabel("✅ Verificar minha conta")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  await verifyChannel.send({ embeds: [embed], components: [row] });
  log.push(`✅ Mensagem de verificação enviada em #verificação.`);

  return log;
}

export async function assignUnverified(member: GuildMember): Promise<void> {
  const role = member.guild.roles.cache.find((r) => r.name === UNVERIFIED_ROLE);
  if (!role) return;

  await member.roles.add(role, "Membro novo — aguardando verificação");

  try {
    await member.send(
      `👋 Bem-vindo ao **${member.guild.name}**!\n\nPara ter acesso ao servidor, vá até o canal **#verificação** e clique no botão para verificar sua conta.`
    );
  } catch {
    // DMs bloqueadas
  }
}

export async function verifyMember(member: GuildMember): Promise<void> {
  const role = member.guild.roles.cache.find((r) => r.name === UNVERIFIED_ROLE);
  if (role && member.roles.cache.has(role.id)) {
    await member.roles.remove(role, "Verificação concluída");
  }
}

export function isVerificationSetup(guild: Guild): boolean {
  return guild.roles.cache.some((r) => r.name === UNVERIFIED_ROLE);
}
