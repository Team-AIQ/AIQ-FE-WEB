"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatLayout from "@/components/ChatLayout";
import ChatHeader from "@/components/ChatHeader";

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

const AI_MODELS = [
  { key: "gpt", label: "Chat GPT", icon: "🤖" },
  { key: "gemini", label: "Gemini", icon: "✨" },
  { key: "perplexity", label: "Perplexity", icon: "🔍" },
];

export default function ReportPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<
    string,
    AiResponse
  > | null>(null);
  const [userRequirements, setUserRequirements] = useState<string>("");
  const [selectedAiKey, setSelectedAiKey] = useState<string | null>(null);

  useEffect(() => {
    const storedReport = sessionStorage.getItem("finalReport");
    const storedAi = sessionStorage.getItem("aiResponses");
    const storedRequirements = sessionStorage.getItem("userRequirements");

    if (!storedReport) {
      router.push("/chat");
      return;
    }

    setReport(JSON.parse(storedReport));
    if (storedAi) setAiResponses(JSON.parse(storedAi));
    if (storedRequirements) setUserRequirements(storedRequirements);
    setIsLoading(false);
  }, []);

  const handleComplete = () => {
    sessionStorage.removeItem("finalReport");
    sessionStorage.removeItem("aiResponses");
    sessionStorage.removeItem("userRequirements");
    router.push("/chat");
  };

  const findAiData = (key: string) => {
    if (!aiResponses) return null;
    const entry = Object.entries(aiResponses).find(([k]) =>
      k.toLowerCase().includes(key),
    );
    return entry ? { modelName: entry[0], aiData: entry[1] } : null;
  };

  const selectedAi = selectedAiKey ? findAiData(selectedAiKey) : null;
  const selectedAiLabel = selectedAiKey
    ? AI_MODELS.find((m) => m.key === selectedAiKey)?.label || ""
    : "";

  if (isLoading) {
    return (
      <ChatLayout>
        <ChatHeader />
        <div className="chat-main">
          <div className="chat-main-content">
            <p style={{ color: "#fff", marginTop: "5rem" }}>로딩 중...</p>
          </div>
        </div>
      </ChatLayout>
    );
  }

  if (!report) return null;

  const topProduct = report.topProducts?.[0];

  return (
    <ChatLayout>
      <ChatHeader />
      {/* chat-main 구조 그대로 사용 */}
      <div className="chat-main">
        {/* ✅ report 전용 컨테이너 (chat-messages 클래스 제거) */}
        <div className="rpt-container">
          {/* ✅ 초록 테두리/배경 “껍데기” */}
          <div className="rpt-shell">
            {/* ✅ 2컬럼 그리드: 왼쪽(공통합의+카드) / 오른쪽(상세패널) */}
            <div className={`rpt-grid ${selectedAi ? "is-open" : ""}`}>
              {/* ===== 왼쪽 컬럼 ===== */}
              <div className="rpt-leftcol">
                {/* 위: 공통 합의 박스 */}
                <div className="rpt-consensus-box">
                  <h3 className="rpt-consensus-title">AI 공통 합의</h3>
                  <div className="rpt-consensus-text">{report.consensus}</div>

                  {report.decisionBranches && (
                    <>
                      <h4 className="rpt-consensus-sub">AI 간단 분석</h4>
                      <div className="rpt-consensus-text">
                        {report.decisionBranches}
                      </div>
                    </>
                  )}
                </div>

                {/* 아래: AI 카드 3개 */}
                <div className="rpt-ai-row">
                  {AI_MODELS.map(({ key, label, icon }) => {
                    const found = findAiData(key);

                    return (
                      <div
                        key={key}
                        className={`rpt-ai-card-new ${!found ? "is-off" : ""}`}
                      >
                        <div className="rpt-ai-card-head">
                          <span className="rpt-ai-icon">{icon}</span>
                          <span className="rpt-ai-label">{label}</span>
                        </div>

                        {found ? (
                          <div className="rpt-ai-card-body-new">
                            {found.aiData.recommendations
                              ?.slice(0, 2)
                              .map((rec, i) => (
                                <div key={i} className="rpt-ai-card-item-new">
                                  <strong>
                                    {rec.modelName || rec.targetAudience}
                                  </strong>
                                  {rec.selectionReasons
                                    ?.slice(0, 1)
                                    .map((r, ri) => (
                                      <p key={ri}>• {r}</p>
                                    ))}
                                </div>
                              ))}
                          </div>
                        ) : (
                          // ✅ 4번 사진 같은 “OFF 카드”
                          <div className="rpt-ai-card-empty">
                            <div className="rpt-ai-off">OFF</div>
                            <p className="rpt-ai-off-text">
                              활성화를 원하시면
                              <br />
                              {label} ON을 켜주세요
                            </p>
                          </div>
                        )}

                        <button
                          type="button"
                          className="rpt-ai-card-btn-new"
                          onClick={() => setSelectedAiKey(key)}
                          disabled={!found}
                        >
                          전체보기
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ===== 오른쪽 패널 ===== */}
              {selectedAi && (
                <div className="rpt-panel">
                  <div className="rpt-panel-head">
                    <h3 className="rpt-panel-name">🤖 {selectedAiLabel}</h3>
                    <button
                      type="button"
                      className="rpt-panel-back"
                      onClick={() => setSelectedAiKey(null)}
                    >
                      ← 뒤로가기
                    </button>
                  </div>

                  <div className="rpt-panel-scroll">
                    {selectedAi.aiData.recommendations?.map((rec, recIdx) => (
                      <div key={recIdx} className="rpt-panel-rec">
                        <h4 className="rpt-panel-rec-t">
                          {recIdx + 1}. {rec.targetAudience}
                        </h4>
                        <ul className="rpt-panel-rec-ul">
                          {rec.selectionReasons?.map((reason, rIdx) => (
                            <li key={rIdx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {selectedAi.aiData.specGuide && (
                      <div className="rpt-panel-sec">
                        <h4 className="rpt-panel-sec-t">🔥 구매 스펙 가이드</h4>
                        <p>{selectedAi.aiData.specGuide}</p>
                      </div>
                    )}

                    {selectedAi.aiData.finalWord && (
                      <div className="rpt-panel-sec">
                        <h4 className="rpt-panel-sec-t">💬 종합 의견</h4>
                        <p>{selectedAi.aiData.finalWord}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ 하단 바는 rpt-container 밖(지금처럼 chat-main의 마지막)에 유지 */}
        <div className="chat-input-wrap">
          <input
            type="text"
            className="chat-input"
            placeholder="리포트 결과를 확인해 주세요"
            disabled
          />
          <button
            type="button"
            className="chat-send-btn"
            onClick={handleComplete}
          >
            <img
              src="/image/chat-send-icon.png"
              alt=""
              className="chat-send-icon"
            />
          </button>
        </div>
      </div>
    </ChatLayout>
  );
}
