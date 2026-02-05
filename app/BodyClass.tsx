"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function BodyClass() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/onboarding") {
      document.body.classList.add("onboarding-page");
      document.body.classList.remove("login-page", "chat-page");
    } else if (pathname === "/chat") {
      document.body.classList.add("chat-page");
      document.body.classList.remove("login-page", "onboarding-page");
    } else if (pathname === "/login" || pathname === "/signup") {
      document.body.classList.add("login-page");
      document.body.classList.remove("onboarding-page", "chat-page");
    } else {
      document.body.classList.remove("login-page", "onboarding-page", "chat-page");
    }
  }, [pathname]);

  return null;
}
