import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { kickMember } from "../moderation/actions.js";
import type { BotCommand } from "../types/index.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa um membro do servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((opt) =>
      opt
        .setName("usuario")
        .setDescription("Usuário a expulsar")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("motivo").setDescription("Motivo do kick").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser("usuario", true);
    const reason =
      interaction.options.getString("motivo") ?? "Sem motivo especificado";

    const member = interaction.guild?.members.cache.get(target.id);
    if (!member) {
      await interaction.editReply("❌ Usuário não encontrado no servidor.");
      return;
    }

    if (!member.kickable) {
      await interaction.editReply(
        "❌ Não tenho permissão para expulsar este usuário."
      );
      return;
    }

    await kickMember(member, interaction.user, reason);
    await interaction.editReply(
      `✅ **${target.tag}** foi expulso.\n**Motivo:** ${reason}`
    );
  },
};

export default command;
