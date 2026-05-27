import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import {
  clearWarnings,
  getWarnings,
} from "../moderation/warnings.js";
import type { BotCommand } from "../types/index.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Gerencia avisos de um membro")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName("ver")
        .setDescription("Visualiza os avisos de um membro")
        .addUserOption((opt) =>
          opt
            .setName("usuario")
            .setDescription("Usuário")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("limpar")
        .setDescription("Limpa todos os avisos de um membro")
        .addUserOption((opt) =>
          opt
            .setName("usuario")
            .setDescription("Usuário")
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser("usuario", true);
    const guildId = interaction.guildId!;

    if (sub === "ver") {
      const warns = getWarnings(guildId, target.id);

      if (warns.length === 0) {
        await interaction.editReply(
          `✅ **${target.tag}** não tem avisos.`
        );
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(Colors.Yellow)
        .setTitle(`⚠️ Avisos de ${target.tag}`)
        .setThumbnail(target.displayAvatarURL())
        .setDescription(`Total: **${warns.length}** aviso(s)`);

      for (const [i, w] of warns.entries()) {
        embed.addFields({
          name: `#${i + 1} — <t:${Math.floor(w.timestamp / 1000)}:R>`,
          value: `**Motivo:** ${w.reason}\n**Moderador:** <@${w.moderatorId}>`,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } else if (sub === "limpar") {
      clearWarnings(guildId, target.id);
      await interaction.editReply(
        `✅ Avisos de **${target.tag}** foram limpos.`
      );
    }
  },
};

export default command;
