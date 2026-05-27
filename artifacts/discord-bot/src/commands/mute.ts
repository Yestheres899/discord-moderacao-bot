import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { muteMember } from "../moderation/actions.js";
import type { BotCommand } from "../types/index.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Silencia um membro (timeout)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt
        .setName("usuario")
        .setDescription("Usuário a silenciar")
        .setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("duracao")
        .setDescription("Duração em minutos")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("motivo")
        .setDescription("Motivo do mute")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser("usuario", true);
    const minutes = interaction.options.getInteger("duracao", true);
    const reason =
      interaction.options.getString("motivo") ?? "Sem motivo especificado";

    const member = interaction.guild?.members.cache.get(target.id);
    if (!member) {
      await interaction.editReply("❌ Usuário não encontrado no servidor.");
      return;
    }

    if (!member.moderatable) {
      await interaction.editReply(
        "❌ Não tenho permissão para silenciar este usuário."
      );
      return;
    }

    await muteMember(member, interaction.user, reason, minutes * 60_000);
    await interaction.editReply(
      `✅ **${target.tag}** foi silenciado por **${minutes} minuto(s)**.\n**Motivo:** ${reason}`
    );
  },
};

export default command;
