"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { getUserNickname , getUserId, getAccessToken} from "@/lib/auth";
import { apiFetch } from "@/lib/api"; // API 유틸리티 임포트

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
  const [inputValue, setInputValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);

  // 리포트 상태 관리
  const [reportPhase, setReportPhase] = useState<"idle" | "generating" | "report">("idle");

  // 데이터 관리 상태
  const [curationData, setCurationData] = useState<CurationResponse | null>(null);
  const [userNickname, setUserNickname] = useState<string>("사용자");

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
    const nickname = getUserNickname();
    if (nickname) {
      setUserNickname(nickname);
    }
  }, []);
  const generateId = () => Date.now() + Math.random();

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

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
    // 주의: Next.js 개발 환경(proxy)이나 배포 환경에 따라 URL 조정 필요
    // apiFetch는 fetch wrapper이므로 여기선 EventSource를 직접 써야 함
    // 토큰이 필요하다면 url에 쿼리 파라미터로 넣거나(보안 주의), 쿠키 기반이어야 함.
    // 여기서는 로컬 개발 환경 가정: http://localhost:8080/api/v1/aiq/stream/...
    // .env 설정에 따라 주소 변경 필요.
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const url = `${baseUrl}/api/v1/aiq/stream/${queryId}`;

    const token = getAccessToken();
    if (!token) {
      console.error("토큰이 없습니다. SSE 연결 불가");
      return;
    }

    console.log("SSE 연결 시도:", url);

    // 2. EventSourcePolyfill을 사용하여 헤더에 토큰 추가
    const EventSourcePolyfill = require("event-source-polyfill").EventSourcePolyfill;
    const eventSource = new EventSourcePolyfill(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      heartbeatTimeout: 1200000,
      withCredentials: true,// (선택) 타임아웃 설정
    });

    // eventSourceRef.current = eventSource; // 타입 에러가 날 수 있으니 아래처럼 캐스팅하거나 any로 처리
    eventSourceRef.current = eventSource as unknown as EventSource;

    let aiResults: Record<string, AiResponse> = {};
    let isFinished = false;

    eventSource.onopen = () => {
      console.log("SSE 연결 성공");
    };

    // 기본 메시지 수신 (백엔드에서 send(object) 할 때)
    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data);
        console.log("SSE 수신:", parsed);

        // 데이터 타입에 따라 분기 처리 (백엔드가 어떤 키로 구분하는지에 따라 수정 필요)
        // 예시: { type: 'GPT', data: ... } 또는 데이터 구조 자체로 판별

        // 1. 개별 AI 응답인 경우 (GPT, Gemini, Perplexity)
        // 백엔드에서 모델명을 구분해 줄 필드가 필요함.
        // 만약 없다면 순서대로 혹은 구조로 추측해야 함.
        // 여기서는 임의로 'recommendations' 키가 있으면 AI 응답으로 간주
        if (parsed.recommendations) {
          // 어떤 모델인지 알 수 있는 식별자가 필요 (예: parsed.modelName 또는 type)
          // 식별자가 없다면 UI에 그냥 'AI 분석 결과'로 표시하거나,
          // 백엔드에 model 필드 추가 요청 필요.
          // 임시로 '모델명'을 추출하거나 랜덤 할당 (실제론 백엔드 수정 권장)
          const modelName = parsed.modelName || `Model-${Object.keys(aiResults).length + 1}`;
          aiResults[modelName] = parsed;
          console.log(`[${modelName}] 분석 완료`);

          // 진행 상황 업데이트 (옵션)
          // setMessages(prev => [...prev, {id: generateId(), text: `${modelName} 분석 완료`, isUser: false}]);
        }

        // 2. 최종 리포트인 경우
        if (parsed.consensus && parsed.topProducts) {
          const finalReport: FinalReport = parsed;

          // SSE 종료
          console.log("최종 리포트 수신 완료");
          isFinished = true;
          eventSource.close();
          setReportPhase("report");

          // 최종 메시지에 리포트 데이터 통째로 저장 -> UI에서 렌더링
          setMessages(prev => [
            ...prev,
            {
              id: generateId(),
              text: "분석이 완료되었습니다!", // 텍스트는 UI에서 안 보일 수도 있음 (reportPhase로 대체)
              isUser: false,
              reportData: finalReport,
              aiResponses: aiResults // 모아둔 개별 결과도 같이 저장
            }
          ]);
        }

      } catch (e) {
        console.error("JSON 파싱 에러", e);
      }
    };

    eventSource.onerror = (err: any) => {

      if (isFinished) {
        eventSource.close();
        return;
      }
      // 2. [중요] readyState가 2 (CLOSED)라면, 서버가 연결을 끊은 것이므로 정상 종료로 간주
      const targetState = err?.target?.readyState;
      if (eventSource.readyState === 2 || targetState === 2) {
        console.log("✅ 서버가 연결을 종료했습니다. (정상 종료)");
        eventSource.close();
        return;
      }
      console.error("🔴 SSE 에러 발생 객체:", err);

      // Polyfill은 에러 객체에 status나 statusText를 담아주는 경우가 많습니다.
      if (err.status) {
        console.error(`🔴 HTTP 상태 코드: ${err.status}`);
      }
      if (err.statusText) {
        console.error(`🔴 상태 메시지: ${err.statusText}`);
      }

      // 만약 토큰 문제라면(401), 로그아웃 처리를 하거나 알림을 줄 수 있습니다.
      if (err.status === 401) {
        alert("인증이 만료되었습니다. 다시 로그인해주세요.");
      }

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
                                        {/* 동적 progressLabel 표시 */}
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

                  {/* 리포트 본문 (현재는 하드코딩된 예시, 추후 백엔드 데이터로 교체 필요) */}
                  {reportPhase === "report" && messages.length > 0 && (
                      (() => {
                        // 1. 마지막 메시지에서 저장된 리포트 데이터 추출
                        const lastMsg = messages[messages.length - 1];
                        const report = lastMsg.reportData;

                        // 2. 사용자가 선택한 답변들 요약 (curationData 활용)
                        const userRequirements = curationData?.questions
                            .map(q => q.user_answer)
                            .filter(Boolean)
                            .join(", ") || "사용자 선택 옵션";

                        // 데이터가 없으면 렌더링 하지 않음 (방어 코드)
                        if (!report) return null;

                        return (
                            <div className="chat-report-wrap">
                              <div className="chat-report-box">

                                {/* A. 문의 요약 */}
                                <h3 className="chat-report-title">AI 궁금 문의</h3>
                                <p className="chat-report-p">
                                  {userRequirements}
                                </p>

                                {/* B. AI 분석 내용 */}
                                <h3 className="chat-report-title">AI 간단 분석</h3>
                                <p className="chat-report-p">
                                  {report.consensus}
                                </p>
                                {/* 의사결정 분기 내용이 있다면 추가 표시 */}
                                {report.decisionBranches && (
                                    <p className="chat-report-p" style={{ marginTop: '10px', fontSize: '0.95em', color: '#555' }}>
                                      {report.decisionBranches}
                                    </p>
                                )}

                                {/* C. 최종 추천 (랭킹 1위 제품) */}
                                <h3 className="chat-report-title">최종 추천</h3>
                                {report.topProducts && report.topProducts.length > 0 && (
                                    <>
                                      <p className="chat-report-p font-bold text-lg">
                                        {report.topProducts[0].productName}
                                      </p>
                                      {/* 스펙 간단 노출 */}
                                      <div style={{ margin: '8px 0', fontSize: '0.9em', color: '#666' }}>
                                        {report.topProducts[0].specs && Object.entries(report.topProducts[0].specs)
                                            .map(([k, v]) => `${k}: ${v}`)
                                            .join(" / ")}
                                      </div>
                                      <a
                                          href={report.topProducts[0].lowestPriceLink || "#"}
                                          className="chat-report-link"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                      >
                                        최저가 보러가기
                                      </a>
                                    </>
                                )}

                                {/* D. 추천 이유 */}
                                <h3 className="chat-report-title">AIQ 추천 이유</h3>
                                <p className="chat-report-p">
                                  {report.finalWord}
                                </p>
                              </div>

                              {/* E. 제품 카드 리스트 (Top Products) */}
                              <div className="chat-report-cards">
                                {report.topProducts?.map((product, idx) => (
                                    <div key={idx} className="chat-report-card">
                                      {/* 랭킹 표시 (선택 사항) */}
                                      <div style={{
                                        position: 'absolute', top: '10px', left: '10px',
                                        background: '#000', color: '#fff', padding: '2px 8px',
                                        borderRadius: '4px', fontSize: '12px'
                                      }}>
                                        {product.rank}위
                                      </div>

                                      {/* 제품 이미지 */}
                                      <div style={{ width: '100%', height: '120px', overflow: 'hidden', borderRadius: '8px', marginBottom: '10px', backgroundColor: '#f0f0f0' }}>
                                        <img
                                            src={product.productImage}
                                            alt={product.productName}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                      </div>

                                      <h4 className="chat-report-card-title">{product.productName}</h4>

                                      {/* 비교 분석 텍스트 (긴 경우 말줄임 처리 필요할 수 있음) */}
                                      <p className="chat-report-card-p" style={{
                                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                      }}>
                                        {product.comparativeAnalysis}
                                      </p>

                                      {/* 스펙 테이블 */}
                                      {product.specs && (
                                          <div className="chat-report-card-specs" style={{ fontSize: '11px', color: '#888', marginTop: '8px', marginBottom: '8px' }}>
                                            {Object.entries(product.specs).slice(0, 3).map(([key, val]) => (
                                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                  <span>{key}</span>
                                                  <span>{val}</span>
                                                </div>
                                            ))}
                                          </div>
                                      )}

                                      <a
                                          href={product.lowestPriceLink || "#"}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ width: '100%', display: 'block' }}
                                      >
                                        <button type="button" className="chat-report-card-btn">전체보기</button>
                                      </a>
                                    </div>
                                ))}
                              </div>
                            </div>
                        );
                      })()
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