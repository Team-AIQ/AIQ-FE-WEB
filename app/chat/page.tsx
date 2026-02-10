"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { getUserNickname } from "@/lib/auth";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  variant?: "default" | "sectorQuestion";
  progressLabel?: string;
}

export default function ChatPage() {
  const [inputValue, setInputValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [questionStep, setQuestionStep] = useState(0);
  const [reportPhase, setReportPhase] = useState<"idle" | "generating" | "report">("idle");
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    const el = chatMessagesRef.current;
    if (!el) return;
    const scrollToBottom = () => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    };
    requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
    });
  }, [messages]);

  const [userNickname, setUserNickname] = useState<string>("사용자");

  useEffect(() => {
    const nickname = getUserNickname();
    if (nickname) {
      setUserNickname(nickname);
    }
  }, []);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: Date.now(),
      text: trimmed,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setShowWelcome(false);

    // 첫 번째 사용자 질문에만 소개 + 1/4 질문을 이어서 표시
    const isFirstConversation = questionStep === 0 && messages.length === 0;

    if (isFirstConversation) {
      // 0.2초 뒤 첫 번째 AI 채팅
      setTimeout(() => {
        setMessages((prev) => {
          const now = Date.now();
          const introMessage: Message = {
            id: now,
            text: "정밀한 결과를 제공하기 위해 몇 가지 질문을 할게!",
            isUser: false,
          };
          return [...prev, introMessage];
        });
      }, 200);

      // 그 다음 텀 두고 두 번째 AI 채팅 (1/4 질문)
      setTimeout(() => {
        setMessages((prev) => {
          const now = Date.now();
          const sectorQuestionMessage: Message = {
            id: now,
            text: "주로 어디에서 작업해? (Ex. 카페, 출장지, 사무실)",
            isUser: false,
            variant: "sectorQuestion",
            progressLabel: "1/4",
          };
          return [...prev, sectorQuestionMessage];
        });
        setQuestionStep(1);
      }, 200 + 400);
    }

    // 카테고리 질문: 사용자가 1번씩만 답할 때마다 다음 질문(2/4 → 3/4 → 4/4) 표시
    if (questionStep === 1) {
      setTimeout(() => {
        setMessages((prev) => {
          const sectorQuestionMessage: Message = {
            id: Date.now(),
            text: "어떤 작업을 가장 많이해? (Ex. PPT, 영상 편집, 3D 렌더링, 개발)",
            isUser: false,
            variant: "sectorQuestion",
            progressLabel: "2/4",
          };
          return [...prev, sectorQuestionMessage];
        });
        setQuestionStep(2);
      }, 200);
    }

    if (questionStep === 2) {
      setTimeout(() => {
        setMessages((prev) => {
          const sectorQuestionMessage: Message = {
            id: Date.now(),
            text: "선호하는 운영체제(OS)나 브랜드가 있어? (Ex. Windows, MacOS)",
            isUser: false,
            variant: "sectorQuestion",
            progressLabel: "3/4",
          };
          return [...prev, sectorQuestionMessage];
        });
        setQuestionStep(3);
      }, 200);
    }

    if (questionStep === 3) {
      setTimeout(() => {
        setMessages((prev) => {
          const sectorQuestionMessage: Message = {
            id: Date.now(),
            text: "예산 범위가 어떻게 돼? (Ex. 100만원대, 200만원대)",
            isUser: false,
            variant: "sectorQuestion",
            progressLabel: "4/4",
          };
          return [...prev, sectorQuestionMessage];
        });
        setQuestionStep(4);
      }, 200);
    }

    // 4/4 답변 후 마지막 채팅 → 리포트 생성 플로우
    if (questionStep === 4) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: "리포트를 생성하고 있습니다",
            isUser: false,
          },
        ]);
        setReportPhase("generating");
      }, 200);
      setTimeout(() => {
        setReportPhase("report");
      }, 200 + 2500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <>
      <div className="login-bg chat-page-bg" role="presentation" />

      {/* 사이드바 오버레이: 클릭 시 메뉴 닫기 */}
      {menuOpen && (
        <button
          type="button"
          className="chat-sidebar-overlay"
          aria-label="메뉴 닫기"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* 왼쪽 슬라이드 메뉴바 */}
      <aside
        className={`chat-sidebar ${menuOpen ? "chat-sidebar--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="chat-sidebar-inner">
          <div className="chat-sidebar-header">
            <span className="chat-sidebar-title">메뉴</span>
            <button
              type="button"
              className="chat-sidebar-close"
              aria-label="메뉴 닫기"
              onClick={() => setMenuOpen(false)}
            >
              ×
            </button>
          </div>
          <nav className="chat-sidebar-nav">
            <Link href="/" className="chat-sidebar-link" onClick={() => setMenuOpen(false)}>
              홈
            </Link>
            <Link href="/onboarding" className="chat-sidebar-link" onClick={() => setMenuOpen(false)}>
              온보딩
            </Link>
          </nav>
        </div>
      </aside>

      <div className="chat-page-layout">
      <header className="chat-header">
        <button
          type="button"
          className="chat-menu-btn"
          aria-label="메뉴"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <img src="/image/chat-menu-icon.png" alt="" className="chat-menu-icon-img" aria-hidden />
        </button>
        <Link href="/" className="chat-logo">
          <img
            src="/image/chat-logo.png"
            alt="AIQ"
            className="chat-logo-img"
            onError={(e) => e.currentTarget.parentElement?.classList.add("fallback")}
          />
          <span className="chat-logo-fallback">
            <span className="logo-icon">A</span>
            <span className="logo-text">AIQ</span>
          </span>
        </Link>
        <div className="chat-user-box onboarding-user-box">
          <img src="/image/user-icon.png" alt="" className="onboarding-user-icon" aria-hidden />
          <span className="onboarding-user-name">{userNickname}</span>
        </div>
      </header>

      <main className="chat-main">
        {showWelcome && (
          <div className="chat-main-content">
            <p className="chat-welcome">
              만나서 반가워! 난 피클이야
              <br />
              <span className="chat-welcome-line2">너의 장바구니를 비워줄게 필요한 제품을 말해봐</span>
            </p>
            <div className="chat-character-wrap">
              <div className="chat-character">
                <img
                  src="/image/chat-character-new.png"
                  alt="피클"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
            </div>
            <div className="chat-hint">
              <img src="/image/chat-hint-bubble.png" alt="" className="chat-hint-bubble-img" aria-hidden />
              <span className="chat-hint-text">검색창에 필요한 제품을 입력해줘</span>
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.map((msg, index) => {
              const isFirstInBlock =
                index === 0 || messages[index - 1].isUser !== msg.isUser;
              return (
              <div key={msg.id} className={`chat-message ${msg.isUser ? "chat-message--user" : "chat-message--ai"}`}>
                {msg.isUser ? (
                  <>
                    {isFirstInBlock ? (
                      <div className="chat-message-icon">
                        <img src="/image/user-profile-icon.png" alt="" aria-hidden />
                      </div>
                    ) : (
                      <div className="chat-message-icon chat-message-avatar--hidden" aria-hidden />
                    )}
                    <div className="chat-message-bubble">
                      {msg.text}
                    </div>
                  </>
                ) : (
                  <>
                    {isFirstInBlock ? (
                      <div className="chat-message-avatar">
                        <img src="/image/chat-character.png" alt="AIQ 피클" aria-hidden />
                      </div>
                    ) : (
                      <div className="chat-message-avatar chat-message-avatar--hidden" aria-hidden />
                    )}
                    <div
                      className={`chat-message-bubble chat-message-bubble--ai${
                        msg.variant === "sectorQuestion" ? " chat-message-bubble--sector" : ""
                      }`}
                    >
                      {msg.variant === "sectorQuestion" ? (
                        <>
                          <span
                            className={`chat-sector-question${msg.text.length > 45 ? " chat-sector-question--wrap" : ""}`}
                          >
                            {msg.text}
                          </span>
                          {msg.progressLabel && (
                            <span className="chat-sector-progress" aria-label={`질문 ${msg.progressLabel}`}>
                              {msg.progressLabel}
                            </span>
                          )}
                        </>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </>
                )}
              </div>
            );
            })}
            {/* 리포트 생성 로딩 */}
            {reportPhase === "generating" && (
              <div className="chat-message chat-message--ai">
                <div className="chat-message-avatar chat-message-avatar--hidden" aria-hidden />
                <div className="chat-report-loading">
                  <div className="chat-report-loading-dots" aria-hidden>
                    <span /><span /><span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            {/* 리포트 본문 + 카드 (스크롤 가능) */}
            {reportPhase === "report" && (
              <div className="chat-report-wrap">
                <div className="chat-report-box">
                  <h3 className="chat-report-title">AI 궁금 문의</h3>
                  <p className="chat-report-p">업무용 노트북, 예산 200만원대 전후. 성능·내구성·AS 만족도 우선, 업무 스펙 안정성 필요. RAM 16GB 이상 권장 32GB, SSD 512GB 이상, 최신 i7/Ultra/Ryzen 7급 이상. 비즈니스 라인(ThinkPad, LG Gram, Galaxy Book 등) 선호.</p>
                  <h3 className="chat-report-title">AI 간단 분석</h3>
                  <p className="chat-report-p">최신 트렌드(Gemini) vs 검증된 안정성(GPT, Perplexity). AI PC 확장성(Gemini) vs 현재 실무 표준(GPT). macOS 지원(Gemini) vs Windows 중심(GPT, Perplexity).</p>
                  <h3 className="chat-report-title">최종 추천</h3>
                  <p className="chat-report-p">ThinkPad T14s Gen 6 (RAM 32GB 구성)</p>
                  <a href="https://www.lenovo.com/kr/ko/paptops/thinkpad/thinkpadt/thinkpad-t14s-gen-6" className="chat-report-link" target="_blank" rel="noopener noreferrer">제품 링크</a>
                  <h3 className="chat-report-title">AIQ 추천 이유</h3>
                  <ul className="chat-report-list">
                    <li>업무용 노트북 관련 AI 합의가 가장 넓은 모델</li>
                    <li>성능·내구성·AS 리스크가 가장 낮은 선택</li>
                    <li>최신성보다 장기 안정성을 우선하는 사용자에게 적합</li>
                    <li>실패 가능성이 낮은 대표 옵션</li>
                    <li>휴대성 최우선이면 LG 그램, 최신 AI 기능이면 갤럭시 북 참고</li>
                  </ul>
                </div>
                <div className="chat-report-cards">
                  <div className="chat-report-card">
                    <h4 className="chat-report-card-title">Chat GPT</h4>
                    <p className="chat-report-card-p">ThinkPad T14s Gen 6. 200만원대 T14s 등.</p>
                    <button type="button" className="chat-report-card-btn">전체보기</button>
                  </div>
                  <div className="chat-report-card">
                    <h4 className="chat-report-card-title">Gemini</h4>
                    <p className="chat-report-card-p">삼성전자 갤럭시 북 프로. 최신 AI 기능.</p>
                    <button type="button" className="chat-report-card-btn">전체보기</button>
                  </div>
                  <div className="chat-report-card">
                    <h4 className="chat-report-card-title">Perplexity</h4>
                    <p className="chat-report-card-p">레노버 씽크패드 X1 카본. RAM 16GB, SSD 512GB.</p>
                    <button type="button" className="chat-report-card-btn">전체보기</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="chat-input-wrap">
          <input
            type="text"
            className="chat-input"
            placeholder={reportPhase !== "idle" ? "리포트 결과를 확인해 주세요" : "무엇이든 물어보세요"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            aria-label="메시지 입력"
          />
          <button type="button" className="chat-send-btn" aria-label="보내기" onClick={handleSend}>
            <img src="/image/chat-send-icon.png" alt="" className="chat-send-icon" aria-hidden />
          </button>
        </div>
      </main>
      </div>
    </>
  );
}
