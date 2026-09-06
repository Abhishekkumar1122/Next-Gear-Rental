export {
  type VipTier,
  type VipSource,
  type VipTierConfig,
  type UserVipDetails,
  VIP_TIER_CONFIGS,
  ensureUserVipTable,
  getUserVipDetails,
  setUserVipTierByAdmin,
  purchasePlatinumPass,
} from "./user-vip-store";

import { VipTier, VIP_TIER_CONFIGS } from "./user-vip-store";

const memoryTiers = new Map<string, VipTier>();

export function getUserVipTier(userIdOrEmail: string): VipTier {
  if (!userIdOrEmail) return "BRONZE";
  return memoryTiers.get(userIdOrEmail) || memoryTiers.get(userIdOrEmail.toLowerCase()) || "BRONZE";
}

export function setUserVipTier(userIdOrEmail: string, tier: VipTier): VipTier {
  if (userIdOrEmail) {
    memoryTiers.set(userIdOrEmail, tier);
    memoryTiers.set(userIdOrEmail.toLowerCase(), tier);
  }
  return tier;
}

export function getVipTierBadge(tier: VipTier) {
  const cfg = VIP_TIER_CONFIGS[tier] || VIP_TIER_CONFIGS.BRONZE;
  return {
    label: cfg.label,
    badge: cfg.badge,
    className: `bg-gradient-to-r ${cfg.colorGradient} border ${cfg.borderColor} ${cfg.textColor} font-black shadow-md`,
  };
}
