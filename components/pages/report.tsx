"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ChatHeader from "@/components/ChatHeader";
import ChatLayout from "@/components/ChatLayout";

interface AiRecommendation {
  productName?: string;
  targetAudience?: string;
  selectionReasons?: string[];
}

interface AiResponse {
  recommendations: AiRecommendation[];
  specGuide: string;
  finalWord: string;
}

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

const AI_MODELS = [
  { key: "gpt", label: "Chat GPT", logo: "/image/gpt-logo.png" },
  { key: "gemini", label: "Gemini", logo: "/image/gemini-logo.png" },
  { key: "perplexity", label: "Perplexity", logo: "/image/perp-logo.png" },
];

function renderFormattedText(text: string) {
  if (!text) return null;
  return text.split("\n").map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={idx} />;
    if (/^[-•]\s/.test(trimmed)) {
      return (
        <div key={idx} style={{ paddingLeft: "1em", textIndent: "-0.7em" }}>
          {trimmed}
        </div>
      );
    }
    return <div key={idx}>{trimmed}</div>;
  });
}

export default function ReportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<string, AiResponse> | null>(
    null
  );
  const [selectedAiKey, setSelectedAiKey] = useState<string | null>(null);

  useEffect(() => {
    const storedReport = sessionStorage.getItem("finalReport");
    const storedAi = sessionStorage.getItem("aiResponses");

    if (!storedReport) {
      router.push("/chat");
      return;
    }

    const parsedReport = JSON.parse(storedReport) as FinalReport;
    setReport(parsedReport);

    if (storedAi) {
      const parsedAi = JSON.parse(storedAi) as Record<string, AiResponse>;
      setAiResponses(parsedAi);

      const defaultModel = AI_MODELS.find((m) =>
        Object.keys(parsedAi).some((k) => k.toLowerCase().includes(m.key))
      );
      if (defaultModel) setSelectedAiKey(defaultModel.key);
    }

    setIsLoading(false);
  }, [router]);

  const handleComplete = () => {
    sessionStorage.removeItem("finalReport");
    sessionStorage.removeItem("aiResponses");
    sessionStorage.removeItem("userRequirements");
    window.location.href = "/chat";
  };

  const handleExpandTop3 = () => {
    alert("이미 비교 후보 3개가 표시되고 있습니다.");
  };

  const findAiData = (key: string) => {
    if (!aiResponses) return null;
    const entry = Object.entries(aiResponses).find(([k]) =>
      k.toLowerCase().includes(key)
    );
    return entry ? { modelName: entry[0], aiData: entry[1] } : null;
  };

  const selectedAi = selectedAiKey ? findAiData(selectedAiKey) : null;
  const selectedAiModel = AI_MODELS.find((m) => m.key === selectedAiKey);
  const top1 = report?.topProducts?.[0];

  const visibleSpecs = useMemo(() => {
    if (!top1?.specs) return [];
    return Object.entries(top1.specs).slice(0, 4);
  }, [top1]);

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

  return (
    <ChatLayout>
      <ChatHeader />
      <div className="chat-main">
        <div className="rpt-container">
          <div className="rpt-shell">
            <div className={`rpt-grid ${selectedAi ? "is-open" : ""}`}>
              <div className="rpt-leftcol">
                {top1 ? (
                  <div className="rpt-main-product">
                    <div className="rpt-product-rank">추천 제품 TOP 1</div>
                    <div className="rpt-main-product-name">{top1.productName}</div>

                    <div className="rpt-main-product-image-wrap">
                      {top1.productImage ? (
                        <img
                          src={top1.productImage}
                          alt={top1.productName}
                          className="rpt-main-product-image"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="rpt-main-no-image">No Image</div>
                      )}
                    </div>

                    {visibleSpecs.length > 0 && (
                      <div className="rpt-main-product-specs">
                        {visibleSpecs.map(([k, v]) => (
                          <span key={k} className="rpt-main-product-spec">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}

                    {top1.price && (
                      <>
                        <div className="rpt-main-price-label">(시중 판매 평균가)</div>
                        <div className="rpt-main-price">{top1.price}</div>
                      </>
                    )}

                    {top1.comparativeAnalysis && (
                      <p className="rpt-main-analysis">{top1.comparativeAnalysis}</p>
                    )}

                    {top1.lowestPriceLink && (
                      <a
                        href={top1.lowestPriceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rpt-main-buy-link"
                      >
                        구매하러가기 &gt;
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="rpt-main-product rpt-main-product--empty">
                    추천 제품 정보가 없습니다.
                  </div>
                )}

                <div className="rpt-ai-list-vert">
                  {AI_MODELS.map((model) => {
                    const found = findAiData(model.key);
                    const preview = found?.aiData.recommendations?.[0];
                    const isSelected = selectedAiKey === model.key;

                    return (
                      <div
                        key={model.key}
                        className={`rpt-ai-card-vert ${isSelected ? "is-selected" : ""} ${!found ? "is-off" : ""}`}
                      >
                        <div className="rpt-ai-card-head">
                          <img
                            src={model.logo}
                            alt={model.label}
                            className="rpt-ai-logo"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <span className="rpt-ai-label">{model.label}</span>
                        </div>

                        {found ? (
                          <div className="rpt-ai-card-body-new">
                            <div className="rpt-ai-card-item-new">
                              <strong>{preview?.productName || "추천 결과 확인"}</strong>
                              {preview?.targetAudience && (
                                <p className="rpt-ai-card-audience">
                                  {preview.targetAudience}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rpt-ai-card-vert-off-label">OFF</div>
                        )}

                        <button
                          type="button"
                          className="rpt-ai-card-btn-new"
                          disabled={!found}
                          onClick={() =>
                            setSelectedAiKey(isSelected ? null : model.key)
                          }
                        >
                          {isSelected ? "접기" : "전체보기"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedAi && selectedAiModel && (
                <div className="rpt-panel">
                  <div className="rpt-panel-head">
                    <h3 className="rpt-panel-name">
                      <img
                        src={selectedAiModel.logo}
                        alt={selectedAiModel.label}
                        className="rpt-ai-logo"
                      />
                      {selectedAiModel.label}
                    </h3>
                    <button
                      type="button"
                      className="rpt-panel-back"
                      onClick={() => setSelectedAiKey(null)}
                    >
                      ← 뒤로가기
                    </button>
                  </div>

                  <div className="rpt-panel-scroll">
                    {selectedAi.aiData.recommendations?.map((rec, idx) => (
                      <div key={idx} className="rpt-panel-rec">
                        <h4 className="rpt-panel-rec-t">
                          {idx + 1}. {rec.productName || "추천 제품"}
                        </h4>
                        {rec.targetAudience && (
                          <p className="rpt-panel-rec-audience">
                            추천 대상: {rec.targetAudience}
                          </p>
                        )}
                        <ul className="rpt-panel-rec-ul">
                          {(rec.selectionReasons || []).map((reason, rIdx) => (
                            <li key={rIdx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {selectedAi.aiData.specGuide && (
                      <div className="rpt-panel-sec">
                        <h4 className="rpt-panel-sec-t">구매 스펙 가이드</h4>
                        <div className="rpt-panel-sec-body">
                          {renderFormattedText(selectedAi.aiData.specGuide)}
                        </div>
                      </div>
                    )}

                    {selectedAi.aiData.finalWord && (
                      <div className="rpt-panel-sec">
                        <h4 className="rpt-panel-sec-t">종합 의견</h4>
                        <div className="rpt-panel-sec-body">
                          {renderFormattedText(selectedAi.aiData.finalWord)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rpt-bottom-btns">
          <button
            type="button"
            className="rpt-bottom-btn rpt-bottom-btn--secondary"
            onClick={handleExpandTop3}
          >
            비교후보 3개로 확장 (10C)
          </button>
          <button
            type="button"
            className="rpt-bottom-btn rpt-bottom-btn--primary"
            onClick={handleComplete}
          >
            완료하기
          </button>
        </div>
      </div>
    </ChatLayout>
  );
}
