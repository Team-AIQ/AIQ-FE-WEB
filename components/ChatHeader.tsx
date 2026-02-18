"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserNickname, isGuest, clearTokens } from "@/lib/auth";

interface ChatHeaderProps {
  onMenuClick?: () => void; // 사이드바 열기용
}

export default function ChatHeader({ onMenuClick }: ChatHeaderProps) {
  const [isGuestUser, setIsGuestUser] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userNickname, setUserNickname] = useState<string>("사용자");

  // 🔥 로그인 정보 세팅
  useEffect(() => {
    setIsGuestUser(isGuest());

    const nickname = getUserNickname();
    if (nickname) {
      setUserNickname(nickname);
    }
  }, []);

  return (
    <header className="chat-header">
      {/* 메뉴 버튼 (로그인 유저만) */}
      {!isGuestUser && (
        <button
          type="button"
          className="chat-menu-btn"
          aria-label="메뉴"
          onClick={() => onMenuClick?.()}
        >
          <img
            src="/image/chat-menu-icon.png"
            alt=""
            className="chat-menu-icon-img"
            aria-hidden
          />
        </button>
      )}

      {/* 로고 */}
      <Link href="/" className="chat-logo">
        <img
          src="/image/chat-logo.png"
          alt="AIQ"
          className="chat-logo-img"
          onError={(e) =>
            e.currentTarget.parentElement?.classList.add("fallback")
          }
        />
        <span className="chat-logo-fallback">
          <span className="logo-icon">A</span>
          <span className="logo-text">AIQ</span>
        </span>
      </Link>

      {/* 유저 영역 */}
      <div className="chat-user-box-wrap">
        <button
          type="button"
          className="chat-user-box onboarding-user-box"
          onClick={() => setShowUserMenu((prev) => !prev)}
        >
          <img
            src="/image/user-icon.png"
            alt=""
            className="onboarding-user-icon"
            aria-hidden
          />
          <span className="onboarding-user-name">{userNickname}</span>
        </button>

        {showUserMenu && (
          <div className="chat-user-dropdown">
            <button
              type="button"
              className="chat-user-dropdown-item"
              onClick={() => {
                clearTokens();
                window.location.href = "/login";
              }}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
