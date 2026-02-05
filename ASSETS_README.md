# AIQ 랜딩 페이지 이미지 파일명 안내

아래 **폴더/파일명**으로 이미지를 넣어두시면 페이지에서 자동으로 사용됩니다.

---

## 1단: 진입 화면 (Hero)

| 용도 | 폴더 | 파일명 | 비고 |
|------|------|--------|------|
| **좌측 상단 로고** | `image/` | `hero-logo.png` | 아이콘 + AIQ 텍스트, 투명 배경 권장 |
| **중앙 캐릭터** | `image/` | `hero-character.png` | 피클 마스코트(우주복/고글), 투명 배경 권장 |
| **배경 이미지** | `image/` | `hero-bg.png` | 투명도 넣은 버전. 별은 CSS로 유지되어 겹쳐서 보임 |
| **오른쪽 상단 해** | `image/` | `hero-sun.png` | 우주 배경용 해/태양 이미지 |
*로그인 버튼·행성은 CSS로 구현*

---

## 로그인 페이지 (`login.html`)

| 용도 | 폴더 | 파일명 | 비고 |
|------|------|--------|------|
| **배경 이미지** | `image/` | `login-bg.png` | 우주/별 배경, 전체 화면 |
| **캐릭터** | `image/` | `login-character.png` | 좌측 하단 피클 마스코트, 투명 배경 권장 |
| **로고** | `image/` | `login-logo.png` | AIQ 로고 (패널 상단) |
| **카카오 로그인 버튼** | `image/` | `login-btn-kakao.png` | 카카오로 계속하기 (노란 배경) |
| **Google 로그인 버튼** | `image/` | `login-btn-google.png` | Google로 계속하기 (흰 배경) |
| **네이버 로그인 버튼** | `image/` | `login-btn-naver.png` | 네이버로 계속하기 (초록 배경) |

- 소셜 버튼은 **이미지로 넣어주시면** `<a>` 링크로 감싸 두었으므로, `login.html`의 `#btn-kakao`, `#btn-google`, `#btn-naver`의 `href`를 각 OAuth URL로 바꾸면 **클릭 시 해당 소셜 로그인 페이지로 이동**합니다. (백엔드에서 발급한 URL 사용)

---

## 2단: About AIQ (4단계 카드)

| 용도 | 폴더 | 파일명 | 비고 |
|------|------|--------|------|
| **배경 이미지** | `image/` | `about-bg.png` | 우주/지구 배경, 2단 전체 |
| **1번 이미지** | `image/` | `step1-illust.png` | 필요한 제품을 입력 (키보드/검색) |
| **2번 이미지** | `image/` | `step2-illust.png` | 기준을 정교하게 가공 (₩/기어/장바구니) |
| **3번 이미지** | `image/` | `step3-illust.png` | 비교 분석 리포트 (GPT/Gemini/Perplexity) |
| **4번 이미지** | `image/` | `step4-illust.png` | 최적의 제품으로 이동 (BUY NOW) |

---

## 3단: 앱 소개 + 다운로드

| 용도 | 파일명 | 비고 |
|------|--------|------|
| **장식 별** (텍스트 위 · 캐릭터 왼쪽) | `app-star.png` | 같은 이미지, CSS로 방향만 조정 |
| iPhone 목업 1 (웰컴/온보딩 화면) | `phone-mockup-1.png` | 왼쪽 기기 |
| iPhone 목업 2 (AIQ 로고 화면) | `phone-mockup-2.png` | 가운데 기기 |
| iPhone 목업 3 (채팅 화면) | `phone-mockup-3.png` | 오른쪽 기기 |
| 피클 썸업 (엄지 척) | `mascot-thumbs.png` | 우측 하단 마스코트 |

---

## 4단: 푸터

푸터는 텍스트·로고만 사용하므로 **추가 이미지 없음**.  
(로고는 CSS + 텍스트로 표시)

---

## 요약 – 복사용 경로 목록

```
image/hero-logo.png
image/hero-character.png
image/hero-bg.png
image/hero-sun.png
image/about-bg.png
image/step1-illust.png
image/step2-illust.png
image/step3-illust.png
image/step4-illust.png
image/app-star.png
image/phone-mockup-1.png
image/phone-mockup-2.png
image/phone-mockup-3.png
image/mascot-thumbs.png
```

이미지가 없어도 레이아웃은 유지되며, 해당 위치는 플레이스홀더(점선 박스/원)로 표시됩니다.
