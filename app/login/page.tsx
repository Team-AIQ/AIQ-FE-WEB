"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") === "email" ? "email" : "social";
  const [view, setView] = useState<"social" | "email">(initialView);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <>
      <div className="login-bg" role="presentation" />

      {view === "email" ? (
        <a
          href="#"
          className="login-back"
          onClick={(e) => {
            e.preventDefault();
            setView("social");
          }}
          aria-label="소셜 로그인 화면으로"
        >
          ← 뒤로가기
        </a>
      ) : (
        <Link href="/#hero" className="login-back" aria-label="랜딩페이지 1단으로 돌아가기">
          ← 뒤로가기
        </Link>
      )}

      <div className="login-character" role="presentation">
        <img src="/image/login-character.png" alt="" onError={(e) => (e.currentTarget.style.display = "none")} />
      </div>

      <main className="login-main">
        <div className="login-panel">
          <Link href="/" className="login-logo">
            <img
              src="/image/login-logo.png"
              alt="AIQ"
              className="login-logo-img"
              onError={(e) => e.currentTarget.parentElement?.classList.add("fallback")}
            />
            <span className="login-logo-fallback">
              <span className="logo-icon">A</span>
              <span className="logo-text">AIQ</span>
            </span>
          </Link>

          {view === "social" ? (
            <>
              <div className="login-social">
                <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/oauth2/authorization/kakao?origin=web`} className="login-social-btn" id="btn-kakao" aria-label="카카오로 로그인">
                  <img src="/image/login-btn-kakao.png" alt="카카오로 계속하기" />
                </a>
                <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/oauth2/authorization/google?origin=web`} className="login-social-btn" id="btn-google" aria-label="Google로 로그인">
                  <img src="/image/login-btn-google.png" alt="Google로 계속하기" />
                </a>
                <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/oauth2/authorization/Naver?origin=web`} className="login-social-btn" id="btn-naver" aria-label="네이버로 로그인">
                  <img src="/image/login-btn-naver.png" alt="네이버로 계속하기" />
                </a>
              </div>

              <p className="login-agreement">
                회원가입 없이 이용 가능하며, 첫 로그인 시 <a href="#" className="login-link">이용약관</a>
                <br />
                및 <a href="#" className="login-link">개인정보처리방침</a> 동의로 간주합니다.
              </p>

              <div className="login-email-links">
                <button type="button" className="login-email-link-btn" onClick={() => setView("email")}>
                  이메일로 로그인
                </button>
                <span className="sep">|</span>
                <Link href="/signup">이메일로 가입</Link>
              </div>
            </>
          ) : (
            <div className="login-email-form">
              <div className="login-input-wrap">
                <input
                  type="email"
                  className={`login-input${emailError ? " login-input--error" : ""}`}
                  placeholder="이메일 입력"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  onBlur={() => {
                    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setEmailError("이메일이 올바르지 않습니다");
                  }}
                />
                {emailError && <p className="login-input-error-msg" role="alert">{emailError}</p>}
              </div>
              <div className="login-input-wrap login-input-wrap--password">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`login-input${passwordError ? " login-input--error" : ""}`}
                  placeholder="비밀번호 입력"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? (
                    /* 비밀번호 보일 때: 선 없는 열린 눈 */
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    /* 진입 시·비밀번호 숨길 때: 선 있는 눈(비공개) */
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
                {passwordError && <p className="login-input-error-msg" role="alert">{passwordError}</p>}
              </div>
              <div className="login-form-options">
                <label className="login-check-wrap">
                  <input type="checkbox" className="login-check" />
                  <span className="login-check-text">자동 로그인</span>
                </label>
                <a href="#" className="login-forgot">비밀번호찾기</a>
              </div>
              <button
                type="button"
                className="login-btn login-btn--primary"
                disabled={!email.trim() || !password.trim()}
                onClick={() => {
                  let hasError = false;
                  if (!email.trim()) {
                    setEmailError("이메일이 올바르지 않습니다");
                    hasError = true;
                  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    setEmailError("이메일이 올바르지 않습니다");
                    hasError = true;
                  } else {
                    setEmailError("");
                  }
                  if (!password.trim()) {
                    setPasswordError("비밀번호가 올바르지 않습니다.");
                    hasError = true;
                  } else {
                    setPasswordError("");
                  }
                  if (!hasError) {
                    setEmailError("");
                    setPasswordError("");
                    // TODO: 실제 로그인 API 호출
                    router.replace("/onboarding");
                  }
                }}
              >
                로그인
              </button>
              <Link href="/signup" className="login-btn login-btn--secondary">
                회원가입
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
