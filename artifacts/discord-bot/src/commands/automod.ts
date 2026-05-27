import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import {
  getConfig,
  addBannedWord,
  removeBannedWord,
  setSpamConfig,
  setCapsConfig,
  setMentionsConfig,
  setInviteFilter,
  setRaidConfig,
} from "../moderation/configStore.js";
import type { BotCommand } from "../types/index.js";

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Gerencia as configurações de auto-moderação")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Mostra a configuração atual do auto-mod")
    )

    .addSubcommand((sub) =>
      sub
        .setName("palavra-add")
        .setDescription("Adiciona uma palavra proibida")
        .addStringOption((opt) =>
          opt.setName("palavra").setDescription("Palavra a bloquear").setRequired(true)
        )
    )

    .addSubcommand((sub) =>
      sub
        .setName("palavra-remove")
        .setDescription("Remove uma palavra proibida")
        .addStringOption((opt) =>
          opt.setName("palavra").setDescription("Palavra a remover").setRequired(true)
        )
    )

    .addSubcommand((sub) =>
      sub.setName("palavras").setDescription("Lista todas as palavras proibidas")
    )

    .addSubcommand((sub) =>
      sub
        .setName("spam")
        .setDescription("Configura o limite de spam")
        .addIntegerOption((opt) =>
          opt
            .setName("mensagens")
            .setDescription("Máximo de mensagens na janela de tempo")
            .setMinValue(2)
            .setMaxValue(40)
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("segundos")
            .setDescription("Janela de tempo em segundos")
            .setMinValue(1)
            .setMaxValue(60)
            .setRequired(true)
        )
    )

    .addSubcommand((sub) =>
      sub
        .setName("caps")
        .setDescription("Configura o filtro de CAPS LOCK")
        .addIntegerOption((opt) =>
          opt
            .setName("percentual")
            .setDescription("% de maiúsculas para bloquear (ex: 90). Use 100 para desativar.")
            .setMinValue(50)
            .setMaxValue(100)
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("minchars")
            .setDescription("Mínimo de letras para aplicar o filtro (padrão: 20)")
            .setMinValue(3)
            .setMaxValue(100)
            .setRequired(false)
        )
    )

    .addSubcommand((sub) =>
      sub
        .setName("mentions")
        .setDescription("Configura o máximo de menções por mensagem")
        .addIntegerOption((opt) =>
          opt
            .setName("max")
            .setDescription("Número máximo de menções permitidas")
            .setMinValue(1)
            .setMaxValue(30)
            .setRequired(true)
        )
    )

    .addSubcommand((sub) =>
      sub
        .setName("invite")
        .setDescription("Ativa ou desativa o bloqueio de links de convite")
        .addBooleanOption((opt) =>
          opt
            .setName("ativo")
            .setDescription("true = bloquear invites, false = permitir")
            .setRequired(true)
        )
    )

    .addSubcommand((sub) =>
      sub
        .setName("raid")
        .setDescription("Configura a proteção anti-raid")
        .addBooleanOption((opt) =>
          opt.setName("ativo").setDescription("Ativar/desativar anti-raid").setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("entradas")
            .setDescription("Entradas para disparar lockdown (padrão: 8)")
            .setMinValue(3)
            .setMaxValue(50)
            .setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("segundos")
            .setDescription("Janela de tempo em segundos (padrão: 10)")
            .setMinValue(3)
            .setMaxValue(60)
            .setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("lockdown_minutos")
            .setDescription("Duração do lockdown em minutos (padrão: 15)")
            .setMinValue(1)
            .setMaxValue(60)
            .setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();

    if (sub === "status") {
      const cfg = getConfig();
      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle("🤖 Configuração do Auto-Mod")
        .addFields(
          {
            name: "🚫 Palavras proibidas",
            value: `${cfg.bannedWords.length} palavra(s) cadastrada(s)`,
            inline: true,
          },
          {
            name: "📨 Spam",
            value: `Máx. ${cfg.spam.maxMessages} msgs em ${cfg.spam.timeWindowMs / 1000}s`,
            inline: true,
          },
          {
            name: "🔠 Caps Lock",
            value: cfg.caps.threshold >= 1
              ? "Desativado"
              : `${Math.round(cfg.caps.threshold * 100)}% maiúsculas (mín. ${cfg.caps.minLength} letras)`,
            inline: true,
          },
          {
            name: "📢 Menções",
            value: `Máx. ${cfg.mentions.max} por mensagem`,
            inline: true,
          },
          {
            name: "🔗 Filtro de Invites",
            value: cfg.inviteFilter ? "✅ Ativo" : "❌ Desativado",
            inline: true,
          },
          {
            name: "🛡️ Anti-Raid",
            value: cfg.raid.enabled
              ? `✅ Ativo — ${cfg.raid.maxJoins} entradas em ${cfg.raid.timeWindowMs / 1000}s → lockdown ${cfg.raid.lockdownMinutes}min`
              : "❌ Desativado",
            inline: false,
          }
        )
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === "palavra-add") {
      const word = interaction.options.getString("palavra", true);
      const added = addBannedWord(word);
      await interaction.editReply(
        added
          ? `✅ Palavra **"${word}"** adicionada à lista de bloqueio.`
          : `⚠️ A palavra **"${word}"** já está na lista.`
      );
      return;
    }

    if (sub === "palavra-remove") {
      const word = interaction.options.getString("palavra", true);
      const removed = removeBannedWord(word);
      await interaction.editReply(
        removed
          ? `✅ Palavra **"${word}"** removida da lista de bloqueio.`
          : `❌ Palavra **"${word}"** não encontrada na lista.`
      );
      return;
    }

    if (sub === "palavras") {
      const cfg = getConfig();
      if (cfg.bannedWords.length === 0) {
        await interaction.editReply("📋 Nenhuma palavra proibida cadastrada.");
        return;
      }
      const list = cfg.bannedWords.map((w, i) => `${i + 1}. ||${w}||`).join("\n");
      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle(`🚫 Palavras Proibidas (${cfg.bannedWords.length})`)
        .setDescription(list.slice(0, 4000));
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === "spam") {
      const maxMessages = interaction.options.getInteger("mensagens", true);
      const seconds = interaction.options.getInteger("segundos", true);
      setSpamConfig(maxMessages, seconds * 1000);
      await interaction.editReply(
        `✅ Spam configurado: máx. **${maxMessages}** mensagens em **${seconds}s**.`
      );
      return;
    }

    if (sub === "caps") {
      const pct = interaction.options.getInteger("percentual", true);
      const minChars = interaction.options.getInteger("minchars") ?? 20;
      setCapsConfig(minChars, pct / 100);
      await interaction.editReply(
        pct >= 100
          ? `✅ Filtro de caps **desativado**.`
          : `✅ Filtro de caps: bloqueia mensagens com **${pct}%** de maiúsculas (mín. ${minChars} letras).`
      );
      return;
    }

    if (sub === "mentions") {
      const max = interaction.options.getInteger("max", true);
      setMentionsConfig(max);
      await interaction.editReply(`✅ Máximo de menções por mensagem: **${max}**.`);
      return;
    }

    if (sub === "invite") {
      const ativo = interaction.options.getBoolean("ativo", true);
      setInviteFilter(ativo);
      await interaction.editReply(
        ativo
          ? "✅ Filtro de convites **ativado** — links de invite serão bloqueados."
          : "✅ Filtro de convites **desativado** — seus amigos podem compartilhar links."
      );
      return;
    }

    if (sub === "raid") {
      const ativo = interaction.options.getBoolean("ativo", true);
      const cfg = getConfig();
      const maxJoins = interaction.options.getInteger("entradas") ?? cfg.raid.maxJoins;
      const seconds = interaction.options.getInteger("segundos") ?? cfg.raid.timeWindowMs / 1000;
      const lockdownMin = interaction.options.getInteger("lockdown_minutos") ?? cfg.raid.lockdownMinutes;
      setRaidConfig(ativo, maxJoins, seconds * 1000, lockdownMin);
      await interaction.editReply(
        ativo
          ? `✅ Anti-raid **ativado** — lockdown ao detectar **${maxJoins}** entradas em **${seconds}s** (lockdown: ${lockdownMin}min).`
          : "✅ Anti-raid **desativado**."
      );
      return;
    }
  },
};

export default command;
