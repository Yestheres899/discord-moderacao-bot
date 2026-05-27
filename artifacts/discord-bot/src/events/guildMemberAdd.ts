import { GuildMember } from "discord.js";
import { checkRaid, isInLockdown } from "../automod/raidDetector.js";
import { assignUnverified, isVerificationSetup } from "../moderation/verification.js";

export async function onGuildMemberAdd(member: GuildMember): Promise<void> {
  const raidDetected = await checkRaid(member.guild);

  if (!raidDetected && isInLockdown(member.guild.id)) {
    try {
      await member.kick("Servidor em lockdown por raid");
    } catch {
      // sem permissão ou membro já saiu
    }
    return;
  }

  if (isVerificationSetup(member.guild)) {
    await assignUnverified(member);
  }
}
