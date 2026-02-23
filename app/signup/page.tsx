"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { requestSignupVerifyEmail, signUp } from "@/lib/api";
import PrivacyModal from "@/components/PrivacyModal";

export default function SignupPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingMail, setSendingMail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // 메일에서 인증 링크 클릭 후 리다이렉트: ?verified=1&email=xxx
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (params.get("verified") === "1" && params.get("email")) {
      const verifiedEmail = params.get("email") ?? "";
      setEmail(verifiedEmail);
      setEmailVerified(true);
      setEmailChecked(true);
      setEmailError("");
      // URL 정리 (히스토리에서 query 제거)
      window.history.replaceState({}, "", "/signup");
    }
  }, []);

  const handleEmailDuplicateCheck = async () => {
    if (!email.trim()) {
      setEmailError("이메일을 입력해주세요");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("이메일이 올바르지 않습니다");
      return;
    }
    setEmailError("");
    setSendingMail(true);
    try {
      await requestSignupVerifyEmail(email.trim());
      setEmailChecked(true);
      setEmailVerified(false);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "인증 메일 발송에 실패했습니다.");
    } finally {
      setSendingMail(false);
    }
  };

  const validatePassword = (pwd: string) => {
    // 영문 소문자, 숫자, 특수문자 $#! 포함 8~16자
    const regex = /^(?=.*[a-z])(?=.*\d)(?=.*[$#!])[a-z\d$#!]{8,16}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!nickname.trim()) {
      hasError = true;
    }
    if (!email.trim()) {
      setEmailError("이메일을 입력해주세요");
      hasError = true;
    } else if (!emailVerified) {
      setEmailError(emailChecked ? "메일에서 인증 링크를 클릭해주세요." : "이메일 중복확인을 해주세요");
      hasError = true;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("비밀번호를 입력해주세요");
      hasError = true;
    } else if (!validatePassword(password)) {
      setPasswordError("영문 소문자, 숫자, 특수문자 $#! 포함 8~16자로 입력해주세요");
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("비밀번호가 올바르지 않습니다");
      hasError = true;
    } else {
      setConfirmPasswordError("");
    }

    if (!agreeTerms) {
      hasError = true;
    }

    if (!hasError) {
      setSubmitting(true);
      try {
        await signUp({ nickname: nickname.trim(), email: email.trim(), password });
        setShowSuccess(true);
        setTimeout(() => {
          router.replace("/login?view=email");
        }, 2000);
      } catch (err) {
        setEmailError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <>
      <div className="login-bg" role="presentation" />

      {showSuccess && (
        <div className="signup-success-toast" role="alert">
          회원가입이 완료되었습니다
        </div>
      )}

      <Link href="/login" className="login-back" aria-label="로그인 화면으로 돌아가기">
        ← 뒤로가기
      </Link>

      <div className="login-character" role="presentation">
        <img src="/image/login-character.png" alt="" onError={(e) => (e.currentTarget.style.display = "none")} />
      </div>

      <main className="login-main">
        <div className="login-panel">
          <div className="signup-content">
            <h1 className="signup-title">회원가입</h1>

            <form className="signup-form" onSubmit={handleSubmit} noValidate>
            <div className="signup-input-wrap">
              <label htmlFor="signup-nickname" className="signup-label">
                닉네임
              </label>
              <input
                id="signup-nickname"
                type="text"
                className="login-input"
                placeholder="최초 1회 설정 후 변경 불가"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div className="signup-input-wrap">
              <label htmlFor="signup-email" className="signup-label">
                이메일
              </label>
              <div className="signup-email-row">
                <input
                  id="signup-email"
                  type="email"
                  className={`login-input${emailError ? " login-input--error" : ""}`}
                  placeholder="ex. aiq@email.com"
                  autoComplete="email"
                  value={email}
                  readOnly={emailVerified}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                    setEmailChecked(false);
                    setEmailVerified(false);
                  }}
                />
                <button
                    type="button"
                    className={`signup-dup-btn ${emailVerified ? 'signup-dup-btn--verified' : ''}`}
                    onClick={handleEmailDuplicateCheck}
                    disabled={sendingMail || emailVerified} // 💡 인증 완료 시 중복확인 재발송 차단
                >
                  {sendingMail ? "발송 중…" : emailVerified ? "인증완료" : "중복확인"}
                </button>
              </div>
              {emailChecked && !emailError && (
                <p className="signup-hint">
                  {emailVerified ? "이메일 인증이 완료되었습니다." : "메일에서 인증을 눌러주세요"}
                </p>
              )}
              {emailError && <p className="login-input-error-msg" role="alert">{emailError}</p>}
            </div>

            <div className="signup-input-wrap signup-input-wrap--password">
              <label htmlFor="signup-password" className="signup-label">
                비밀번호
              </label>
              <div className="signup-password-inner">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  className={`login-input${passwordError ? " login-input--error" : ""}`}
                  placeholder="영문 소문자, 숫자, 특수문자 $#! 포함 8~16자"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPassword(val);
                    if (val && !validatePassword(val)) {
                      setPasswordError("영문 소문자, 숫자, 특수문자 $#! 포함 8~16자로 입력해주세요");
                    } else {
                      setPasswordError("");
                    }
                    if (confirmPassword && val !== confirmPassword) {
                      setConfirmPasswordError("비밀번호가 올바르지 않습니다");
                    } else if (confirmPasswordError) {
                      setConfirmPasswordError("");
                    }
                  }}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
              </div>
              {passwordError && <p className="login-input-error-msg" role="alert">{passwordError}</p>}
            </div>

            <div className="signup-input-wrap signup-input-wrap--password">
              <label htmlFor="signup-confirm-password" className="signup-label">
                비밀번호 확인
              </label>
              <div className="signup-password-inner">
                <input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className={`login-input${confirmPasswordError ? " login-input--error" : ""}`}
                placeholder="비밀번호를 한 번 더 입력하세요"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  const val = e.target.value;
                  setConfirmPassword(val);
                  setConfirmPasswordError(val && password !== val ? "비밀번호가 올바르지 않습니다" : "");
                }}
                onBlur={() => {
                  if (confirmPassword && password !== confirmPassword) {
                    setConfirmPasswordError("비밀번호가 올바르지 않습니다");
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
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
              </div>
              {confirmPasswordError && <p className="login-input-error-msg" role="alert">{confirmPasswordError}</p>}
            </div>

            <label className="signup-terms-wrap" onClick={(e) => {
              if (!agreeTerms) {
                e.preventDefault();
                setIsPrivacyOpen(true);
              }
            }}>
              <input
                type="checkbox"
                className="login-check"
                checked={agreeTerms}
                onChange={(e) => {
                  if (agreeTerms) {
                    setAgreeTerms(false);
                  }
                }}
              />
              <span className="signup-terms-text">개인정보 이용 동의</span>
              <a
                href="#"
                className="signup-terms-link"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsPrivacyOpen(true);
                }}
              >
                보기
              </a>
            </label>

            <button
              type="submit"
              className="login-btn login-btn--primary signup-submit-btn"
              disabled={!nickname.trim() || !email.trim() || !password || !validatePassword(password) || !confirmPassword || !agreeTerms || !emailVerified || !!emailError || !!confirmPasswordError || submitting}
            >
              {submitting ? "가입 중…" : "회원가입"}
            </button>
          </form>
          </div>
        </div>
      </main>

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onAgree={() => setAgreeTerms(true)}
      />
    </>
  );
}
