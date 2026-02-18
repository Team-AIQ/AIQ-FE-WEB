"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { setTokens, isOnboardingDone } from "@/lib/auth";

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      // URL에 토큰이 남지 않도록 replace로 온보딩 페이지로 이동
      router.replace(isOnboardingDone() ? "/chat" : "/onboarding");
    } else {
      router.replace("/login");
    }
  }, [searchParams, router]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column" as const,
      justifyContent: "center",
      alignItems: "center",
      gap: "1.5rem",
      height: "100vh",
      backgroundColor: "#0a0a0a",
      fontFamily: "Pretendard, sans-serif",
    }}>
      <div style={{
        width: "48px",
        height: "48px",
        border: "3px solid rgba(63, 221, 144, 0.2)",
        borderTopColor: "#45D38E",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ color: "#45D38E", fontSize: "1.1rem", margin: 0 }}>
        로그인 처리 중...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
