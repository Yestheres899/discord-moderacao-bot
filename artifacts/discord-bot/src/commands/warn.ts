import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { warnMember } from "../moderation/actions.js";
import type { BotCommand } from "../types/index.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Dá um aviso para um membro")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt
        .setName("usuario")
        .setDescription("Usuário a avisar")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("motivo").setDescription("Motivo do aviso").setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser("usuario", true);
    const reason = interaction.options.getString("motivo", true);

    const member = interaction.guild?.members.cache.get(target.id);
    if (!member) {
      await interaction.editReply("❌ Usuário não encontrado no servidor.");
      return;
    }

    const { count, actionTaken } = await warnMember(
      member,
      interaction.user,
      reason
    );

    let reply = `✅ **${target.tag}** recebeu um aviso. Total: **${count}**.\n**Motivo:** ${reason}`;
    if (actionTaken) reply += `\n⚠️ Ação automática: **${actionTaken}**`;

    await interaction.editReply(reply);
  },
};

export default command;
