"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { requestMagicLinkEmail } from "@/lib/api";

const CODE_LENGTH = 6;
/** 비밀번호: 영문 소문자, 숫자 포함 8~16자 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*\d)[a-z\d]{8,16}$/;
function isValidPassword(value: string) {
  return PASSWORD_REGEX.test(value);
}
const TIMER_START = 5 * 60; // 5분
const RESEND_COOLDOWN = 60; // 재전송 60초 쿨다운

/** 실제 이메일 형식: user@naver.com, user@gmail.com 등 (@ 뒤 도메인.xxx) */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmailFormat(value: string) {
  return EMAIL_REGEX.test(value.trim());
}
/** @가 있는데 전체가 이메일 형식이 아니면 true */
function hasEmailFormatError(value: string) {
  const trimmed = value.trim();
  if (!trimmed.includes("@")) return false;
  return !isValidEmailFormat(trimmed);
}

/** 다음 버튼 클릭 시 허용 도메인 (naver, gmail 등) */
const ALLOWED_EMAIL_DOMAINS = [
  "naver.com",
  "naver.co.kr",
  "naver.kr",
  "gmail.com",
  "google.com",
  "daum.net",
  "hanmail.net",
  "kakao.com",
  "nate.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
];
function isAllowedEmailDomain(email: string): boolean {
  const part = email.trim().split("@")[1];
  if (!part) return false;
  const domain = part.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith("." + d));
}

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 2: 코드 입력
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [timer, setTimer] = useState(TIMER_START);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: 비밀번호 설정
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // 타이머 (코드 유효 시간)
  useEffect(() => {
    if (step !== 2 || timer <= 0) return;
    const t = setInterval(() => setTimer((s) => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [step, timer]);

  // 재전송 쿨다운
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(
      () => setResendCooldown((c) => (c <= 0 ? 0 : c - 1)),
      1000
    );
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("이메일을 입력해주세요");
      return;
    }
    if (hasEmailFormatError(email)) {
      setError("이메일이 올바르지 않습니다");
      return;
    }
    if (!isAllowedEmailDomain(email)) {
      setError("naver.com, gmail.com 등 지원하는 이메일 주소로 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      await requestMagicLinkEmail(email.trim());
      setStep(2);
      setTimer(TIMER_START);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "메일 발송에 실패했습니다.";
      // 메일 발송 미설정 시에도 다음 단계(인증코드 화면)로 진행 (테스트용)
      if (msg.includes("메일 발송 설정이 없습니다")) {
        setStep(2);
        setTimer(TIMER_START);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < CODE_LENGTH - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    // TODO: 백엔드 재전송 API
    setResendMessage("코드가 재전송 되었습니다");
    setResendCooldown(RESEND_COOLDOWN);
    setTimer(TIMER_START);
  };

  const handleComplete = () => {
    const fullCode = code.join("");
    if (fullCode.length !== CODE_LENGTH) return;
    // TODO: 백엔드 코드 검증 API 호출 가능. 일단 step 3으로 이동
    setStep(3);
  };

  const isCodeFilled = code.every((c) => c !== "");

  const isPasswordValid = isValidPassword(newPassword);
  const isConfirmMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  // 비밀번호가 유효하고, 두 비밀번호가 일치하며, 에러가 없을 때 활성화
  const canSubmitPassword = 
    newPassword.length > 0 && 
    confirmPassword.length > 0 && 
    isPasswordValid && 
    isConfirmMatch;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setConfirmError("");
    if (!isValidPassword(newPassword)) {
      setPasswordError("영문 소문자, 숫자 포함 8~16자로 입력해주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError("비밀번호가 일치하지 않습니다");
      return;
    }
    setSubmitLoading(true);
    try {
      // TODO: 백엔드 비밀번호 재설정 API (token 또는 email + newPassword)
      await new Promise((r) => setTimeout(r, 300));
      router.replace("/login?view=email");
    } catch {
      setConfirmError("비밀번호 변경에 실패했습니다.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <div className="login-bg" role="presentation" />

      <Link
        href={step === 1 ? "/login?view=email" : "#"}
        className="login-back"
        aria-label={step === 1 ? "이메일 로그인 화면으로" : "이전"}
        onClick={(e) => {
          if (step === 2) {
            e.preventDefault();
            setStep(1);
            setResendMessage("");
          }
          if (step === 3) {
            e.preventDefault();
            setStep(2);
            setPasswordError("");
            setConfirmError("");
          }
        }}
      >
        ← 뒤로가기
      </Link>

      <div className="login-character" role="presentation">
        <img
          src="/image/login-character.png"
          alt=""
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      </div>

      <main className="login-main">
        <div className="login-panel login-panel--forgot">
          {step === 1 && (
            <>
              <h1 className="login-forgot-title">비밀번호 재설정</h1>
              <p className="login-forgot-desc">
                &apos;AIQ&apos;에 가입했던 이메일을 입력해주세요
              </p>

              <form className="login-forgot-form" onSubmit={handleEmailSubmit}>
                <div className="login-input-wrap">
                  <label htmlFor="forgot-email" className="login-label">
                    이메일
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    className={`login-input${error ? " login-input--error" : ""}`}
                    placeholder="이메일을 입력하세요"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    onBlur={() => {
                      const v = email.trim();
                      if (!v) {
                        setError("");
                        return;
                      }
                      if (hasEmailFormatError(v)) {
                        setError("이메일이 올바르지 않습니다");
                        return;
                      }
                      if (!isAllowedEmailDomain(v)) {
                        setError("naver.com, gmail.com 등 지원하는 이메일 주소로 입력해주세요.");
                        return;
                      }
                      setError("");
                    }}
                  />
                  {error && (
                    <p className="login-input-error-msg" role="alert">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="login-btn login-btn--primary"
                  disabled={loading || !isValidEmailFormat(email) || !isAllowedEmailDomain(email)}
                >
                  {loading ? "처리 중…" : "다음"}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="login-forgot-title">이메일을 확인하세요</h1>
              <div className="login-forgot-code-head">
                <p className="login-forgot-desc login-forgot-desc--code">
                  이메일에 전송된 코드를 입력하세요
                </p>
                <span className="login-forgot-timer" aria-live="polite">
                  {formatTimer(timer)}
                </span>
              </div>

              <div className="login-forgot-code-inputs">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      codeInputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="login-forgot-code-input"
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    aria-label={`코드 ${i + 1}자리`}
                  />
                ))}
              </div>

              <div className="login-forgot-code-buttons">
                <button
                  type="button"
                  className={`login-btn login-forgot-btn-resend${resendCooldown > 0 ? " login-btn--disabled" : " login-btn--primary"}`}
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                >
                  재전송
                </button>
                <button
                  type="button"
                  className={`login-btn login-forgot-btn-complete${isCodeFilled ? " login-btn--primary" : " login-btn--disabled"}`}
                  onClick={handleComplete}
                  disabled={!isCodeFilled}
                >
                  완료
                </button>
              </div>

              {resendMessage && (
                <p className="login-forgot-resend-msg" role="status">
                  {resendMessage}
                </p>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="login-forgot-title">비밀번호 설정</h1>
              <p className="login-forgot-desc">
                이전에 설정하지 않은 새로운 비밀번호를 입력해 주세요
              </p>

              <form className="login-forgot-form" onSubmit={handlePasswordSubmit}>
                <div className="login-input-wrap signup-input-wrap--password">
                  <label htmlFor="forgot-new-password" className="login-label">
                    비밀번호
                  </label>
                  <div className="login-password-inner">
                    <input
                      id="forgot-new-password"
                      type={showNewPassword ? "text" : "password"}
                      className={`login-input${passwordError ? " login-input--error" : ""}`}
                      placeholder="영문 소문자, 숫자 포함 8~16자"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewPassword(value);
                        // 비밀번호 에러 클리어
                        if (passwordError) setPasswordError("");
                        // 비밀번호 확인과 일치 여부 확인
                        if (confirmPassword) {
                          if (value !== confirmPassword) {
                            setConfirmError("비밀번호가 일치하지 않습니다");
                          } else {
                            setConfirmError("");
                          }
                        }
                      }}
                      onBlur={() => {
                        if (newPassword && !isValidPassword(newPassword)) {
                          setPasswordError("영문 소문자, 숫자 포함 8~16자로 입력해주세요.");
                        } else {
                          setPasswordError("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() => setShowNewPassword((v) => !v)}
                      aria-label={showNewPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                    >
                      {showNewPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="login-input-error-msg" role="alert">{passwordError}</p>
                  )}
                </div>

                <div className="login-input-wrap signup-input-wrap--password">
                  <label htmlFor="forgot-confirm-password" className="login-label">
                    비밀번호 확인
                  </label>
                  <div className="login-password-inner">
                    <input
                      id="forgot-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      className={`login-input${confirmError ? " login-input--error" : ""}`}
                      placeholder="비밀번호를 한 번 더 입력하세요"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmError(
                          e.target.value && newPassword !== e.target.value
                            ? "비밀번호가 일치하지 않습니다"
                            : ""
                        );
                      }}
                      onBlur={() => {
                        if (confirmPassword && newPassword !== confirmPassword) {
                          setConfirmError("비밀번호가 일치하지 않습니다");
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                    >
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {confirmError && (
                    <p className="login-input-error-msg" role="alert">{confirmError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className={`login-btn signup-submit-btn${canSubmitPassword ? " login-btn--primary" : " login-btn--disabled"}`}
                  disabled={!canSubmitPassword || submitLoading}
                >
                  {submitLoading ? "처리 중…" : "로그인 하러 가기"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </>
  );
}
