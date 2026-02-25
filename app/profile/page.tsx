"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { clearTokens, isGuest } from "@/lib/auth";

export default function ProfilePage() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showDeleteCurrentPassword, setShowDeleteCurrentPassword] =
    useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCurrentPassword, setDeleteCurrentPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [provider, setProvider] = useState<string | null>(null);
  const isOAuth = provider !== null && provider !== "EMAIL";

  const redirectToLogin = () => {
    if (typeof window === "undefined") return;
    const webBase =
      process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";
    window.location.href = `${webBase}/login`;
  };

  useEffect(() => {
    if (isGuest()) {
      window.location.href = "/chat";
      return;
    }

    apiFetch("/api/users/me")
      .then(async (res) => {
        if (!res.ok) return;

        const json = await res.json();
        const data = json.data;
        if (data?.nickname) setNickname(data.nickname);
        if (data?.email) setEmail(data.email);

        const prov =
          data?.provider ||
          data?.loginType ||
          data?.socialType ||
          data?.authProvider ||
          "EMAIL";
        setProvider(String(prov).toUpperCase());
      })
      .catch(() => setProvider("EMAIL"));
  }, []);

  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,16}$/;

  const handleSave = async () => {
    setSaveMsg("");
    setPasswordError("");

    if (!currentPassword.trim()) {
      setPasswordError("현재 비밀번호를 입력해주세요.");
      return;
    }
    if (!password && !passwordConfirm) {
      setPasswordError("변경할 비밀번호를 입력해주세요.");
      return;
    }
    if (!passwordRegex.test(password)) {
      setPasswordError("영문, 숫자, 특수문자 포함 8~16자로 입력해주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiFetch("/api/auth/password/change", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword,
          newPassword: password,
        }),
      });

      if (!res.ok) {
        const err = await res
          .json()
          .catch(async () => ({ message: await res.text().catch(() => "") }));
        throw new Error(err?.message || "비밀번호 변경에 실패했습니다.");
      }

      setSaveMsg("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
      clearTokens();
      redirectToLogin();
      return;
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      setSaveMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    redirectToLogin();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await apiFetch("/api/auth/withdraw", {
        method: "DELETE",
      });

      if (res.ok) {
        clearTokens();
        redirectToLogin();
        return;
      }

      const err = await res
        .json()
        .catch(async () => ({ message: await res.text().catch(() => "") }));
      const message = String(
        err?.message || err?.error || err?.detail || "회원탈퇴에 실패했습니다."
      ).trim();
      alert(message);
    } catch {
      alert("서버와 연결할 수 없습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const EyeOpen = (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeClosed = (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  return (
    <>
      <div className="profile-bg" role="presentation" />

      <a
        href="/chat"
        className="profile-back"
        onClick={(e) => {
          e.preventDefault();
          window.location.href = "/chat";
        }}
      >
        &lt; 뒤로가기
      </a>

      <div className="profile-character" role="presentation">
        <img
          src="/image/login-character.png"
          alt=""
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      </div>

      <main className="profile-main">
        <div className="profile-panel">
          <div className="profile-avatar">
            <img
              src="/image/user-icon.png"
              alt="프로필"
              className="profile-avatar-img"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>

          <div className="profile-field">
            <label className="profile-label profile-label--readonly">닉네임</label>
            <input
              type="text"
              className="profile-input profile-input--readonly"
              value={nickname}
              readOnly
            />
          </div>

          <div className="profile-field">
            <label className="profile-label profile-label--readonly">이메일</label>
            <input
              type="email"
              className="profile-input profile-input--readonly"
              value={email}
              readOnly
            />
          </div>

          {isOAuth ? (
            <div className="profile-oauth-notice">
              <span className="profile-oauth-badge">{provider}</span>
              소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.
            </div>
          ) : (
            <>
              <div className="profile-field">
                <label className="profile-label">현재 비밀번호</label>
                <div className="profile-input-pw-wrap">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className="profile-input"
                    placeholder="현재 비밀번호를 입력해주세요"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                  />
                  <button
                    type="button"
                    className="profile-pw-toggle"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    aria-label={
                      showCurrentPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                    }
                  >
                    {showCurrentPassword ? EyeOpen : EyeClosed}
                  </button>
                </div>
              </div>

              <div className="profile-field">
                <label className="profile-label">변경할 비밀번호</label>
                <div className="profile-input-pw-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="profile-input"
                    placeholder="영문, 숫자, 특수문자 포함 8~16자"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                  />
                  <button
                    type="button"
                    className="profile-pw-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPassword ? EyeOpen : EyeClosed}
                  </button>
                </div>
              </div>

              <div className="profile-field">
                <label className="profile-label">비밀번호 확인</label>
                <div className="profile-input-pw-wrap">
                  <input
                    type={showPasswordConfirm ? "text" : "password"}
                    className="profile-input"
                    placeholder="비밀번호를 한 번 더 입력해주세요"
                    value={passwordConfirm}
                    onChange={(e) => {
                      setPasswordConfirm(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                  />
                  <button
                    type="button"
                    className="profile-pw-toggle"
                    onClick={() => setShowPasswordConfirm((v) => !v)}
                    aria-label={
                      showPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"
                    }
                  >
                    {showPasswordConfirm ? EyeOpen : EyeClosed}
                  </button>
                </div>
                {passwordError && <p className="profile-error">{passwordError}</p>}
              </div>

              <button
                type="button"
                className="profile-btn profile-btn--save"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>

              {saveMsg && <p className="profile-save-msg">{saveMsg}</p>}
            </>
          )}

          <button
            type="button"
            className="profile-btn profile-btn--logout"
            onClick={handleLogout}
            style={{ marginTop: isOAuth ? "1.5rem" : undefined }}
          >
            로그아웃
          </button>
          <button
            type="button"
            className="profile-btn profile-btn--delete"
            onClick={() => setShowDeleteConfirm(true)}
          >
            회원탈퇴
          </button>

          {showDeleteConfirm && (
            <div
              className="profile-modal-overlay"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                <p className="profile-modal-text">
                  정말 탈퇴하시겠습니까?
                  <br />
                  모든 데이터가 삭제됩니다.
                </p>

                {!isOAuth ? (
                  <div className="profile-input-pw-wrap profile-modal-input-wrap">
                    <input
                      type={showDeleteCurrentPassword ? "text" : "password"}
                      className="profile-input profile-modal-input"
                      placeholder="현재 비밀번호 입력"
                      value={deleteCurrentPassword}
                      onChange={(e) => setDeleteCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="profile-pw-toggle"
                      onClick={() => setShowDeleteCurrentPassword((v) => !v)}
                      aria-label={
                        showDeleteCurrentPassword
                          ? "비밀번호 숨기기"
                          : "비밀번호 보기"
                      }
                    >
                      {showDeleteCurrentPassword ? EyeOpen : EyeClosed}
                    </button>
                  </div>
                ) : (
                  <p className="profile-modal-hint">
                    소셜 로그인 계정은 비밀번호 입력 없이 탈퇴됩니다.
                  </p>
                )}

                <div className="profile-modal-btns">
                  <button
                    type="button"
                    className="profile-modal-btn profile-modal-btn--cancel"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="profile-modal-btn profile-modal-btn--confirm"
                    disabled={isDeleting}
                    onClick={handleDeleteAccount}
                  >
                    {isDeleting ? "처리 중..." : "탈퇴"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
