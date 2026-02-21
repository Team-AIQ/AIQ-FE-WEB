/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    googletag: any;
  }
}

let rewardedSlot: any = null;
let isReady = false;
let onRewardCallback: (() => void) | null = null;

/**
 * 보상형 광고 초기화
 * @param userId 서버 측 검증(SSV)에 사용할 사용자 ID
 */
export function initRewardedAd(userId: string) {
  if (typeof window === "undefined") return;

  const googletag = window.googletag || { cmd: [] };
  window.googletag = googletag;

  googletag.cmd.push(() => {
    rewardedSlot = googletag.defineOutOfPageSlot(
      "/123456789/TEMP_AD_UNIT", // TODO: 실제 AdSense 네트워크 코드/광고 단위 코드로 교체
      googletag.enums.OutOfPageFormat.REWARDED,
    );

    if (rewardedSlot) {
      rewardedSlot.addService(googletag.pubads());
      rewardedSlot.setServerSideVerificationOptions({
        userIdentifier: userId,
      });

      googletag.pubads().addEventListener("rewardedSlotReady", () => {
        isReady = true;
      });

      googletag.pubads().addEventListener("rewardedSlotGranted", () => {
        // 보상은 백엔드 SSV 콜백으로 지급됨 → 프론트는 UI 피드백만
        onRewardCallback?.();
      });

      googletag.enableServices();
      googletag.display(rewardedSlot);
    }
  });
}

/**
 * 보상형 광고 표시
 * @param onReward 광고 시청 완료 시 콜백
 * @returns 광고 표시 성공 여부
 */
export function showRewardedAd(onReward?: () => void): boolean {
  if (!rewardedSlot || !isReady) return false;
  onRewardCallback = onReward || null;
  window.googletag.pubads().makeRewardedVisible(rewardedSlot);
  return true;
}
