import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import {
  activateLockdown,
  deactivateLockdown,
  isInLockdown,
} from "../automod/raidDetector.js";
import type { BotCommand } from "../types/index.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("lockdown")
    .setDescription("Ativa ou desativa o modo lockdown do servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("on")
        .setDescription("Ativa o lockdown")
        .addStringOption((opt) =>
          opt
            .setName("motivo")
            .setDescription("Motivo do lockdown")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("off").setDescription("Desativa o lockdown manualmente")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    if (sub === "on") {
      if (isInLockdown(guild.id)) {
        await interaction.editReply("⚠️ O servidor já está em lockdown.");
        return;
      }
      const reason =
        interaction.options.getString("motivo") ??
        `Lockdown manual por ${interaction.user.tag}`;
      await activateLockdown(guild, reason);
      await interaction.editReply("🚨 **Lockdown ativado.** Canal #mod-log notificado.");
    } else {
      if (!isInLockdown(guild.id)) {
        await interaction.editReply("✅ O servidor não está em lockdown.");
        return;
      }
      await deactivateLockdown(
        guild,
        `Lockdown encerrado manualmente por ${interaction.user.tag}`
      );
      await interaction.editReply("✅ **Lockdown desativado.** Servidor voltou ao normal.");
    }
  },
};

export default command;
