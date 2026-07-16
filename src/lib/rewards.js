import { supabase } from "@/lib/supabase-client";

/**
 * Award points for an action. Safe to call even if it's already been
 * awarded for this ref_id — the server enforces idempotency.
 * @param {"post_found" | "report_lost" | "reunite"} action
 * @param {string} refId
 */
export async function awardPoints(action, refId) {
  const { data, error } = await supabase.rpc("award_points", {
    p_action: action,
    p_ref_id: refId,
  });

  if (error) throw error;
  return data;
}

/** @param {string} code */
export async function redeemReferral(code) {
  const { error } = await supabase.rpc("redeem_referral", { p_code: code });
  if (error) throw error;
}

export async function getMyRewards() {
  const { data, error } = await supabase.rpc("get_my_rewards").maybeSingle();
  if (error) throw error;

  return (
    data || {
      points: 0,
      referral_code: null,
      is_founding_member: false,
      referral_count: 0,
    }
  );
}

/** @param {string | null | undefined} referralCode */
export function getReferralLink(referralCode) {
  if (!referralCode) return "";
  return `${window.location.origin}/signup?ref=${referralCode}`;
}
