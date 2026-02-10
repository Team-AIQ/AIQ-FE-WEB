"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ServiceIntroModal from "@/components/ServiceIntroModal";
import { isAuthenticated, clearTokens } from "@/lib/auth";
import {useRouter} from "next/navigation";

const TYPEWRITER_TEXT =
  "만나서 반가워! 나는 AIQ 행성에서 온 피클이야\n너의 장바구니 속 고민을 나에게 말해줘";
const TYPEWRITER_SPEED = 100;
const TYPEWRITER_START_DELAY = 700;

function useTypewriter(fullText: string, startDelay: number) {
  const [displayText, setDisplayText] = useState<React.ReactNode[]>([]);
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const charIdRef = useRef(0);

  const runTypewriter = (startIndex: number) => {
    if (startIndex >= fullText.length) {
      setShowCursor(false);
      return;
    }
    const char = fullText[startIndex];
    const charId = charIdRef.current++;
    setDisplayText((prev) => [
      ...prev,
      char === "\n" ? <br key={charId} /> : char,
    ]);
    timeoutRef.current = setTimeout(() => runTypewriter(startIndex + 1), TYPEWRITER_SPEED);
  };

  const restart = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDisplayText([]);
    setShowCursor(true);
    timeoutRef.current = setTimeout(() => runTypewriter(0), TYPEWRITER_SPEED);
  };

  useEffect(() => {
    const t = setTimeout(() => runTypewriter(0), startDelay);
    return () => {
      clearTimeout(t);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fullText]);

  return { displayText, showCursor, restart };
}

function useIntersectionObserver(
  ref: React.RefObject<Element | null>,
  threshold: number,
  onIntersecting: () => void,
  onNotIntersecting?: () => void
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersecting();
          } else if (onNotIntersecting) {
            onNotIntersecting();
          }
        });
      },
      { threshold, rootMargin: "0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold, onIntersecting, onNotIntersecting]);
}

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const appRef = useRef<HTMLElement>(null);
  const topBtnRef = useRef<HTMLButtonElement>(null);
  const hasLeftHeroRef = useRef(false);
  const hasLeftAboutRef = useRef(false);
  const hasLeftAppRef = useRef(false);
  const [isServiceIntroOpen, setIsServiceIntroOpen] = useState(false);

  const router = useRouter(); // 3. router 인스턴스 생성
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 4. 로그인 상태 추가

  const { displayText, showCursor, restart } = useTypewriter(
    TYPEWRITER_TEXT,
    TYPEWRITER_START_DELAY
  );
  useEffect(() => {
    setIsLoggedIn(isAuthenticated());

    // 기존 스크롤 초기화 로직...
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    window.scrollTo(0, 0);
  }, []);

  // 6. 로그아웃 핸들러 추가
  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      clearTokens();
      setIsLoggedIn(false);
      router.push("/"); // 홈으로 이동하여 상태 반영
    }
  };
  const scrollToSection = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToTop = () => {
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    heroRef.current?.classList.remove("hero-play");
    requestAnimationFrame(() => {
      heroRef.current?.classList.add("hero-play");
      restart();
    });
  };

  useEffect(() => {
    // 페이지 로드 시 맨 위로 스크롤 + URL 해시 제거
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    window.scrollTo(0, 0);
    
    const btn = topBtnRef.current;
    const about = aboutRef.current;
    if (!btn || !about) return;

    let rafId: number;
    const updateVisibility = () => {
      rafId = requestAnimationFrame(() => {
        if (!about || !btn) return;
        const rect = about.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          btn.classList.add("is-visible");
        } else {
          btn.classList.remove("is-visible");
        }
      });
    };

    const handler = () => {
      updateVisibility();
    };
    window.addEventListener("scroll", handler, { passive: true });
    updateVisibility();
    return () => {
      window.removeEventListener("scroll", handler);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useIntersectionObserver(
    heroRef,
    0.2,
    () => {
      if (hasLeftHeroRef.current) {
        heroRef.current?.classList.remove("hero-play");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            heroRef.current?.classList.add("hero-play");
            restart();
          });
        });
        hasLeftHeroRef.current = false;
      }
    },
    () => {
      hasLeftHeroRef.current = true;
      heroRef.current?.classList.remove("hero-play");
    }
  );

  useIntersectionObserver(
    aboutRef,
    0.1,
    () => {
      if (hasLeftAboutRef.current) {
        aboutRef.current?.classList.remove("in-view");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => aboutRef.current?.classList.add("in-view"));
        });
        hasLeftAboutRef.current = false;
      }
    },
    () => {
      hasLeftAboutRef.current = true;
      aboutRef.current?.classList.remove("in-view");
    }
  );

  useIntersectionObserver(
    appRef,
    0.1,
    () => {
      if (hasLeftAppRef.current) {
        appRef.current?.classList.remove("in-view");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => appRef.current?.classList.add("in-view"));
        });
        hasLeftAppRef.current = false;
      }
    },
    () => {
      hasLeftAppRef.current = true;
      appRef.current?.classList.remove("in-view");
    }
  );

  return (
    <>
      <section className="hero hero-play" id="hero" ref={heroRef}>
        <div className="hero-bg">
          <div className="stars" />
          <div className="hero-bg-image" role="presentation" />
          <div className="planet planet-bottom" />
          <div className="sun-corner" role="presentation" />
        </div>

        <header className="header">
          <Link href="#" className="logo">
            <img
              src="/image/hero-logo.png"
              alt="AIQ"
              className="logo-img"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <span className="logo-fallback">
              <span className="logo-icon">A</span>
              <span className="logo-text">AIQ</span>
            </span>
          </Link>
          {isLoggedIn ? (
              <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-login"
                  style={{ cursor: 'pointer', background: 'none', border: '1px solid #fff', color: '#fff' }}
              >
                로그아웃
              </button>
          ) : (
              <Link href="/login" className="btn-login">
                로그인
              </Link>
          )}
        </header>

        <div className="hero-main">
          <div className="hero-content">
            <p className="hero-greeting" aria-live="polite">
              <span id="hero-greeting-text">{displayText}</span>
              <span
                className="typewriter-cursor"
                id="hero-greeting-cursor"
                aria-hidden="true"
                style={{ visibility: showCursor ? "visible" : "hidden" }}
              >
                |
              </span>
            </p>
            <div className="hero-mascot">
              <img
                src="/image/hero-character.png"
                alt="AIQ 피클"
                className="mascot-img"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          </div>
          <div className="hero-cta">
            <Link href="/chat" className="btn-start">
              <span className="btn-start-text">시작하기</span>
              <span className="btn-start-arrow">&gt;</span>
            </Link>
            <a href="#about" className="link-learn" onClick={scrollToSection("about")}>
              <span className="chevron-down" />
              AIQ 자세히 보기
            </a>
          </div>
        </div>
      </section>

      <section className="about" id="about" ref={aboutRef}>
        <div className="about-bg">
          <div className="stars" />
          <div className="about-bg-image" role="presentation" />
          <div className="planet planet-top" />
        </div>

        <h2 className="about-label">About</h2>
        <h2 className="about-title">AIQ</h2>
        <p className="about-tagline">지구인을 위한 새로운 쇼핑 판단 기준</p>

        <div className="steps">
          <article className="step-card">
            <span className="step-num">1</span>
            <h3 className="step-title">필요한 제품을 입력</h3>
            <p className="step-desc">
              찾고 있는 제품의 카테고리나 스펙을
              <br />
              입력하면 AIQ가 분석을 시작합니다
            </p>
            <div className="step-illust step-1">
              <img
                src="/image/step1-illust.png"
                alt=""
                onError={(e) => e.currentTarget.parentElement?.classList.add("placeholder")}
              />
            </div>
          </article>
          <article className="step-card">
            <span className="step-num">2</span>
            <h3 className="step-title">기준을 정교하게 가공</h3>
            <p className="step-desc">
              AIQ가 가격, 성능, 용도 등의 질문을
              <br />
              통해 추천 기준을 설정합니다
            </p>
            <div className="step-illust step-2">
              <img
                src="/image/step2-illust.png"
                alt=""
                onError={(e) => e.currentTarget.parentElement?.classList.add("placeholder")}
              />
            </div>
          </article>
          <article className="step-card">
            <span className="step-num">3</span>
            <h3 className="step-title">비교 분석 리포트 제공</h3>
            <p className="step-desc">
              GPT, Gemini, Perplexity의 합의점을
              <br />
              기반으로, 쇼핑 추천 리포트를 발행합니다
            </p>
            <div className="step-illust step-3">
              <img
                src="/image/step3-illust.png"
                alt=""
                onError={(e) => e.currentTarget.parentElement?.classList.add("placeholder")}
              />
            </div>
          </article>
          <article className="step-card">
            <span className="step-num">4</span>
            <h3 className="step-title">최적의 제품으로 이동</h3>
            <p className="step-desc">
              분석 결과에 가장 부합하는 제품 링크를
              <br />
              연결하여 쇼핑의 마지막 단계를 돕습니다
            </p>
            <div className="step-illust step-4">
              <img
                src="/image/step4-illust.png"
                alt=""
                onError={(e) => e.currentTarget.parentElement?.classList.add("placeholder")}
              />
            </div>
          </article>
        </div>

        <a href="#app-download" className="link-app-down" onClick={scrollToSection("app-download")}>
          <span className="chevron-down" />
          APP 다운로드
        </a>
      </section>

      <section className="app-section" id="app-download" ref={appRef}>
        <div className="app-bg">
          <div className="stars" />
        </div>

        <div className="app-inner">
          <div className="app-left">
            <img
              src="/image/app-left.png"
              alt="AIQ 앱 로고·아이콘·화면"
              className="app-left-img"
              onError={(e) => e.currentTarget.parentElement?.classList.add("placeholder")}
            />
          </div>
          <div className="app-copy">
            <img
              src="/image/app-star.png"
              alt=""
              className="app-star app-star--top"
              role="presentation"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <p className="app-headline">지구의 쇼핑이 너무 복잡하다면?</p>
            <p className="app-headline app-headline-accent">쇼핑 고민은 이제 AIQ에게 물어보세요</p>
            <p className="app-slogan">더 이상의 비교는 생략, 확신만 남는 쇼핑</p>
            <p className="app-desc">지구인을 위한 대화형 AI 쇼핑 어시스턴트, AIQ</p>
            <div className="app-buttons">
              <a
                href={process.env.NEXT_PUBLIC_APP_STORE_URL ?? "https://www.apple.com/kr/app-store/"}
                target="_blank"
                rel="noopener noreferrer"
                className="app-store-link"
                aria-label="App Store에서 다운로드"
              >
                <img src="/image/app-store-btn.png" alt="Download on the App Store" />
              </a>
              <a
                href={process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL ?? "https://play.google.com/store/apps"}
                target="_blank"
                rel="noopener noreferrer"
                className="google-play-link"
                aria-label="Google Play에서 다운로드"
              >
                <img src="/image/google-play-btn.png" alt="GET IT ON Google Play" />
              </a>
            </div>
            <img
              src="/image/app-star.png"
              alt=""
              className="app-star app-star--mascot"
              role="presentation"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <div className="app-mascot">
              <img
                src="/image/app-mascot.png"
                alt="AIQ 피클"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          </div>
        </div>
        <a href="#footer" className="btn-to-footer" aria-label="푸터로 이동" title="푸터로 이동">
          <span className="chevron-down" aria-hidden="true" />
        </a>
      </section>

      <footer className="footer" id="footer">
        <div className="footer-inner">
          <div className="footer-left">
            <Link href="#" className="footer-logo">
              <img src="/image/footer-logo.png" alt="AIQ" className="footer-logo-img" />
            </Link>
            <p className="footer-tagline">쇼핑 의사결정을 돕는 대화형 AI 서비스</p>
            <div className="footer-contact">
              <p>
                문의메일 :{" "}
                <a href="mailto:theaiq.contact@gmail.com">theaiq.contact@gmail.com</a>
              </p>
              <p className="contact-note">* 본 메일은 제휴·협업 관련 문의 전용입니다.</p>
              <p className="contact-note">
                접수된 제휴/협업 제안은 서비스 방향성과의 적합성을 기준으로 개별 검토됩니다.
              </p>
              <p className="contact-note">
                담당자가 영업일 기준 (평일 9:00 ~ 18:00) 3일 이내에 회신드립니다.
              </p>
              <p className="contact-note">AIQ는 가치 있는 파트너십을 기다리고 있습니다.</p>
            </div>
            <p className="copyright">© 2026 AIQ. All Rights Reserved.</p>
          </div>
          <nav className="footer-nav">
            <div className="nav-col">
              <h4>서비스</h4>
              <ul>
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsServiceIntroOpen(true);
                    }}
                  >
                    서비스 소개
                  </a>
                </li>
                <li>
                  <Link href="/signup">회원가입</Link>
                </li>
                <li>
                  {isLoggedIn ? (
                      <button
                          onClick={handleLogout}
                          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit' }}
                      >
                        로그아웃
                      </button>
                  ) : (
                      <Link href="/login">로그인</Link>
                  )}
                </li>
              </ul>
            </div>
            <div className="nav-col">
              <h4>정책</h4>
              <ul>
                <li>
                  <a href="#">이용약관</a>
                </li>
                <li>
                  <a href="#">개인정보처리방침</a>
                </li>
                <li>
                  <a href="#">도움말</a>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </footer>

      <button
        type="button"
        className="btn-top"
        id="btn-top"
        ref={topBtnRef}
        aria-label="맨 위로"
        title="맨 위로"
        onClick={scrollToTop}
      >
        <svg className="btn-top-chevron" viewBox="0 0 12 10" width={12} height={10} aria-hidden="true">
          <path d="M0 10 L6 0 L12 10" fill="none" stroke="currentColor" strokeWidth={1} />
        </svg>
      </button>

      <ServiceIntroModal
        isOpen={isServiceIntroOpen}
        onClose={() => setIsServiceIntroOpen(false)}
      />
    </>
  );
}
