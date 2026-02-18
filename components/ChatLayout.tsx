"use client";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="login-bg chat-page-bg" role="presentation" />
      <div className="chat-page-layout">{children}</div>
    </>
  );
}
