"use client";

import dynamic from "next/dynamic";

export const LottieLoader = dynamic(() => import("./LottieLoaderClient"), {
  ssr: false,
});
