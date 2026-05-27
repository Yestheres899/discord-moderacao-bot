import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { logModAction } from "../moderation/logger.js";
import type { BotCommand } from "../types/index.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Deleta mensagens do canal")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opt) =>
      opt
        .setName("quantidade")
        .setDescription("Quantidade de mensagens (1-100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption((opt) =>
      opt
        .setName("usuario")
        .setDescription("Filtrar mensagens de um usuário específico")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const amount = interaction.options.getInteger("quantidade", true);
    const targetUser = interaction.options.getUser("usuario");

    const channel = interaction.channel as TextChannel;
    if (!channel?.isTextBased()) {
      await interaction.editReply("❌ Este canal não suporta deleção de mensagens.");
      return;
    }

    const messages = await channel.messages.fetch({ limit: 100 });

    let toDelete = [...messages.values()].slice(0, amount);

    if (targetUser) {
      toDelete = toDelete
        .filter((m) => m.author.id === targetUser.id)
        .slice(0, amount);
    }

    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    toDelete = toDelete.filter((m) => m.createdTimestamp > twoWeeksAgo);

    if (toDelete.length === 0) {
      await interaction.editReply(
        "❌ Nenhuma mensagem elegível para deletar (mensagens devem ter menos de 14 dias)."
      );
      return;
    }

    const deleted = await channel.bulkDelete(toDelete, true);

    await logModAction({
      guild: interaction.guild!,
      action: "CLEAR",
      target: targetUser ?? interaction.user,
      moderator: interaction.user,
      reason: `${deleted.size} mensagens deletadas em #${channel.name}`,
    });

    await interaction.editReply(
      `✅ **${deleted.size}** mensagem(ns) deletada(s)${targetUser ? ` de ${targetUser.tag}` : ""}.`
    );
  },
};

export default command;
