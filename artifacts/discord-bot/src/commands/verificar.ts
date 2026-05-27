import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { setupVerification, isVerificationSetup } from "../moderation/verification.js";
import type { BotCommand } from "../types/index.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("verificar")
    .setDescription("Gerencia o sistema de verificação de membros")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription(
          "Configura a verificação: cria cargo, canal #verificação e bloqueia canais"
        )
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Mostra se a verificação está configurada")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    if (sub === "status") {
      const active = isVerificationSetup(guild);
      await interaction.editReply(
        active
          ? "✅ Sistema de verificação **ativo** — cargo \"Não Verificado\" encontrado."
          : "❌ Sistema de verificação **não configurado**. Use `/verificar setup`."
      );
      return;
    }

    if (sub === "setup") {
      await interaction.editReply("⏳ Configurando sistema de verificação...");

      try {
        const log = await setupVerification(guild);
        await interaction.editReply(
          `✅ **Sistema de verificação configurado!**\n\n${log.join("\n")}\n\n> Novos membros entrarão sem acesso e verão apenas #verificação até clicar no botão.`
        );
      } catch (err) {
        await interaction.editReply(
          `❌ Erro ao configurar: ${err instanceof Error ? err.message : String(err)}\n\nCertifique-se de que o bot tem permissão de **Administrador** ou **Gerenciar Canais e Cargos**.`
        );
      }
    }
  },
};

export default command;
