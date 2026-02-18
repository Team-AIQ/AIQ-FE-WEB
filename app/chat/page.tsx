"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserNickname , getUserId, getAccessToken, isGuest, clearTokens} from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import HelpModal from "@/components/HelpModal";

// @ts-ignore
import { EventSourcePolyfill } from "event-source-polyfill";
interface AiRecommendation {
  modelName: string;
  targetAudience: string;
  selectionReasons: string[];
}

interface AiResponse {
  recommendations: AiRecommendation[];
  specGuide: string;
  finalWord: string;
}

// 최종 리포트 구조
interface TopProduct {
  rank: number;
  productName: string;
  productImage: string;
  specs: Record<string, string>;
  lowestPriceLink: string;
  comparativeAnalysis: string;
}

interface FinalReport {
  consensus: string;
  decisionBranches: string;
  topProducts: TopProduct[];
  finalWord: string;
}
// --- 타입 정의 ---
interface Question {
  user_answer: string | null;
  attribute_key: string;
  display_label: string;
  question_text: string;
  options: string[];
}

interface CurationResponse {
  queryId: number;
  categoryName: string;
  questions: Question[];
  message: string;
}

interface HistoryItem {
  queryId: number;
  question: string;
  createdAt: string;
}

interface Message {
  id: number; // 중복 방지를 위해 난수 포함 권장 (아래 generateId 사용)
  text: string;
  isUser: boolean;
  variant?: "default" | "sectorQuestion";
  progressLabel?: string;
  options?: string[]; // 옵션 버튼이 필요할 경우를 위해 유지

  reportData?: FinalReport; // 리포트 데이터
  aiResponses?: Record<string, AiResponse>;
}

export default function ChatPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);

  // 리포트 상태 관리
  const [reportPhase, setReportPhase] = useState<"idle" | "generating" | "report">("idle");

  // 데이터 관리 상태
  const [curationData, setCurationData] = useState<CurationResponse | null>(null);
  const [userNickname, setUserNickname] = useState<string>("사용자");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [aiToggles, setAiToggles] = useState({ chatgpt: true, gemini: true, perplexity: true });
  const aiTogglesRef = useRef(aiToggles);
  const [isGuestUser, setIsGuestUser] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);

  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

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


  useEffect(() => {
    aiTogglesRef.current = aiToggles;
  }, [aiToggles]);

  useEffect(() => {
    const nickname = getUserNickname();
    if (nickname) {
      setUserNickname(nickname);
    }
    setIsGuestUser(isGuest());
    // 로그인 사용자면 히스토리 목록 불러오기
    if (!isGuest()) {
      fetchHistory();
    }
  }, []);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await apiFetch("/api/v1/curation/history");
      if (res.ok) {
        const json = await res.json();
        setHistoryList(json.data || []);
      }
    } catch (e) {
      console.error("히스토리 조회 실패:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadHistoryReport = async (queryId: number) => {
    try {
      setActiveHistoryId(queryId);
      setMenuOpen(false);

      const res = await apiFetch(`/api/v1/curation/history/${queryId}/report`);
      if (!res.ok) throw new Error("보고서 조회 실패");
      const json = await res.json();
      const report: FinalReport = json.data;

      // sessionStorage에 저장 후 /report로 이동
      sessionStorage.setItem("finalReport", JSON.stringify(report));
      if (json.data.aiResponses) {
        sessionStorage.setItem("aiResponses", JSON.stringify(json.data.aiResponses));
      }
      router.push(`/report?queryId=${queryId}`);
    } catch (e) {
      console.error("보고서 조회 실패:", e);
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        text: "보고서를 불러오는데 실패했습니다.",
        isUser: false,
      }]);
    }
  };

  // 유저 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".chat-user-box-wrap")) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showUserMenu]);
  const generateId = () => Date.now() + Math.random();

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (reportPhase !== "idle") return; // 리포트 생성 중/완료 시 입력 차단

    // 1. 사용자 메시지 화면에 추가
    const userMessage: Message = {
      id: generateId(),
      text: trimmed,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setShowWelcome(false);

    // 2. 큐레이션 데이터가 없으면 -> '시작(Start)' 단계
    if (!curationData) {
      await startCuration(trimmed);
    }
    // 3. 데이터가 있으면 -> '답변(Answer)' 단계
    else {
      await proceedCuration(trimmed);
    }
  };

  const startCuration = async (content: string) => {
    // 로딩 메시지 표시 (선택 사항)
    // const loadingId = generateId();
    // setMessages(prev => [...prev, { id: loadingId, text: "분석 중...", isUser: false }]);

    try {
      const currentUserId = getUserId();
      if (!currentUserId) {
        console.error("사용자 ID를 찾을 수 없습니다.");
        setMessages(prev => [...prev, { id: generateId(), text: "로그인 정보가 올바르지 않습니다.", isUser: false }]);
        return;
      }
      const response = await apiFetch("/api/v1/curation/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUserId, // DTO: Long userId
          question: content      // DTO: String question
        }),
      });

      if (response.ok) {
        const res = await response.json();
        const data: CurationResponse = res.data;
        setCurationData(data); // 데이터 저장

        // 0.2초 뒤 안내 메시지
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              text: data.message || "정밀한 결과를 제공하기 위해 몇 가지 질문을 할게!",
              isUser: false,
            },
          ]);
        }, 200);

        // 첫 번째 질문 찾아서 표시
        const firstQIdx = data.questions.findIndex(q => q.user_answer === null);
        if (firstQIdx !== -1) {
          showQuestion(data.questions[firstQIdx], firstQIdx, data.questions.length);
        }
      } else {
        setMessages(prev => [...prev, { id: generateId(), text: "오류가 발생했습니다. 다시 시도해주세요.", isUser: false }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: generateId(), text: "서버 연결에 실패했습니다.", isUser: false }]);
    }
  };

  // [Logic] 답변 처리 및 다음 단계 진행
  const proceedCuration = async (answerText: string) => {
    if (!curationData) return;

    // 현재 답변해야 할 질문 찾기
    const currentQIdx = curationData.questions.findIndex(q => q.user_answer === null);
    if (currentQIdx === -1) return; // 이미 완료됨

    // 로컬 데이터 업데이트
    const updatedQuestions = [...curationData.questions];
    updatedQuestions[currentQIdx].user_answer = answerText;

    const updatedData = { ...curationData, questions: updatedQuestions };
    setCurationData(updatedData);

    // 다음 질문 확인
    const nextQIdx = updatedQuestions.findIndex(q => q.user_answer === null);

    if (nextQIdx !== -1) {
      // 다음 질문이 남았으면 표시
      showQuestion(updatedQuestions[nextQIdx], nextQIdx, updatedQuestions.length);
    } else {
      // 모든 질문 완료 -> 제출
      await submitAnswers(updatedData);
    }
  };

  // [UI Helper] 질문 메시지 생성
  const showQuestion = (question: Question, index: number, total: number) => {
    // 자연스러운 대화를 위한 딜레이 (안내 메시지 후 0.4초 뒤 등)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          text: question.question_text, // 예: "주로 어디에서 작업해?"
          isUser: false,
          variant: "sectorQuestion",
          progressLabel: `${index + 1}/${total}`, // 예: "1/4"
          options: question.options, // 필요 시 버튼 렌더링에 사용 가능
        },
      ]);
    }, 600);
  };

  // [API] 최종 제출 및 리포트 생성
  // [API] 최종 제출 및 SSE 스트림 연결
  const submitAnswers = async (data: CurationResponse) => {
    // 1. 리포트 생성 중 메시지 표시
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          text: "리포트를 생성하고 있습니다...",
          isUser: false,
        },
      ]);
      setReportPhase("generating");
    }, 200);

    try {
      // 2. 답변 제출
      const payload = {
        queryId: data.queryId,
        answers: data.questions.map(q => ({
          display_label: q.display_label,
          user_answer: q.user_answer || ""
        }))
      };

      const submitRes = await apiFetch("/api/v1/curation/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!submitRes.ok) {
        throw new Error("답변 제출 실패");
      }

      // 3. [핵심] 답변 제출 성공 후 SSE 스트림 연결 시작!
      // 여기서 백엔드의 @GetMapping("/stream/{queryId}") API를 호출하게 됩니다.
      startSseStream(data.queryId);

    } catch (error) {
      console.error(error);
      setReportPhase("idle");
      setMessages(prev => [...prev, { id: generateId(), text: "오류가 발생했습니다.", isUser: false }]);
    }
  };
  // [SSE] 스트림 처리 함수
    const startSseStream = (queryId: number) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const url = `${baseUrl}/api/v1/aiq/stream/${queryId}`;

        const token = getAccessToken();
        if (!token) {
            console.error("토큰이 없습니다. SSE 연결 불가");
            return;
        }

        console.log("SSE 연결 시도:", url);

        const EventSourcePolyfill = require("event-source-polyfill").EventSourcePolyfill;
        const eventSource = new EventSourcePolyfill(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            heartbeatTimeout: 1200000,
            withCredentials: true,
        });

        eventSourceRef.current = eventSource as unknown as EventSource;

        let aiResults: Record<string, AiResponse> = {};
        let isFinished = false;

        // --- 공통 데이터 처리 로직 ---
        const processData = (rawData: string) => {
            try {
                const parsed = JSON.parse(rawData);

                // 1. 개별 AI 추천 결과인 경우 (GPT_ANSWER, Gemini_ANSWER 등)
                if (parsed.recommendations) {
                    const modelName = parsed.modelName || `Model-${Object.keys(aiResults).length + 1}`;
                    aiResults[modelName] = parsed;
                    console.log(`[${modelName}] 분석 완료`);
                }

                // 2. 최종 리포트인 경우 (FINAL_REPORT)
                if (parsed.consensus && parsed.topProducts) {
                  console.log("최종 리포트 수신 완료");

                  // 사용자 선택 요약
                  const requirements = curationData?.questions
                    .map(q => q.user_answer)
                    .filter(Boolean)
                    .join(", ") || "사용자 선택 옵션";

                  // 세션에 데이터 저장
                  sessionStorage.setItem("finalReport", JSON.stringify(parsed));
                  sessionStorage.setItem("aiResponses", JSON.stringify(aiResults));
                  sessionStorage.setItem("userRequirements", requirements);

                  // report 페이지로 이동
                  router.push(`/report?queryId=${queryId}`);
                }
            } catch (e) {
                console.error("데이터 파싱 에러", e);
            }
        };

        // --- 이벤트 리스너 등록 ---

        // 백엔드에서 보낸 각 AI 모델의 답변 수신 (토글이 꺼진 모델은 무시)
        eventSource.addEventListener("GPT_ANSWER", (e: any) => {
            if (aiTogglesRef.current.chatgpt) processData(e.data);
        });
        eventSource.addEventListener("Gemini_ANSWER", (e: any) => {
            if (aiTogglesRef.current.gemini) processData(e.data);
        });
        eventSource.addEventListener("Perplexity_ANSWER", (e: any) => {
            if (aiTogglesRef.current.perplexity) processData(e.data);
        });

        // 백엔드에서 보낸 최종 리포트 수신
        eventSource.addEventListener("FINAL_REPORT", (e: any) => processData(e.data));

        // 백엔드에서 보낸 종료 신호
        eventSource.addEventListener("finish", () => {
            console.log("🏁 백엔드로부터 종료 신호를 받았습니다.");
            isFinished = true;
            eventSource.close();
            setReportPhase("report");
        });

        eventSource.onopen = () => {
            console.log("SSE 연결 성공");
        };

        // [중요] 백엔드에서 이벤트 이름을 지정(name)하면 onmessage는 작동하지 않습니다.
        // 위에서 addEventListener로 모두 처리했으므로 onmessage는 비워두거나 제거해도 됩니다.
        eventSource.onmessage = (event: MessageEvent) => {
            console.log("일반 메시지 수신:", event.data);
        };

        eventSource.onerror = (err: any) => {
            if (isFinished || eventSource.readyState === 2) {
                return; // 정상 종료 상태라면 에러 로그를 남기지 않음
            }

            console.error("🔴 SSE 에러 발생:", err);
            eventSource.close();
        };
    };

  // 컴포넌트 언마운트 시 연결 종료
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // 현재 세션의 사용자 질문만 추출 (첫 번째 사용자 메시지 = 제품 질문)
  const userQueries = messages.filter(m => m.isUser);
  const firstQuery = userQueries.length > 0 ? userQueries[0] : null;

  return (
      <>
        <div className="login-bg chat-page-bg" role="presentation" />

        {/* 사이드바 오버레이 */}
        {menuOpen && (
            <button
                type="button"
                className="chat-sidebar-overlay"
                aria-label="메뉴 닫기"
                onClick={() => setMenuOpen(false)}
            />
        )}

        {/* 사이드바 */}
        <aside
            className={`chat-sidebar ${menuOpen ? "chat-sidebar--open" : ""}`}
            aria-hidden={!menuOpen}
        >
          <div className="chat-sidebar-inner">
            {/* 상단: 도움말 + 닫기 */}
            <div className="chat-sidebar-header">
              <button
                  type="button"
                  className="chat-sidebar-help-btn"
                  onClick={() => { setIsHelpOpen(true); setMenuOpen(false); }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="7" />
                  <path d="M6 6a2 2 0 1 1 2.5 1.94V9" strokeLinecap="round" />
                  <circle cx="8" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
                </svg>
                도움말
              </button>
              <button
                  type="button"
                  className="chat-sidebar-close"
                  aria-label="메뉴 닫기"
                  onClick={() => setMenuOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
            </div>

            {/* 크레딧 영역 */}
            <div className="chat-sidebar-credit">
              <span className="chat-sidebar-credit-badge">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#3FDD90" strokeWidth="1.5" />
                  <text x="8" y="11" textAnchor="middle" fill="#3FDD90" fontSize="9" fontWeight="bold">C</text>
                </svg>
                20 크레딧
              </span>
              <button type="button" className="chat-sidebar-credit-ad">
                광고보기(1)
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="12" height="8" rx="1" />
                  <polygon points="7,7 7,11 10,9" fill="currentColor" stroke="none" />
                </svg>
              </button>
            </div>

            {/* 채팅 기록 */}
            <div className="chat-sidebar-history">
              <h3 className="chat-sidebar-history-title">채팅</h3>

              {historyLoading ? (
                  <p className="chat-sidebar-history-empty">불러오는 중...</p>
              ) : historyList.length > 0 ? (
                  <div className="chat-sidebar-history-group">
                    {historyList.map((item) => (
                        <button
                            key={item.queryId}
                            type="button"
                            className={`chat-sidebar-history-item${activeHistoryId === item.queryId ? " chat-sidebar-history-item--active" : ""}`}
                            onClick={() => loadHistoryReport(item.queryId)}
                        >
                          {item.question}
                        </button>
                    ))}
                  </div>
              ) : firstQuery ? (
                  <div className="chat-sidebar-history-group">
                    <button
                        type="button"
                        className="chat-sidebar-history-item chat-sidebar-history-item--active"
                    >
                      {firstQuery.text}
                    </button>
                  </div>
              ) : (
                  <p className="chat-sidebar-history-empty">아직 대화 기록이 없습니다</p>
              )}
            </div>

            {/* AI 토글 */}
            <div className="chat-sidebar-ai-toggles">
              {(["chatgpt", "gemini", "perplexity"] as const).map((key) => (
                  <label key={key} className="chat-sidebar-ai-toggle">
                    <span className="chat-sidebar-ai-name">
                      {key === "chatgpt" ? "Chat gpt" : key === "gemini" ? "Gemini" : "Perplexity"}
                    </span>
                    <span
                        className={`chat-sidebar-toggle-switch${aiToggles[key] ? " chat-sidebar-toggle-switch--on" : ""}`}
                        role="switch"
                        aria-checked={aiToggles[key]}
                        onClick={() => setAiToggles(prev => ({ ...prev, [key]: !prev[key] }))}
                    >
                      <span className="chat-sidebar-toggle-knob" />
                    </span>
                  </label>
              ))}
            </div>
          </div>
        </aside>

        {/* 도움말 모달 */}
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

        <div className="chat-page-layout">
          <header className="chat-header">
            {!isGuestUser && (
              <button
                  type="button"
                  className="chat-menu-btn"
                  aria-label="메뉴"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(true)}
              >
                <img src="/image/chat-menu-icon.png" alt="" className="chat-menu-icon-img" aria-hidden />
              </button>
            )}
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
            <div className="chat-user-box-wrap">
              <button
                  type="button"
                  className="chat-user-box onboarding-user-box"
                  onClick={() => setShowUserMenu(prev => !prev)}
              >
                <img src="/image/user-icon.png" alt="" className="onboarding-user-icon" aria-hidden />
                <span className="onboarding-user-name">{userNickname}</span>
              </button>
              {showUserMenu && (
                  <div className="chat-user-dropdown">
                    <button
                        type="button"
                        className="chat-user-dropdown-item"
                        onClick={() => {
                          clearTokens();
                          window.location.href = "/login";
                        }}
                    >
                      로그아웃
                    </button>
                  </div>
              )}
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
                                        <span className="chat-sector-question">
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
                                {/* 옵션 버튼: 말풍선 바깥 아래에 표시 */}
                                {msg.variant === "sectorQuestion" && msg.options && msg.options.length > 0 && (
                                    <div className="chat-option-buttons">
                                      {msg.options.map((option, optIdx) => (
                                          <button
                                              key={optIdx}
                                              type="button"
                                              className="chat-option-btn"
                                              onClick={() => {
                                                if (reportPhase !== "idle") return;
                                                setInputValue(option);
                                                const userMsg: Message = {
                                                  id: generateId(),
                                                  text: option,
                                                  isUser: true,
                                                };
                                                setMessages((prev) => [...prev, userMsg]);
                                                setShowWelcome(false);
                                                proceedCuration(option);
                                                setInputValue("");
                                              }}
                                          >
                                            {option}
                                          </button>
                                      ))}
                                    </div>
                                )}
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

                  {/* 리포트는 /report 페이지로 이동하여 표시 */}
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
                  disabled={reportPhase !== "idle"}
                  aria-label="메시지 입력"
              />
              <button
                  type="button"
                  className="chat-send-btn"
                  aria-label="보내기"
                  onClick={handleSend}
                  disabled={reportPhase !== "idle"}
              >
                <img src="/image/chat-send-icon.png" alt="" className="chat-send-icon" aria-hidden />
              </button>
            </div>
          </main>
        </div>
      </>
  );
}