export type VipTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export type UserTierInfo = {
  userId: string;
  tier: VipTier;
  updatedAt: string;
};

const memoryTiers = new Map<string, VipTier>();

// Seed default tiers
memoryTiers.set("customer@next-gear.app", "GOLD");
memoryTiers.set("speed@test.com", "SILVER");

export function getUserVipTier(userIdOrEmail: string): VipTier {
  return memoryTiers.get(userIdOrEmail) || memoryTiers.get(userIdOrEmail.toLowerCase()) || "BRONZE";
}

export function setUserVipTier(userIdOrEmail: string, tier: VipTier): VipTier {
  memoryTiers.set(userIdOrEmail, tier);
  memoryTiers.set(userIdOrEmail.toLowerCase(), tier);
  return tier;
}

export function getVipTierBadge(tier: VipTier) {
  switch (tier) {
    case "GOLD":
      return {
        label: "🥇 GOLD VIP",
        className: "bg-gradient-to-r from-amber-500/20 to-yellow-500/30 border border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/20",
      };
    case "PLATINUM":
      return {
        label: "💎 PLATINUM VIP",
        className: "bg-gradient-to-r from-purple-500/20 via-pink-500/30 to-indigo-500/20 border border-purple-500/50 text-purple-200 shadow-md shadow-purple-500/30",
      };
    case "SILVER":
      return {
        label: "🥈 SILVER VIP",
        className: "bg-gradient-to-r from-slate-400/20 to-cyan-500/20 border border-cyan-400/40 text-cyan-200",
      };
    default:
      return {
        label: "🥉 BRONZE",
        className: "bg-slate-900 border border-white/10 text-white/60",
      };
  }
}
