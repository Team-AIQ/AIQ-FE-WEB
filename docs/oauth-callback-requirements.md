# OAuth 콜백 요구사항 (백엔드)

소셜 로그인(카카오/구글/네이버) 후 **Whitelabel Error Page(404)** 가 나오는 경우, 백엔드에서 성공 시 **프론트엔드 URL**로 리다이렉트해야 합니다.

## 프론트엔드가 기대하는 주소

OAuth 인증 성공 후 아래 주소로 **리다이렉트**해 주세요.

```
{프론트엔드 도메인}/oauth/callback?accessToken={accessToken}&refreshToken={refreshToken}
```

- **로컬**: `http://localhost:3000/oauth/callback?accessToken=...&refreshToken=...`
- **운영**: 배포된 프론트엔드 기준 URL 사용 (예: `https://your-app.com/oauth/callback?accessToken=...&refreshToken=...`)

쿼리 파라미터 이름은 반드시 `accessToken`, `refreshToken` 이어야 합니다.

## Spring Boot OAuth2 예시

- `redirect_uri` 또는 성공 시 redirect URL을 위 프론트엔드 주소로 설정.
- 토큰을 쿼리 파라미터로 붙여서 리다이렉트 (프론트엔드가 `window.location` 으로 이 URL을 받음).

예: 성공 시

```http
Redirect: http://localhost:3000/oauth/callback?accessToken=eyJ...&refreshToken=eyJ...
```

## 프론트엔드 동작

- `/oauth/callback` 페이지에서 `accessToken`, `refreshToken` 을 읽어 `localStorage`에 저장한 뒤 메인(`/`)으로 이동합니다.
- 토큰이 없으면 `/login` 으로 보냅니다.

백엔드에서 위 형식으로 리다이렉트만 맞춰 주시면 소셜 로그인 후 404 없이 정상 동작합니다.
