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
