import { GuildMember, Interaction } from "discord.js";
import type { ExtendedClient } from "../types/index.js";
import { VERIFY_BUTTON_ID, verifyMember } from "../moderation/verification.js";

export async function onInteractionCreate(
  client: ExtendedClient,
  interaction: Interaction
): Promise<void> {
  if (interaction.isButton()) {
    if (interaction.customId === VERIFY_BUTTON_ID) {
      const member = interaction.member as GuildMember;
      await verifyMember(member);
      await interaction.reply({
        content:
          "✅ **Verificado com sucesso!** Agora você tem acesso a todos os canais. Bem-vindo! 🎉",
        ephemeral: true,
      });
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({
      content: "❌ Comando não encontrado.",
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Erro no comando ${interaction.commandName}:`, err);
    const msg = {
      content: "❌ Ocorreu um erro ao executar este comando.",
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(msg);
    } else {
      await interaction.reply(msg);
    }
  }
}
