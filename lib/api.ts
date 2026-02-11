/**
 * API 클라이언트
 * - 일반 요청: Authorization: Bearer {accessToken}
 * - 401 시: refresh 후 재시도, refresh 실패 시 로그인 페이지로 리다이렉트
 */

import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const REFRESH_URL = `${API_BASE}/api/auth/refresh`;

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(accessToken: string) {
  refreshSubscribers.forEach((cb) => cb(accessToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

async function refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const res = await fetch(REFRESH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization-Refresh": `Bearer ${refreshToken}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    throw new Error(`Refresh failed: ${res.status}`);
  }

  const data = await res.json();
  const accessToken = data.accessToken ?? data.access_token;
  const newRefreshToken = data.refreshToken ?? data.refresh_token;

  if (!accessToken || !newRefreshToken) {
    throw new Error("Invalid refresh response");
  }

  setTokens(accessToken, newRefreshToken);
  return { accessToken, refreshToken: newRefreshToken };
}

export type RequestInitWithRetry = RequestInit & {
  _retry?: boolean;
};

/**
 * 401 인터셉터가 적용된 fetch
 * - 요청 시 Authorization: Bearer {accessToken} 자동 추가
 * - 401 발생 시 refresh 후 원래 요청 재시도
 * - refresh도 401이면 토큰 삭제 후 /login 으로 리다이렉트
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInitWithRetry = {}
): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const isAbsolute = url.startsWith("http");
  const fullUrl = isAbsolute ? url : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;

  const doRequest = async (accessToken: string | null, isRetry = false): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(fullUrl, {
      ...init,
      headers,
    });

    if (res.status === 401 && !isRetry) {
      if (isRefreshing) {
        return new Promise<Response>((resolve) => {
          addRefreshSubscriber((newToken) => {
            doRequest(newToken, true).then(resolve);
          });
        });
      }

      isRefreshing = true;
      try {
        const { accessToken: newToken } = await refreshTokens();
        onRefreshed(newToken);
        return doRequest(newToken, true);
      } catch (e) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw e;
      } finally {
        isRefreshing = false;
      }
    }

    return res;
  };

  const accessToken = getAccessToken();
  return doRequest(accessToken);
}

/**
 * GET / POST 등 편의 메서드 (JSON 응답 파싱)
 */
export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * 매직 링크 메일 발송 (POST /api/auth/email/request)
 * @param email 수신 이메일
 * @param purpose "signup" | undefined — signup 시 이메일 인증 링크, 생략 시 비밀번호 재설정
 */
async function requestMagicLink(email: string, origin: string = "web"): Promise<void> {
  let res: Response;
  try {
    // 1. 경로 수정: /email/request -> /email-request
    // 2. 전달 방식 수정: JSON 바디 대신 Query Parameter 사용 (@RequestParam 대응)
    const url = `${API_BASE}/api/auth/email-request?email=${encodeURIComponent(email)}&origin=${origin}`;

    res = await fetch(url, {
      method: "POST", // 백엔드 @PostMapping 확인됨
      headers: {
        // Query Parameter 방식이므로 JSON 헤더는 필요 없지만, 관례상 두어도 무방합니다.
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    throw new Error("서버에 연결할 수 없습니다. 백엔드 주소를 확인해주세요.");
  }

  if (!res.ok) {
    const text = await res.text();
    let msg = "메일 발송에 실패했습니다.";

    // 404 에러 시 주소 확인 안내
    if (res.status === 404) {
      msg = "API 경로를 찾을 수 없습니다. 백엔드 컨트롤러 매핑을 확인하세요.";
    } else {
      try {
        const json = JSON.parse(text);
        msg = json.message || json.error || msg;
      } catch {
        if (text) msg = text;
      }
    }
    throw new Error(msg);
  }
}

/** 비밀번호 재설정용 매직 링크 */
export async function requestMagicLinkEmail(email: string): Promise<void> {
  return requestMagicLink(email);
}

/** 회원가입 이메일 인증용 매직 링크 (메일에서 링크 클릭 시 회원가입 페이지로 리다이렉트) */
export async function requestSignupVerifyEmail(email: string): Promise<void> {
  return requestMagicLink(email, "signup");
}

/**
 * 회원가입 (POST /api/auth/signup) — 이메일 인증 완료 후 호출
 */
export async function signUp(data: { nickname: string; email: string; password: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = "회원가입에 실패했습니다.";
    try {
      const json = JSON.parse(text);
      if (typeof json.message === "string") msg = json.message;
    } catch {
      if (text) msg = text;
    }
    throw new Error(msg);
  }
}

/** report 등에서 사용 (axios 스타일: response.data) */
export const api = {
  get: async (url: string) => {
    const res = await apiFetch(url);
    const data = await res.json().catch(() => ({}));
    return { data };
  },
  post: async (url: string, body?: unknown) => {
    const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
    const res = await apiFetch(fullUrl, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { data };
  },
};
