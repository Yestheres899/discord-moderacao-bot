import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import {
  createBackup,
  saveBackup,
  listAllBackups,
  loadBackup,
  deleteBackup,
  restoreBackup,
} from "../moderation/backup.js";
import type { BotCommand } from "../types/index.js";

const ALLOWED_IDS = ["1350201022429138946", "1390439683405774848"];

function checkPermission(userId: string): boolean {
  return ALLOWED_IDS.includes(userId);
}

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("backup")
    .setDescription("Sistema de backup e restauração do servidor")

    .addSubcommand((sub) =>
      sub
        .setName("criar")
        .setDescription("Salva uma cópia completa do servidor atual")
    )

    .addSubcommand((sub) =>
      sub
        .setName("lista")
        .setDescription("Lista todos os backups disponíveis")
    )

    .addSubcommand((sub) =>
      sub
        .setName("restaurar")
        .setDescription("Restaura um backup neste servidor (apaga canais/cargos atuais!)")
        .addStringOption((opt) =>
          opt
            .setName("id")
            .setDescription("ID do backup (use /backup lista para ver os IDs)")
            .setRequired(true)
        )
    )

    .addSubcommand((sub) =>
      sub
        .setName("deletar")
        .setDescription("Remove um backup salvo")
        .addStringOption((opt) =>
          opt
            .setName("id")
            .setDescription("ID do backup")
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!checkPermission(interaction.user.id)) {
      await interaction.reply({ content: "🔒 Sem permissão.", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    if (sub === "criar") {
      await interaction.editReply("⏳ Coletando dados do servidor...");
      try {
        const backup = createBackup(guild);
        saveBackup(backup);

        const embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle("✅ Backup criado com sucesso!")
          .addFields(
            { name: "Servidor", value: backup.guildName, inline: true },
            { name: "ID do Backup", value: `\`${backup.id}\``, inline: true },
            { name: "Cargos", value: `${backup.roles.length}`, inline: true },
            { name: "Canais", value: `${backup.channels.length}`, inline: true },
            {
              name: "Data",
              value: `<t:${Math.floor(backup.createdAt / 1000)}:F>`,
              inline: true,
            }
          )
          .setFooter({
            text: 'Use /backup restaurar <id> para recuperar esse backup',
          })
          .setTimestamp();

        await interaction.editReply({ content: "", embeds: [embed] });
      } catch (err) {
        await interaction.editReply(
          `❌ Erro ao criar backup: ${err instanceof Error ? err.message : String(err)}`
        );
      }
      return;
    }

    if (sub === "lista") {
      const all = listAllBackups();
      if (all.length === 0) {
        await interaction.editReply("📋 Nenhum backup encontrado.");
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle(`📦 Backups disponíveis (${all.length})`)
        .setDescription(
          all
            .slice(0, 10)
            .map(
              (b, i) =>
                `**${i + 1}.** \`${b.id}\`\n` +
                `> 🏷️ ${b.guildName} — <t:${Math.floor(b.createdAt / 1000)}:R>\n` +
                `> ${b.roles.length} cargos · ${b.channels.length} canais`
            )
            .join("\n\n")
        );

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === "restaurar") {
      const id = interaction.options.getString("id", true);
      const backup = loadBackup(id);

      if (!backup) {
        await interaction.editReply(`❌ Backup \`${id}\` não encontrado.`);
        return;
      }

      await interaction.editReply(
        `⚠️ **ATENÇÃO:** Isso vai apagar TODOS os canais e cargos atuais deste servidor e restaurar o backup de **${backup.guildName}** (salvo <t:${Math.floor(backup.createdAt / 1000)}:R>).\n\n⏳ Iniciando restauração...`
      );

      try {
        await restoreBackup(guild, backup, async (msg) => {
          await interaction.editReply(msg).catch(() => {});
        });

        await interaction.editReply(
          `✅ **Restauração concluída!**\n\nServidor restaurado para o backup de **${backup.guildName}**.\n> ${backup.roles.length} cargos · ${backup.channels.length} canais recriados.`
        ).catch(() => {});
      } catch (err) {
        await interaction.editReply(
          `❌ Erro durante a restauração: ${err instanceof Error ? err.message : String(err)}`
        ).catch(() => {});
      }
      return;
    }

    if (sub === "deletar") {
      const id = interaction.options.getString("id", true);
      const deleted = deleteBackup(id);
      await interaction.editReply(
        deleted
          ? `✅ Backup \`${id}\` removido.`
          : `❌ Backup \`${id}\` não encontrado.`
      );
      return;
    }
  },
};

export default command;
