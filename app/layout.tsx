import type { Metadata } from "next";
import { BodyClass } from "./BodyClass";
import "../styles.css";
import "../login.css";
import "../onboarding.css";
import "../chat.css";
import "../profile.css";

export const metadata: Metadata = {
  title: "AIQ - 쇼핑 의사결정을 돕는 대화형 AI 서비스",
  description: "AIQ - 쇼핑 의사결정을 돕는 대화형 AI 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/galmuri@2.39.2/dist/galmuri.css"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <BodyClass />
        {children}
      </body>
    </html>
  );
}
