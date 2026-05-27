import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { banMember } from "../moderation/actions.js";
import type { BotCommand } from "../types/index.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bane um membro do servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) =>
      opt.setName("usuario").setDescription("Usuário a banir").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("motivo").setDescription("Motivo do ban").setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("dias")
        .setDescription("Dias de mensagens para deletar (0-7)")
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser("usuario", true);
    const reason =
      interaction.options.getString("motivo") ?? "Sem motivo especificado";
    const days = interaction.options.getInteger("dias") ?? 0;

    const member = interaction.guild?.members.cache.get(target.id);
    if (!member) {
      await interaction.editReply("❌ Usuário não encontrado no servidor.");
      return;
    }

    if (!member.bannable) {
      await interaction.editReply(
        "❌ Não tenho permissão para banir este usuário."
      );
      return;
    }

    await banMember(member, interaction.user, reason, days);
    await interaction.editReply(
      `✅ **${target.tag}** foi banido.\n**Motivo:** ${reason}`
    );
  },
};

export default command;
