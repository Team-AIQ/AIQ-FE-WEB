"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

interface Props {
  size?: number;
}

export default function LottieLoaderClient({ size = 160 }: Props) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // public 폴더의 JSON 파일을 fetch로 로드
    fetch("/loading.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        console.log("Animation data loaded:", !!data);
        setAnimationData(data);
      })
      .catch((err) => {
        console.error("Failed to load Lottie animation:", err);
      });
  }, []);

  // animationData가 없으면 fallback 스피너
  if (!animationData) {
    return (
      <div
        className="animate-spin rounded-full border-4 border-aiq-green border-t-transparent"
        style={{
          width: size,
          height: size,
          flexShrink: 0,
        }}
      />
    );
  }

  // Lottie 애니메이션이 로드되면 계속 표시
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{
          width: size,
          height: size,
          display: "block",
        }}
        rendererSettings={{
          preserveAspectRatio: "xMidYMid meet",
        }}
      />
    </div>
  );
}
