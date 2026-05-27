import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { logModAction } from "../moderation/logger.js";
import type { BotCommand } from "../types/index.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Remove o ban de um usuário")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((opt) =>
      opt
        .setName("userid")
        .setDescription("ID do usuário a desbanir")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("motivo").setDescription("Motivo do unban").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.options.getString("userid", true);
    const reason =
      interaction.options.getString("motivo") ?? "Sem motivo especificado";

    if (!interaction.guild) {
      await interaction.editReply("❌ Comando apenas para servidores.");
      return;
    }

    try {
      const ban = await interaction.guild.bans.fetch(userId);
      await interaction.guild.members.unban(userId, reason);

      await logModAction({
        guild: interaction.guild,
        action: "UNBAN",
        target: ban.user,
        moderator: interaction.user,
        reason,
      });

      await interaction.editReply(
        `✅ **${ban.user.tag}** foi desbanido.\n**Motivo:** ${reason}`
      );
    } catch {
      await interaction.editReply(
        "❌ Usuário não encontrado na lista de banidos."
      );
    }
  },
};

export default command;
