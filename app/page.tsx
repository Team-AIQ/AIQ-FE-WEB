"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ServiceIntroModal from "@/components/ServiceIntroModal";
import TermsModal from "@/components/TermsModal";
import PrivacyModal from "@/components/PrivacyModal";
import HelpModal from "@/components/HelpModal";
import { isAuthenticated, clearTokens } from "@/lib/auth";
import { useRouter } from "next/navigation";

const TYPEWRITER_TEXT =
  "만나서 반가워! 나는 AIQ 행성에서 온 피클이야\n너의 장바구니 속 고민을 나에게 말해줘";
const TYPEWRITER_SPEED = 100;
const TYPEWRITER_START_DELAY = 700;

function useTypewriter(fullText: string, startDelay: number) {
  const [displayText, setDisplayText] = useState<React.ReactNode[]>([]);
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
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
    timeoutRef.current = setTimeout(
      () => runTypewriter(startIndex + 1),
      TYPEWRITER_SPEED,
    );
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
  onNotIntersecting?: () => void,
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
      { threshold, rootMargin: "0px" },
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
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const router = useRouter(); // 3. router 인스턴스 생성
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 4. 로그인 상태 추가

  // 마우스를 따라 별빛 파티클이 흩날리는 효과 (hero 1단에서만)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const heroEl = heroRef.current;
    if (!canvas || !heroEl) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let mouseX = -100;
    let mouseY = -100;
    let lastSpawn = 0;
    let inHero = true;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      decay: number;
      color: string;
    }
    const particles: Particle[] = [];

    const colors = [
      "rgba(63, 221, 144,", // mint
      "rgba(255, 255, 255,", // white
      "rgba(69, 211, 142,", // teal
      "rgba(150, 255, 200,", // light mint
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // hero 영역 안에 있는지 확인
      const rect = heroEl.getBoundingClientRect();
      inHero = e.clientY >= rect.top && e.clientY <= rect.bottom;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // 스크롤 시에도 hero 영역 체크
    const handleScroll = () => {
      const rect = heroEl.getBoundingClientRect();
      inHero = rect.bottom > 0 && rect.top < window.innerHeight;
      if (!inHero) {
        canvas.style.opacity = "0";
      } else {
        canvas.style.opacity = "1";
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const spawnParticles = (now: number) => {
      if (!inHero || now - lastSpawn < 30) return;
      lastSpawn = now;
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.5;
        particles.push({
          x: mouseX + (Math.random() - 0.5) * 20,
          y: mouseY + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 0.8,
          size: Math.random() * 2.5 + 1,
          alpha: Math.random() * 0.6 + 0.4,
          decay: Math.random() * 0.015 + 0.008,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const animate = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (mouseX > 0) spawnParticles(now);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.size *= 0.98;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color + p.alpha + ")";
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color + "0.5)";

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = p.color + p.alpha * 0.5 + ")";
        ctx.lineWidth = p.size * 0.3;
        ctx.beginPath();
        ctx.moveTo(p.x - p.size * 2, p.y);
        ctx.lineTo(p.x + p.size * 2, p.y);
        ctx.moveTo(p.x, p.y - p.size * 2);
        ctx.lineTo(p.x, p.y + p.size * 2);
        ctx.stroke();

        ctx.restore();
      }

      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const { displayText, showCursor, restart } = useTypewriter(
    TYPEWRITER_TEXT,
    TYPEWRITER_START_DELAY,
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
  const scrollToSection =
    (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          btn.classList.add("is-visible");
        } else {
          // about 섹션이 뷰포트 아래에 있을 때만 숨김 (위로 지나간 경우는 유지)
          const rect = entry.boundingClientRect;
          if (rect.top > 0) {
            btn.classList.remove("is-visible");
          }
        }
      },
      { threshold: 0 },
    );

    // about(2단)부터 footer까지 모두 감시 → 2단 이후 어디든 보이면 버튼 표시
    observer.observe(about);

    return () => {
      observer.disconnect();
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
    },
  );

  useIntersectionObserver(
    aboutRef,
    0.1,
    () => {
      if (hasLeftAboutRef.current) {
        aboutRef.current?.classList.remove("in-view");
        requestAnimationFrame(() => {
          requestAnimationFrame(() =>
            aboutRef.current?.classList.add("in-view"),
          );
        });
        hasLeftAboutRef.current = false;
      }
    },
    () => {
      hasLeftAboutRef.current = true;
      aboutRef.current?.classList.remove("in-view");
    },
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
    },
  );

  return (
    <>
      <canvas className="mouse-sparkle" ref={canvasRef} aria-hidden="true" />

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
              style={{
                cursor: "pointer",
                background: "none",
                border: "1px solid #fff",
                color: "#fff",
              }}
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
            <Link href={isLoggedIn ? "/chat" : "/login"} className="btn-start">
              <span className="btn-start-text">시작하기</span>
              <span className="btn-start-arrow">&gt;</span>
            </Link>
            <a
              href="#about"
              className="link-learn"
              onClick={scrollToSection("about")}
            >
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
                onError={(e) =>
                  e.currentTarget.parentElement?.classList.add("placeholder")
                }
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
                onError={(e) =>
                  e.currentTarget.parentElement?.classList.add("placeholder")
                }
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
                onError={(e) =>
                  e.currentTarget.parentElement?.classList.add("placeholder")
                }
              />
            </div>
          </article>
          <article className="step-card">
            <span className="step-num">4</span>
            <h3 className="step-title">최적의 제품으로 이동</h3>
            <p className="step-desc">
              분석 결과에 가장 부합하는 제품 링크를
              <br />
              제공하여 쇼핑 여정을 단축합니다
            </p>
            <div className="step-illust step-4">
              <img
                src="/image/step4-illust.png"
                alt=""
                onError={(e) =>
                  e.currentTarget.parentElement?.classList.add("placeholder")
                }
              />
            </div>
          </article>
        </div>

        <a
          href="#app-download"
          className="link-app-down"
          onClick={scrollToSection("app-download")}
        >
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
              onError={(e) =>
                e.currentTarget.parentElement?.classList.add("placeholder")
              }
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
            <p className="app-headline app-headline-accent">
              쇼핑 고민은 이제 AIQ에게 물어보세요
            </p>
            <p className="app-slogan">
              더 이상의 비교는 생략, 확신만 남는 쇼핑
            </p>
            <p className="app-desc">
              지구인을 위한 대화형 AI 쇼핑 어시스턴트, AIQ
            </p>
            <div className="app-buttons">
              <a
                href={
                  process.env.NEXT_PUBLIC_APP_STORE_URL ??
                  "https://www.apple.com/kr/app-store/"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="app-store-link"
                aria-label="App Store에서 다운로드"
              >
                <img
                  src="/image/app-store-btn.png"
                  alt="Download on the App Store"
                />
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
        <a
          href="#footer"
          className="btn-to-footer"
          aria-label="푸터로 이동"
          title="푸터로 이동"
        >
          <span className="chevron-down" aria-hidden="true" />
        </a>
      </section>

      <footer className="footer" id="footer">
        <div className="footer-inner">
          <div className="footer-left">
            <Link href="#" className="footer-logo">
              <img
                src="/image/footer-logo.png"
                alt="AIQ"
                className="footer-logo-img"
              />
            </Link>
            <p className="footer-tagline">
              쇼핑 의사결정을 돕는 대화형 AI 서비스
            </p>
            <div className="footer-contact">
              <p>
                문의메일 :{" "}
                <a href="mailto:theaiq.contact@gmail.com">
                  theaiq.contact@gmail.com
                </a>
              </p>
              <p className="contact-note">
                * 본 메일은 제휴·협업 관련 문의 전용입니다.
              </p>
              <p className="contact-note">
                접수된 제휴/협업 제안은 서비스 방향성과의 적합성을 기준으로 개별
                검토됩니다.
              </p>
              <p className="contact-note">
                담당자가 영업일 기준 (평일 9:00 ~ 18:00) 3일 이내에
                회신드립니다.
              </p>
              <p className="contact-note">
                AIQ는 가치 있는 파트너십을 기다리고 있습니다.
              </p>
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
                      style={{
                        background: "none",
                        border: "none",
                        color: "inherit",
                        cursor: "pointer",
                        padding: 0,
                        font: "inherit",
                      }}
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
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsTermsOpen(true);
                    }}
                  >
                    이용약관
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsPrivacyOpen(true);
                    }}
                  >
                    개인정보처리방침
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsHelpOpen(true);
                    }}
                  >
                    도움말
                  </a>
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
        <svg
          className="btn-top-chevron"
          viewBox="0 0 12 10"
          width={16}
          height={14}
          aria-hidden="true"
        >
          <path
            d="M0 10 L6 0 L12 10"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
          />
        </svg>
      </button>

      <ServiceIntroModal
        isOpen={isServiceIntroOpen}
        onClose={() => setIsServiceIntroOpen(false)}
      />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
