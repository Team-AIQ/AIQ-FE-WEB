"use client";

import { useState, useRef, useEffect } from "react";
import { getUserId, getAccessToken, isGuest, clearTokens} from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { initRewardedAd, showRewardedAd } from "@/lib/ad";
import HelpModal from "@/components/HelpModal";

// @ts-ignore
import { EventSourcePolyfill } from "event-source-polyfill";
interface AiRecommendation {
  productName: string;
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
  price?: string;
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
  id: number;
  text: string;
  isUser: boolean;
  variant?: "default" | "sectorQuestion" | "report";
  progressLabel?: string;
  options?: string[];

  reportData?: FinalReport;
  aiResponses?: Record<string, AiResponse>;
}

// 텍스트에 줄바꿈·불릿을 JSX로 변환
function renderFormattedText(text: string) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={i} />;
    // "- " 또는 "• " 로 시작하면 불릿
    if (/^[-•]\s/.test(trimmed)) {
      return <div key={i} style={{ paddingLeft: "1em", textIndent: "-0.7em" }}>{trimmed}</div>;
    }
    return <div key={i}>{trimmed}</div>;
  });
}

const AI_ICONS: Record<string, JSX.Element> = {
  gpt: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#10a37f" />
      <path d="M16 7c-1.8 0-3.4.6-4.7 1.7-.9.8-1.6 1.8-2 2.9-.5-.1-1-.2-1.5-.2C5.7 11.4 4 13.1 4 15.2c0 1.1.5 2.1 1.2 2.8-.1.4-.2.8-.2 1.2 0 2.1 1.7 3.8 3.8 3.8.5 0 1-.1 1.5-.3.4 1.2 1.1 2.2 2 3C13.6 26.4 14.8 27 16 27s2.4-.6 3.7-1.3c.9-.8 1.6-1.8 2-3 .5.2 1 .3 1.5.3 2.1 0 3.8-1.7 3.8-3.8 0-.4-.1-.8-.2-1.2.7-.7 1.2-1.7 1.2-2.8 0-2.1-1.7-3.8-3.8-3.8-.5 0-1 .1-1.5.2-.4-1.1-1.1-2.1-2-2.9C19.4 7.6 17.8 7 16 7z" fill="#fff" opacity="0.9"/>
      <circle cx="16" cy="16" r="3" fill="#10a37f"/>
    </svg>
  ),
  gemini: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#4285f4" />
      <path d="M16 5l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff"/>
      <path d="M23 18l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill="#fff" opacity="0.6"/>
    </svg>
  ),
  perplexity: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#6366f1" />
      <path d="M10 8h5v6h-5zM17 8h5v6h-5zM10 18h5v6h-5zM17 18h5v6h-5z" stroke="#fff" strokeWidth="1.5" fill="none" rx="1"/>
      <line x1="16" y1="8" x2="16" y2="24" stroke="#fff" strokeWidth="1.5"/>
      <line x1="10" y1="16" x2="22" y2="16" stroke="#fff" strokeWidth="1.5"/>
    </svg>
  ),
};

const AI_MODELS = [
  { key: "gpt", label: "Chat GPT", logo: "/image/gpt-logo.png" },
  { key: "gemini", label: "Gemini", logo: "/image/gemini-logo.png" },
  { key: "perplexity", label: "Perplexity", logo: "/image/perp-logo.png" },
];

// 크레딧 소진 비용
const CREDIT_COST = {
  BASIC_QUERY: 3,        // 일반 질문 (단발성 질의 및 기본 분석)
  EXPAND_COMPARE: 10,    // 3개 모델 확장 비교
  CONTINUE_CHAT: 10,     // 이어서 대화하기
} as const;

export default function ChatPage() {
  const [inputValue, setInputValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);

  // 리포트 상태 관리
  const [reportPhase, setReportPhase] = useState<"idle" | "generating" | "report">("idle");
  // 리포트 완료 후 대화 모드: "select" = 완료하기/대화하기 선택, "conversation" = 비교후보/이어서 선택, "freeChat" = 자유 입력
  const [postReportMode, setPostReportMode] = useState<"select" | "conversation" | "freeChat" | null>(null);

  // 리포트 패널: 선택된 AI 키 (전체보기)
  const [selectedAiKey, setSelectedAiKey] = useState<string | null>(null);
  // 제품 추천 표시 개수 (기본 1개, 확장 시 3개)
  const [productDisplayCount, setProductDisplayCount] = useState(1);
  // 이어서 질문하기 모드: 리포트 유지하면서 추가 대화
  const [continueQueryId, setContinueQueryId] = useState<number | null>(null);

  // 데이터 관리 상태
  const [curationData, setCurationData] = useState<CurationResponse | null>(null);
  const [userNickname, setUserNickname] = useState<string>("사용자");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [aiToggles, setAiToggles] = useState({ chatgpt: true, gemini: true, perplexity: true });
  const aiTogglesRef = useRef(aiToggles);
  const [isGuestUser, setIsGuestUser] = useState(true);
  const [userCredit, setUserCredit] = useState<number>(0);
  const [creditFetched, setCreditFetched] = useState(false); // API 성공 여부 (미구현 시 체크 스킵)
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

  const resetToInitial = () => {
    setReportPhase("idle");
    setPostReportMode(null);
    setCurationData(null);
    setMessages([]);
    setShowWelcome(true);
    setInputValue("");
    setSelectedAiKey(null);
    setActiveHistoryId(null);
    setProductDisplayCount(1);
    setContinueQueryId(null);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  useEffect(() => {
    setIsGuestUser(isGuest());
    // 로그인 사용자면 히스토리 목록 불러오기 + 광고 초기화 + 사용자 정보 조회
    if (!isGuest()) {
      fetchHistory();
      fetchUserInfo();
      const userId = getUserId();
      if (userId) initRewardedAd(String(userId));
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

  const fetchUserInfo = async () => {
    try {
      const res = await apiFetch("/api/users/me");
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setUserCredit(data?.currentCredits ?? 0);
        if (data?.nickname) setUserNickname(data.nickname);
        setCreditFetched(true);
      }
    } catch (e) {
      console.error("사용자 정보 조회 실패:", e);
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

      // 히스토리: 사용자 질문 + 통합 보고서만 표시 (AI 개별 답변 없음)
      const historyItem = historyList.find(h => h.queryId === queryId);
      const msgs: Message[] = [];

      if (historyItem) {
        msgs.push({
          id: Date.now() + Math.random(),
          text: historyItem.question,
          isUser: true,
        });
      }

      msgs.push({
        id: Date.now() + Math.random() + 1,
        text: "",
        isUser: false,
        variant: "report",
        reportData: report,
        // 히스토리에서는 aiResponses를 넘기지 않아 AI 카드가 표시되지 않음
      });

      setShowWelcome(false);
      setReportPhase("report");
      setPostReportMode(null);
      setSelectedAiKey(null);
      setMessages(msgs);
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
    if (reportPhase !== "idle") return;

    const userMessage: Message = {
      id: generateId(),
      text: trimmed,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setShowWelcome(false);

    if (!curationData) {
      await startCuration(trimmed);
    } else {
      await proceedCuration(trimmed);
    }
  };

  const startCuration = async (content: string) => {
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
          userId: currentUserId,
          question: content
        }),
      });

      if (response.ok) {
        const res = await response.json();
        const data: CurationResponse = res.data;
        setCurationData(data);

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              text: "정밀한 결과를 제공하기 위해 몇 가지 질문을 할게!\n답변 선택지를 클릭하거나 입력창에 답변을 입력해줘.",
              isUser: false,
            },
          ]);
        }, 200);

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

  const proceedCuration = async (answerText: string) => {
    if (!curationData) return;

    const currentQIdx = curationData.questions.findIndex(q => q.user_answer === null);
    if (currentQIdx === -1) return;

    const updatedQuestions = [...curationData.questions];
    updatedQuestions[currentQIdx].user_answer = answerText;

    const updatedData = { ...curationData, questions: updatedQuestions };
    setCurationData(updatedData);

    const nextQIdx = updatedQuestions.findIndex(q => q.user_answer === null);

    if (nextQIdx !== -1) {
      showQuestion(updatedQuestions[nextQIdx], nextQIdx, updatedQuestions.length);
    } else {
      await submitAnswers(updatedData);
    }
  };

  const showQuestion = (question: Question, index: number, total: number) => {
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          text: question.question_text,
          isUser: false,
          variant: "sectorQuestion",
          progressLabel: `${index + 1}/${total}`,
          options: question.options,
        },
      ]);
    }, 600);
  };

  const submitAnswers = async (data: CurationResponse) => {
    // 크레딧 부족 체크 (API 응답 성공 시에만)
    if (!isGuestUser && creditFetched && userCredit < CREDIT_COST.BASIC_QUERY) {
      setMessages(prev => [...prev, {
        id: generateId(),
        text: `크레딧이 부족합니다. 리포트 생성에 ${CREDIT_COST.BASIC_QUERY}C가 필요합니다. (현재 ${userCredit}C)\n광고를 시청하여 크레딧을 충전해주세요.`,
        isUser: false,
      }]);
      return;
    }

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

    // AI 토글 상태에 따라 models 파라미터 생성
    const toggles = aiTogglesRef.current;
    const modelList: string[] = [];
    if (toggles.chatgpt) modelList.push("GPT");
    if (toggles.gemini) modelList.push("Gemini");
    if (toggles.perplexity) modelList.push("Perplexity");

    const modelsParam = modelList.length > 0 ? `?models=${modelList.join(",")}` : "";
    const url = `${baseUrl}/api/v1/aiq/stream/${queryId}${modelsParam}`;

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

    const processData = (rawData: string) => {
      try {
        const parsed = JSON.parse(rawData);

        // 1. 개별 AI 추천 결과
        if (parsed.recommendations) {
          const modelName = parsed.modelName || `Model-${Object.keys(aiResults).length + 1}`;
          aiResults[modelName] = parsed;
          console.log(`[${modelName}] 분석 완료`);
        }

        // 2. 최종 리포트 → 인라인으로 채팅에 표시
        if (parsed.consensus && parsed.topProducts) {
          console.log("최종 리포트 수신 완료");

          setMessages(prev => [...prev, {
            id: generateId(),
            text: "",
            isUser: false,
            variant: "report",
            reportData: parsed as FinalReport,
            aiResponses: { ...aiResults },
          }]);

          setReportPhase("report");
          setPostReportMode("select");
          // 리포트 생성 후 크레딧 갱신
          fetchUserInfo();
        }
      } catch (e) {
        console.error("데이터 파싱 에러", e);
      }
    };

    // --- 이벤트 리스너 등록 (models 파라미터로 이미 백엔드에서 필터링됨) ---
    eventSource.addEventListener("GPT_ANSWER", (e: any) => {
      processData(e.data);
    });
    eventSource.addEventListener("Gemini_ANSWER", (e: any) => {
      processData(e.data);
    });
    eventSource.addEventListener("Perplexity_ANSWER", (e: any) => {
      processData(e.data);
    });

    eventSource.addEventListener("FINAL_REPORT", (e: any) => processData(e.data));

    eventSource.addEventListener("finish", () => {
      console.log("백엔드로부터 종료 신호를 받았습니다.");
      isFinished = true;
      eventSource.close();
    });

    eventSource.onopen = () => {
      console.log("SSE 연결 성공");
    };

    eventSource.onmessage = (event: MessageEvent) => {
      console.log("일반 메시지 수신:", event.data);
    };

    eventSource.onerror = (err: any) => {
      if (isFinished || eventSource.readyState === 2) {
        return;
      }
      console.error("SSE 에러 발생:", err);
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

  // AI 전체보기 헬퍼
  const findAiData = (aiResponses: Record<string, AiResponse>, key: string) => {
    const entry = Object.entries(aiResponses).find(([k]) =>
      k.toLowerCase().includes(key),
    );
    return entry ? { modelName: entry[0], aiData: entry[1] } : null;
  };


  // 현재 세션의 사용자 질문만 추출
  const userQueries = messages.filter(m => m.isUser);
  const firstQuery = userQueries.length > 0 ? userQueries[0] : null;

  // 히스토리를 Today / Yesterday / 이전 으로 그룹핑
  const groupHistoryByDate = (items: HistoryItem[]) => {
    // 로컬 타임존 기준 날짜 문자열 (YYYY-MM-DD)
    const toLocalDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const now = new Date();
    const todayStr = toLocalDateStr(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateStr(yesterday);

    const groups: { label: string; items: HistoryItem[] }[] = [];
    const today: HistoryItem[] = [];
    const yest: HistoryItem[] = [];
    const earlier: HistoryItem[] = [];

    items.forEach((item) => {
      // createdAt이 ISO 또는 로컬 형식일 수 있으므로 Date로 파싱 후 로컬 날짜 비교
      const itemDate = item.createdAt ? new Date(item.createdAt) : null;
      const dateStr = itemDate ? toLocalDateStr(itemDate) : "";
      if (dateStr === todayStr) today.push(item);
      else if (dateStr === yesterdayStr) yest.push(item);
      else earlier.push(item);
    });

    if (today.length > 0) groups.push({ label: "Today", items: today });
    if (yest.length > 0) groups.push({ label: "Yesterday", items: yest });
    if (earlier.length > 0) groups.push({ label: "이전", items: earlier });

    return groups;
  };

  const historyGroups = groupHistoryByDate(historyList);

  // 이어서 질문하기 (리포트 유지하면서 추가 대화)
  const handleContinueChat = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: generateId(),
      text: trimmed,
      isUser: true,
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");

    // queryId 기반으로 이어서 질문 API 호출
    const qId = continueQueryId || curationData?.queryId;
    if (!qId) {
      setMessages(prev => [...prev, {
        id: generateId(),
        text: "이전 대화 정보를 찾을 수 없습니다. 새로운 질문을 시작해주세요.",
        isUser: false,
      }]);
      return;
    }

    try {
      const res = await apiFetch(`/api/v1/curation/${qId}/continue`, {
        method: "POST",
        body: JSON.stringify({ question: trimmed }),
      });

      if (res.ok) {
        const json = await res.json();
        setMessages(prev => [...prev, {
          id: generateId(),
          text: json.data?.answer || json.message || "답변을 받았습니다.",
          isUser: false,
        }]);
        // 이어서 대화 후 크레딧 갱신
        fetchUserInfo();
      } else {
        setMessages(prev => [...prev, {
          id: generateId(),
          text: "답변을 가져오는데 실패했습니다. 다시 시도해주세요.",
          isUser: false,
        }]);
      }
    } catch (e) {
      console.error("이어서 질문 실패:", e);
      setMessages(prev => [...prev, {
        id: generateId(),
        text: "서버 연결에 실패했습니다.",
        isUser: false,
      }]);
    }
  };

  // ===== 인라인 리포트 렌더링 =====
  const renderReport = (msg: Message) => {
    const report = msg.reportData;
    const aiResp = msg.aiResponses || {};
    if (!report) return null;

    const hasAiResponses = Object.keys(aiResp).length > 0;

    // 현재 선택된 AI의 상세 데이터
    const panelAi = hasAiResponses && selectedAiKey ? findAiData(aiResp, selectedAiKey) : null;
    const panelLabel = selectedAiKey
      ? AI_MODELS.find(m => m.key === selectedAiKey)?.label || ""
      : "";

    return (
      <div className="chat-report-inline">
        {/* ===== 좌상: 합의 ===== */}
        <div className="rpt-cell rpt-cell--consensus">
          <div className="rpt-consensus-box">
            <h3 className="rpt-consensus-title">AI 공통 합의</h3>
            <div className="rpt-consensus-text">{renderFormattedText(report.consensus)}</div>

            {report.decisionBranches && (
              <>
                <h4 className="rpt-consensus-sub">AI 간 판단 분기</h4>
                <div className="rpt-consensus-text">{renderFormattedText(report.decisionBranches)}</div>
              </>
            )}

            {report.finalWord && (
              <>
                <h4 className="rpt-consensus-sub">AIQ 추천 이유</h4>
                <div className="rpt-consensus-text">{renderFormattedText(report.finalWord)}</div>
              </>
            )}
          </div>
        </div>

        {/* ===== 우상: 제품 TOP N ===== */}
        <div className="rpt-cell rpt-cell--products">
          {report.topProducts && report.topProducts.length > 0 && (
            <div className="rpt-products-panel">
              <h3 className="rpt-products-panel-title">
                추천 제품 TOP {Math.min(productDisplayCount, report.topProducts.length)}
              </h3>
              {report.topProducts.slice(0, productDisplayCount).map((product, idx) => (
                <div key={idx} className="rpt-product-card">
                  <div className="rpt-product-header">
                    <span className="rpt-product-rank">{product.rank || idx + 1}위</span>
                    <span className="rpt-product-name">{product.productName}</span>
                    {product.price && <span className="rpt-product-price">{product.price}</span>}
                  </div>
                  {product.productImage && (
                    <div className="rpt-product-image">
                      <img src={product.productImage} alt={product.productName} referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.display = "none")} />
                    </div>
                  )}
                  {product.specs && Object.keys(product.specs).length > 0 && (
                    <div className="rpt-product-specs">
                      {Object.entries(product.specs).slice(0, 4).map(([key, val]) => (
                        <span key={key} className="rpt-product-spec">{key}: {val}</span>
                      ))}
                    </div>
                  )}
                  <div className="rpt-product-analysis">{renderFormattedText(product.comparativeAnalysis)}</div>
                  {product.lowestPriceLink && (
                    <a
                      href={product.lowestPriceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rpt-product-link"
                    >
                      구매하러가기 →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== 좌하: AI 카드 3개 ===== */}
        <div className="rpt-cell rpt-cell--ai-cards">
          {hasAiResponses && (
            <div className="rpt-ai-row">
              {AI_MODELS.map(({ key, label, logo }) => {
                const found = findAiData(aiResp, key);
                return (
                  <div key={key} className={`rpt-ai-card-new ${!found ? "is-off" : ""}${selectedAiKey === key ? " is-selected" : ""}`}>
                    <div className="rpt-ai-card-head">
                      <img src={logo} alt={label} className="rpt-ai-logo" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling?.classList.remove("rpt-ai-icon--hidden"); }} />
                      <span className="rpt-ai-icon rpt-ai-icon--hidden">{AI_ICONS[key]}</span>
                      <span className="rpt-ai-label">{label}</span>
                    </div>

                    {found ? (
                      <div className="rpt-ai-card-body-new">
                        {found.aiData.recommendations?.slice(0, 1).map((rec, i) => (
                          <div key={i} className="rpt-ai-card-item-new">
                            <strong>1. {rec.productName || rec.targetAudience}</strong>
                            <ul className="rpt-ai-card-reasons">
                              {rec.selectionReasons?.map((r, ri) => (
                                <li key={ri}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rpt-ai-card-empty">
                        <div className="rpt-ai-off">OFF</div>
                        <p className="rpt-ai-off-text">
                          {label} ON을<br />켜주세요
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      className="rpt-ai-card-btn-new"
                      onClick={() => setSelectedAiKey(selectedAiKey === key ? null : key)}
                      disabled={!found}
                    >
                      {selectedAiKey === key ? "접기" : "전체보기"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== 우하: AI 전체보기 패널 ===== */}
        <div className="rpt-cell rpt-cell--detail">
          {panelAi ? (
            <div className="rpt-panel-inline">
              <div className="rpt-panel-head">
                <h3 className="rpt-panel-name">
                  {selectedAiKey && (
                    <img
                      src={AI_MODELS.find(m => m.key === selectedAiKey)?.logo}
                      alt={panelLabel}
                      className="rpt-ai-logo"
                    />
                  )}
                  {panelLabel}
                </h3>
                <button
                  type="button"
                  className="rpt-panel-back"
                  onClick={() => setSelectedAiKey(null)}
                >
                  뒤로가기
                </button>
              </div>
              <div className="rpt-panel-scroll">
                {panelAi.aiData.recommendations?.map((rec, recIdx) => (
                  <div key={recIdx} className="rpt-panel-rec">
                    <h4 className="rpt-panel-rec-t">
                      {recIdx + 1}. {rec.productName || rec.targetAudience}
                    </h4>
                    <ul className="rpt-panel-rec-ul">
                      {rec.selectionReasons?.map((reason, rIdx) => (
                        <li key={rIdx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ))}

                {panelAi.aiData.specGuide && (
                  <div className="rpt-panel-sec">
                    <h4 className="rpt-panel-sec-t">구매 스펙 가이드</h4>
                    <div className="rpt-panel-sec-body">{renderFormattedText(panelAi.aiData.specGuide)}</div>
                  </div>
                )}

                {panelAi.aiData.finalWord && (
                  <div className="rpt-panel-sec">
                    <h4 className="rpt-panel-sec-t">종합 의견</h4>
                    <div className="rpt-panel-sec-body">{renderFormattedText(panelAi.aiData.finalWord)}</div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

      </div>
    );
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

            <div className="chat-sidebar-credit">
              <span className="chat-sidebar-credit-badge">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#3FDD90" strokeWidth="1.5" />
                  <text x="8" y="11" textAnchor="middle" fill="#3FDD90" fontSize="9" fontWeight="bold">C</text>
                </svg>
                {userCredit} 크레딧
              </span>
              <button
                type="button"
                className="chat-sidebar-credit-ad"
                onClick={() => {
                  const shown = showRewardedAd(() => {
                    fetchUserInfo();
                    alert("광고 시청 완료! 1 크레딧이 지급되었습니다.");
                  });
                  if (!shown) {
                    alert("광고를 준비 중입니다. 잠시 후 다시 시도해주세요.");
                  }
                }}
              >
                광고보기
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="12" height="8" rx="1" />
                  <polygon points="7,7 7,11 10,9" fill="currentColor" stroke="none" />
                </svg>
              </button>
            </div>

            <div className="chat-sidebar-history">
              <h3 className="chat-sidebar-history-title">채팅</h3>

              {historyLoading ? (
                  <p className="chat-sidebar-history-empty">불러오는 중...</p>
              ) : historyGroups.length > 0 ? (
                  historyGroups.map((group) => (
                    <div key={group.label} className="chat-sidebar-history-group">
                      <span className="chat-sidebar-history-label">{group.label}</span>
                      {group.items.map((item) => (
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
                  ))
              ) : firstQuery ? (
                  <div className="chat-sidebar-history-group">
                    <span className="chat-sidebar-history-label">Today</span>
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

        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

        <div className="chat-page-layout">
          <header className="chat-header">
            {!isGuestUser ? (
              <button
                  type="button"
                  className="chat-menu-btn"
                  aria-label="메뉴"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(true)}
              >
                <img src="/image/chat-menu-icon.png" alt="" className="chat-menu-icon-img" aria-hidden />
              </button>
            ) : (
              <div style={{ width: "2.5rem", flexShrink: 0 }} />
            )}
            <a
              href="/chat"
              className="chat-logo"
              onClick={(e) => {
                e.preventDefault();
                resetToInitial();
              }}
            >
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
            </a>
            <div className="chat-user-box-wrap">
              <button
                  type="button"
                  className="chat-user-box onboarding-user-box"
                  onClick={() => isGuestUser ? setShowUserMenu(prev => !prev) : (window.location.href = "/profile")}
              >
                <img src="/image/user-icon.png" alt="" className="onboarding-user-icon" aria-hidden />
                <span className="onboarding-user-name">{userNickname}</span>
              </button>
              {isGuestUser && showUserMenu && (
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
                <div className={`chat-messages${reportPhase === "report" ? " chat-messages--report" : ""}${reportPhase === "report" && postReportMode === null ? " chat-messages--history" : ""}`} ref={chatMessagesRef}>
                  {messages.map((msg, index) => {
                    // 리포트 메시지는 별도 렌더링
                    if (msg.variant === "report") {
                      return (
                        <div key={msg.id} className="chat-message chat-message--ai chat-message--report">
                          {renderReport(msg)}
                        </div>
                      );
                    }

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
                                      msg.text.includes("\n")
                                        ? renderFormattedText(msg.text)
                                        : msg.text
                                  )}
                                </div>
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
                </div>
            )}

            <div className="chat-bottom-area">
            {reportPhase === "report" && postReportMode === null ? (
              /* 히스토리 리포트: 하단 입력 영역 없음 */
              null
            ) : reportPhase === "report" && postReportMode === "select" ? (
              <div className="chat-bottom-btns">
                <button
                  type="button"
                  className="rpt-bottom-btn rpt-bottom-btn--primary"
                  onClick={resetToInitial}
                >
                  완료하기
                </button>
                <button
                  type="button"
                  className="rpt-bottom-btn rpt-bottom-btn--secondary"
                  onClick={() => {
                    // 현재 리포트의 queryId 저장
                    if (curationData?.queryId) {
                      setContinueQueryId(curationData.queryId);
                    }
                    setMessages(prev => [...prev, {
                      id: generateId(),
                      text: "요청이 필요한 버튼을 선택해줘!",
                      isUser: false,
                    }]);
                    setPostReportMode("conversation");
                  }}
                >
                  대화하기
                </button>
              </div>
            ) : reportPhase === "report" && postReportMode === "conversation" ? (
              <div className="chat-continue-wrap">
                <div className="chat-continue-btns">
                  <button
                    type="button"
                    className="rpt-bottom-btn rpt-bottom-btn--primary"
                    onClick={() => {
                      if (!isGuestUser && creditFetched && userCredit < CREDIT_COST.EXPAND_COMPARE) {
                        alert(`크레딧이 부족합니다.\n확장 비교에 ${CREDIT_COST.EXPAND_COMPARE}C가 필요합니다. (현재 ${userCredit}C)\n광고를 시청하여 크레딧을 충전해주세요.`);
                        return;
                      }
                      setProductDisplayCount(3);
                      fetchUserInfo();
                    }}
                  >
                    비교후보 3개로 확장 ({CREDIT_COST.EXPAND_COMPARE}C)
                  </button>
                  <button
                    type="button"
                    className="rpt-bottom-btn rpt-bottom-btn--secondary"
                    onClick={() => {
                      if (!isGuestUser && creditFetched && userCredit < CREDIT_COST.CONTINUE_CHAT) {
                        alert(`크레딧이 부족합니다.\n이어서 대화하기에 ${CREDIT_COST.CONTINUE_CHAT}C가 필요합니다. (현재 ${userCredit}C)\n광고를 시청하여 크레딧을 충전해주세요.`);
                        return;
                      }
                      setPostReportMode("freeChat");
                    }}
                  >
                    이어서 질문하기 ({CREDIT_COST.CONTINUE_CHAT}C)
                  </button>
                </div>
                <div className="chat-recommend-questions">
                  <span className="chat-recommend-label">추천 질문</span>
                  <div className="chat-recommend-chips">
                    {[
                      "1위 제품의 장단점을 더 자세히 알려줘",
                      "가성비가 가장 좋은 제품은 뭐야?",
                      "비슷한 다른 제품도 추천해줘",
                    ].map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        className="chat-recommend-chip"
                        onClick={() => {
                          setPostReportMode("freeChat");
                          setInputValue(q);
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : reportPhase === "report" && postReportMode === "freeChat" ? (
              <div className="chat-input-wrap">
                <input
                    type="text"
                    className="chat-input"
                    placeholder="리포트에 대해 궁금한 점을 물어보세요"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleContinueChat();
                    }}
                    aria-label="이어서 질문 입력"
                />
                <button
                    type="button"
                    className={`chat-send-btn${inputValue.trim() ? " chat-send-btn--active" : ""}`}
                    aria-label="보내기"
                    onClick={handleContinueChat}
                >
                  <img src="/image/chat-send-icon.png" alt="" className="chat-send-icon" aria-hidden />
                </button>
              </div>
            ) : (
              <div className="chat-input-wrap">
                <input
                    type="text"
                    className="chat-input"
                    placeholder={reportPhase === "generating" ? "리포트를 생성하고 있습니다..." : "무엇이든 물어보세요"}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={reportPhase !== "idle"}
                    aria-label="메시지 입력"
                />
                <button
                    type="button"
                    className={`chat-send-btn${inputValue.trim() && reportPhase === "idle" ? " chat-send-btn--active" : ""}`}
                    aria-label="보내기"
                    onClick={handleSend}
                    disabled={reportPhase !== "idle"}
                >
                  <img src="/image/chat-send-icon.png" alt="" className="chat-send-icon" aria-hidden />
                </button>
              </div>
            )}
            </div>
          </main>
        </div>
      </>
  );
}
