import {
  ChannelType,
  Guild,
  GuildChannel,
  OverwriteType,
} from "discord.js";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "fs";

const BACKUP_DIR = "./data/backups";

export interface BackupPermOverwrite {
  type: 0 | 1;
  id: string;
  allow: string;
  deny: string;
}

export interface BackupRole {
  name: string;
  color: number;
  hoist: boolean;
  mentionable: boolean;
  permissions: string;
  position: number;
  unicodeEmoji?: string;
}

export interface BackupChannel {
  name: string;
  type: ChannelType;
  position: number;
  categoryName?: string;
  topic?: string;
  nsfw?: boolean;
  rateLimitPerUser?: number;
  userLimit?: number;
  bitrate?: number;
  permissionOverwrites: BackupPermOverwrite[];
}

export interface ServerBackup {
  id: string;
  createdAt: number;
  guildId: string;
  guildName: string;
  iconURL: string | null;
  description: string | null;
  verificationLevel: number;
  defaultMessageNotifications: number;
  explicitContentFilter: number;
  afkTimeout: number;
  everyonePermissions: string;
  roles: BackupRole[];
  channels: BackupChannel[];
}

export function createBackup(guild: Guild): ServerBackup {
  const backup: ServerBackup = {
    id: Date.now().toString(),
    createdAt: Date.now(),
    guildId: guild.id,
    guildName: guild.name,
    iconURL: guild.iconURL({ size: 512 }),
    description: guild.description,
    verificationLevel: guild.verificationLevel,
    defaultMessageNotifications: guild.defaultMessageNotifications,
    explicitContentFilter: guild.explicitContentFilter,
    afkTimeout: guild.afkTimeout,
    everyonePermissions: guild.roles.everyone.permissions.bitfield.toString(),
    roles: [],
    channels: [],
  };

  const roles = [...guild.roles.cache.values()]
    .filter((r) => !r.managed && r.name !== "@everyone")
    .sort((a, b) => a.position - b.position);

  for (const role of roles) {
    backup.roles.push({
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      mentionable: role.mentionable,
      permissions: role.permissions.bitfield.toString(),
      position: role.position,
      unicodeEmoji: role.unicodeEmoji ?? undefined,
    });
  }

  const allChannels = [...guild.channels.cache.values()].filter(
    (ch) => !ch.isThread()
  );

  const categories = allChannels
    .filter((ch) => ch.type === ChannelType.GuildCategory)
    .sort((a, b) => (a as GuildChannel).position - (b as GuildChannel).position);

  const rest = allChannels
    .filter((ch) => ch.type !== ChannelType.GuildCategory)
    .sort((a, b) => (a as GuildChannel).position - (b as GuildChannel).position);

  for (const ch of [...categories, ...rest]) {
    const gCh = ch as GuildChannel;
    const permOverwrites: BackupPermOverwrite[] = [];

    if ("permissionOverwrites" in gCh) {
      for (const [, ow] of gCh.permissionOverwrites.cache) {
        let owId: string;
        if (ow.type === OverwriteType.Role) {
          const role = guild.roles.cache.get(ow.id);
          owId = role
            ? role.name === "@everyone"
              ? "@everyone"
              : role.name
            : ow.id;
        } else {
          owId = ow.id;
        }
        permOverwrites.push({
          type: ow.type as 0 | 1,
          id: owId,
          allow: ow.allow.bitfield.toString(),
          deny: ow.deny.bitfield.toString(),
        });
      }
    }

    const chData: BackupChannel = {
      name: gCh.name,
      type: gCh.type,
      position: gCh.position,
      permissionOverwrites: permOverwrites,
    };

    if (gCh.parentId) {
      chData.categoryName = guild.channels.cache.get(gCh.parentId)?.name;
    }

    const a = gCh as unknown as Record<string, unknown>;
    if (typeof a["topic"] === "string") chData.topic = a["topic"];
    if (typeof a["nsfw"] === "boolean") chData.nsfw = a["nsfw"];
    if (typeof a["rateLimitPerUser"] === "number")
      chData.rateLimitPerUser = a["rateLimitPerUser"];
    if (typeof a["userLimit"] === "number") chData.userLimit = a["userLimit"];
    if (typeof a["bitrate"] === "number") chData.bitrate = a["bitrate"];

    backup.channels.push(chData);
  }

  return backup;
}

export function saveBackup(backup: ServerBackup): void {
  const dir = `${BACKUP_DIR}/${backup.guildId}`;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/${backup.id}.json`, JSON.stringify(backup, null, 2));
}

export function listBackups(guildId: string): ServerBackup[] {
  const dir = `${BACKUP_DIR}/${guildId}`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf-8")) as ServerBackup)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function listAllBackups(): ServerBackup[] {
  if (!existsSync(BACKUP_DIR)) return [];
  const all: ServerBackup[] = [];
  for (const guildId of readdirSync(BACKUP_DIR)) {
    all.push(...listBackups(guildId));
  }
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export function loadBackup(backupId: string): ServerBackup | null {
  if (!existsSync(BACKUP_DIR)) return null;
  for (const guildId of readdirSync(BACKUP_DIR)) {
    const path = `${BACKUP_DIR}/${guildId}/${backupId}.json`;
    if (existsSync(path)) {
      try {
        return JSON.parse(readFileSync(path, "utf-8")) as ServerBackup;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function deleteBackup(backupId: string): boolean {
  if (!existsSync(BACKUP_DIR)) return false;
  for (const guildId of readdirSync(BACKUP_DIR)) {
    const path = `${BACKUP_DIR}/${guildId}/${backupId}.json`;
    if (existsSync(path)) {
      rmSync(path);
      return true;
    }
  }
  return false;
}

function buildOverwrites(
  overwrites: BackupPermOverwrite[],
  roleNameToId: Map<string, string>,
  guildId: string
): { id: string; type: OverwriteType; allow: bigint; deny: bigint }[] {
  const result: { id: string; type: OverwriteType; allow: bigint; deny: bigint }[] = [];
  for (const ow of overwrites) {
    let id: string;
    if (ow.type === OverwriteType.Role) {
      id = ow.id === "@everyone" ? guildId : (roleNameToId.get(ow.id) ?? "");
    } else {
      id = ow.id;
    }
    if (!id) continue;
    result.push({
      id,
      type: ow.type as OverwriteType,
      allow: BigInt(ow.allow),
      deny: BigInt(ow.deny),
    });
  }
  return result;
}

export type ProgressFn = (msg: string) => Promise<void>;

export async function restoreBackup(
  guild: Guild,
  backup: ServerBackup,
  onProgress: ProgressFn
): Promise<void> {
  await onProgress("⚙️ **[1/6]** Aplicando configurações do servidor...");
  try {
    await guild.edit({
      name: backup.guildName,
      verificationLevel: backup.verificationLevel,
      defaultMessageNotifications: backup.defaultMessageNotifications,
      explicitContentFilter: backup.explicitContentFilter,
      afkTimeout: backup.afkTimeout,
      description: backup.description ?? undefined,
    });
    if (backup.iconURL) {
      try {
        const res = await fetch(backup.iconURL);
        await guild.setIcon(Buffer.from(await res.arrayBuffer()));
      } catch { /* icon optional */ }
    }
  } catch (err) {
    console.warn("Falha ao aplicar configurações:", err);
  }

  await onProgress("🗑️ **[2/6]** Removendo canais antigos...");
  for (const [, ch] of guild.channels.cache) {
    try { await ch.delete("Restaurando backup"); } catch { /* skip */ }
  }

  await onProgress("🗑️ **[3/6]** Removendo cargos antigos...");
  const rolesToDelete = [...guild.roles.cache.values()]
    .filter((r) => !r.managed && r.name !== "@everyone")
    .sort((a, b) => b.position - a.position);
  for (const role of rolesToDelete) {
    try { await role.delete("Restaurando backup"); } catch { /* skip */ }
  }

  await onProgress("👥 **[4/6]** Recriando cargos...");
  const roleNameToId = new Map<string, string>();
  try {
    await guild.roles.everyone.setPermissions(BigInt(backup.everyonePermissions));
  } catch { /* skip */ }

  for (const rData of backup.roles) {
    try {
      const newRole = await guild.roles.create({
        name: rData.name,
        color: rData.color,
        hoist: rData.hoist,
        mentionable: rData.mentionable,
        permissions: BigInt(rData.permissions),
        reason: "Restaurando backup",
      });
      roleNameToId.set(rData.name, newRole.id);
    } catch (err) {
      console.warn(`Cargo "${rData.name}" falhou:`, err);
    }
  }

  await onProgress("📁 **[5/6]** Recriando categorias...");
  const categoryNameToId = new Map<string, string>();
  const cats = backup.channels.filter((c) => c.type === ChannelType.GuildCategory);
  for (const cat of cats) {
    try {
      const overwrites = buildOverwrites(cat.permissionOverwrites, roleNameToId, guild.id);
      const newCat = await guild.channels.create({
        name: cat.name,
        type: ChannelType.GuildCategory,
        position: cat.position,
        permissionOverwrites: overwrites,
        reason: "Restaurando backup",
      });
      categoryNameToId.set(cat.name, newCat.id);
    } catch (err) {
      console.warn(`Categoria "${cat.name}" falhou:`, err);
    }
  }

  await onProgress("💬 **[6/6]** Recriando canais...");
  const nonCats = backup.channels.filter((c) => c.type !== ChannelType.GuildCategory);
  for (const chData of nonCats) {
    try {
      const overwrites = buildOverwrites(chData.permissionOverwrites, roleNameToId, guild.id);
      const parentId = chData.categoryName
        ? categoryNameToId.get(chData.categoryName)
        : undefined;

      const opts: Record<string, unknown> = {
        name: chData.name,
        type: chData.type,
        position: chData.position,
        permissionOverwrites: overwrites,
        reason: "Restaurando backup",
      };

      if (parentId) opts["parent"] = parentId;
      if (chData.topic) opts["topic"] = chData.topic;
      if (chData.nsfw !== undefined) opts["nsfw"] = chData.nsfw;
      if (chData.rateLimitPerUser) opts["rateLimitPerUser"] = chData.rateLimitPerUser;
      if (chData.userLimit) opts["userLimit"] = chData.userLimit;
      if (chData.bitrate) opts["bitrate"] = chData.bitrate;

      await guild.channels.create(opts as unknown as Parameters<typeof guild.channels.create>[0]);
    } catch (err) {
      console.warn(`Canal "${chData.name}" falhou:`, err);
    }
  }
}
