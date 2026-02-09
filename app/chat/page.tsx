"use client";

import Link from "next/link";
import { useState } from "react";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

export default function ChatPage() {
  const [inputValue, setInputValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: Date.now(),
      text: inputValue.trim(),
      isUser: true,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setShowWelcome(false);
    
    // AI 답변 자동 추가
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now() + 1,
        text: "정밀한 결과를 제공하기 위해 몇 가지 질문을 할게!",
        isUser: false,
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <>
      <div className="login-bg chat-page-bg" role="presentation" />

      {/* 사이드바 오버레이: 클릭 시 메뉴 닫기 */}
      {menuOpen && (
        <button
          type="button"
          className="chat-sidebar-overlay"
          aria-label="메뉴 닫기"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* 왼쪽 슬라이드 메뉴바 */}
      <aside
        className={`chat-sidebar ${menuOpen ? "chat-sidebar--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="chat-sidebar-inner">
          <div className="chat-sidebar-header">
            <span className="chat-sidebar-title">메뉴</span>
            <button
              type="button"
              className="chat-sidebar-close"
              aria-label="메뉴 닫기"
              onClick={() => setMenuOpen(false)}
            >
              ×
            </button>
          </div>
          <nav className="chat-sidebar-nav">
            <Link href="/" className="chat-sidebar-link" onClick={() => setMenuOpen(false)}>
              홈
            </Link>
            <Link href="/onboarding" className="chat-sidebar-link" onClick={() => setMenuOpen(false)}>
              온보딩
            </Link>
          </nav>
        </div>
      </aside>

      <header className="chat-header">
        <button
          type="button"
          className="chat-menu-btn"
          aria-label="메뉴"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <img src="/image/chat-menu-icon.png" alt="" className="chat-menu-icon-img" aria-hidden />
        </button>
        <Link href="/" className="chat-logo">
          <img
            src="/image/chat-logo.png"
            alt="AIQ"
            className="chat-logo-img"
            onError={(e) => e.currentTarget.parentElement?.classList.add("fallback")}
          />
          <span className="chat-logo-fallback">
            <span className="logo-icon">A</span>
            <span className="logo-text">AIQ</span>
          </span>
        </Link>
        <div className="chat-user-box onboarding-user-box">
          <img src="/image/user-icon.png" alt="" className="onboarding-user-icon" aria-hidden />
          <span className="onboarding-user-name">멋쟁이 요리사</span>
        </div>
      </header>

      <main className="chat-main">
        {showWelcome && (
          <>
            <p className="chat-welcome">
              만나서 반가워! 난 피클이야
              <br />
              <span className="chat-welcome-line2">너의 장바구니를 비워줄게 필요한 제품을 말해봐</span>
            </p>
            <div className="chat-character-wrap">
              <div className="chat-character">
                <img
                  src="/image/chat-character-new.png"
                  alt="피클"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
            </div>
            <div className="chat-hint">
              <img src="/image/chat-hint-bubble.png" alt="" className="chat-hint-bubble-img" aria-hidden />
              <span className="chat-hint-text">검색창에 필요한 제품을 입력해줘</span>
            </div>
          </>
        )}

        {messages.length > 0 && (
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.isUser ? "chat-message--user" : "chat-message--ai"}`}>
                {msg.isUser ? (
                  <>
                    <div className="chat-message-icon">
                      <img src="/image/user-profile-icon.png" alt="" aria-hidden />
                    </div>
                    <div className="chat-message-bubble">
                      {msg.text}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="chat-message-avatar">
                      <img src="/image/chat-character.png" alt="AIQ 피클" aria-hidden />
                    </div>
                    <div className="chat-message-bubble chat-message-bubble--ai">
                      {msg.text}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="chat-input-wrap">
          <input
            type="text"
            className="chat-input"
            placeholder="무엇이든 물어보세요"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            aria-label="메시지 입력"
          />
          <button type="button" className="chat-send-btn" aria-label="보내기" onClick={handleSend}>
            <img src="/image/chat-send-icon.png" alt="" className="chat-send-icon" aria-hidden />
          </button>
        </div>
      </main>
    </>
  );
}
