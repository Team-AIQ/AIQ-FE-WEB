import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIQ 사용법 - AIQ",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
