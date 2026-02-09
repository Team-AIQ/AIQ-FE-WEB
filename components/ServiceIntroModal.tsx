"use client";

import { useEffect } from "react";

interface ServiceIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceIntroModal({ isOpen, onClose }: ServiceIntroModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="service-intro-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* 팝업 모달 */}
      <div className="service-intro-modal" role="dialog" aria-modal="true" aria-labelledby="service-intro-title">
        <button
          className="service-intro-close"
          onClick={onClose}
          aria-label="닫기"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="service-intro-content">
          <h1 id="service-intro-title" className="service-intro-title">
            지구인을 위한 새로운 쇼핑 판단 기준, AIQ
          </h1>

          <div className="service-intro-section">
            <p className="service-intro-quote">
              "추천은 넘치는데, 왜 결정은 더 어려워질까요?"
            </p>
            <p className="service-intro-text">
              AI 쇼핑 시대, 우리는 수많은 정보가 떠다니는 우주 공간에서 길을 잃곤 합니다. GPT, Gemini, Perplexity 등
            </p>
            <p className="service-intro-text">
              여러 AI를 오가며 물어볼수록 답변은 쌓여가고, 사용자의 판단 부담과 결정 피로는 오히려 커지고 있습니다.
            </p>
            <p className="service-intro-text">
              AIQ는 이 혼란을 끝내고, 당신의 구매 직전 판단을 완벽하게 정리하기 위해 탄생했습니다.
            </p>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">서비스 철학: Warp Shopping (워프 쇼핑)</h2>
            <p className="service-intro-text">
              망설임과 재비교의 시간을 건너뛰어, 불확신을 확신으로 바꾸는 '지구에 없던 쇼핑 개념'을 제안합니다.
            </p>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">핵심 가치 (3Q)</h2>
            <ul className="service-intro-list">
              <li>
                <strong>Question (판단의 시작점):</strong>
                <br />
                "무엇을 살까"보다 "어떤 기준으로 볼까"를 먼저 해결하여 결정 피로를 제거합니다.
              </li>
              <li>
                <strong>Quality (고순도 정렬):</strong>
                <br />
                여러 AI의 관점을 단순 나열하지 않고, 공통된 합의점과 갈리는 포인트를 구조화하여 제공합니다.
              </li>
              <li>
                <strong>Quick (확신까지의 거리 단축):</strong>
                <br />
                구매 직전의 망설임을 줄여 사용자가 스스로 납득할 수 있는 결론에 빠르게 도달하도록 돕습니다.
              </li>
            </ul>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">주요 기능</h2>
            <ol className="service-intro-list service-intro-list--numbered">
              <li>
                <strong>카테고리 섹터 질문:</strong>
                <br />
                사용자와의 채팅을 기반으로 구매 의도를 파악하고, 여러 AI가 동시에 최적의 제품을 탐색합니다.
              </li>
              <li>
                <strong>AI 판단 요약 리포트:</strong>
                <br />
                멀티 AI 응답에서 '공통된 합의점'과 '의견이 갈리는 기준'을 분석해 한눈에 들어오는 리포트로 정리합니다.
              </li>
              <li>
                <strong>최적의 TOP 1 제품 추천 및 연결:</strong>
                <br />
                AI들의 판단 합의점을 기반으로 사용자에게 가장 적합한 제품을 추천하고, 구매 가능한 링크를 제공합니다.
              </li>
            </ol>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">왜 AIQ인가요?</h2>
            <ul className="service-intro-list">
              <li>
                <strong>다각도 관점의 통합:</strong>
                <br />
                단일 알고리즘의 단정적인 추천이 아닌, 멀티 AI의 입체적인 정보를 제공합니다.
              </li>
              <li>
                <strong>능동적 구매 확신:</strong>
                <br />
                정보를 수동적으로 수용하는 것을 넘어, 정리된 기준을 바탕으로 '후회 없는 선택'을 할 수 있습니다.
              </li>
              <li>
                <strong>고관여 제품의 조력자:</strong>
                <br />
                가전, IT 기기 등 가격이 높고 비교가 복잡한 제품일수록 AIQ의 판단 데이터는 강력한 구매 근거가 됩니다.
              </li>
            </ul>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">AIQ와 함께하는 변화</h2>
            <p className="service-intro-text">
              AIQ는 복잡한 정보를 나만의 판단 기준으로 수립하는 과정입니다.
            </p>
            <p className="service-intro-text">
              이제 AI 쇼핑의 입구 'AIQ'에서 가장 스마트한 구매 여정을 경험해 보세요.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
