/**
 * 토큰 저장소 (localStorage)
 * 보안이 우려되면 쿠키(HttpOnly 등)로 교체 가능
 */
import { jwtDecode } from "jwt-decode";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

interface TokenPayload {
  userId: number;
  nickname: string; // 백엔드에서 넣은 키 값
  auth: string;     // 권한 (ROLE_USER 등)
  sub: string;      // 이메일 (백엔드 setSubject)
  exp: number;
}

export function getUserNickname(): string | null {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.nickname || null;
  } catch (error) {
    console.error("토큰 디코딩 실패:", error);
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
