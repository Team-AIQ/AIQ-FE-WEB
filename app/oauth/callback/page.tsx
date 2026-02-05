"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { setTokens } from "@/lib/auth";

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      // URL에 토큰이 남지 않도록 replace로 메인 페이지로 이동
      router.replace("/");
    } else {
      router.replace("/login");
    }
  }, [searchParams, router]);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#0a0a0a",
      color: "#45D38E",
      fontFamily: "Pretendard, sans-serif",
      fontSize: "1.2rem"
    }}>
      로그인 처리 중...
    </div>
  );
}
