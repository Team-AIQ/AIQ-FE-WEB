"use client";

import { useEffect } from "react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
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
      <div
        className="service-intro-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="service-intro-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
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
          <h1 id="help-title" className="service-intro-title">
            자주 묻는 질문 (FAQ)
          </h1>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              Q1. AIQ는 어떤 서비스인가요?
            </h2>
            <p className="service-intro-text">
              AIQ는 여러 AI 모델(GPT, Gemini, Perplexity)의 답변을 한곳에서
              비교·정리하여, 사용자가 쇼핑 판단을 내릴 수 있도록 돕는{" "}
              <strong>&apos;쇼핑 판단 게이트웨이&apos;</strong> 서비스입니다.
              AI 간의 합의점과 차이점을 요약하여 제공함으로써 구매 전 불확신을
              제거하고 &apos;워프 쇼핑&apos; 경험을 제공합니다.
            </p>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              Q2. 크레딧은 어떻게 사용되나요?
            </h2>
            <p className="service-intro-text">
              사용자의 액션에 따라 다음과 같이 크레딧이 차등 소진됩니다.
            </p>
            <ul className="service-intro-list">
              <li>
                <strong>일반 질문 (3C):</strong> 단발성 질의 및 기본 분석
                리포트 생성 시 소진됩니다.
              </li>
              <li>
                <strong>제품 추천 3개 확장 (10C):</strong> 최종 추천 제품
                1개에서 범위를 넓혀 TOP 3 제품까지 확장하여 비교하고 싶을 때
                사용합니다.
              </li>
              <li>
                <strong>이어서 질문하기 (10C):</strong> 현재 결과에서 세부 내용을
                더 묻거나 추가 요구사항을 반영하고 싶을 때 사용합니다.
              </li>
            </ul>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              Q3. 광고를 봤는데 왜 크레딧이 또 필요한가요?
            </h2>
            <p className="service-intro-text">
              AIQ의 리포트를 확인하기 위해서는 &apos;필수 광고 시청&apos;과
              &apos;크레딧 소진&apos; 두 단계가 모두 필요합니다.
            </p>
            <ul className="service-intro-list">
              <li>
                <strong>필수 광고 시청:</strong> 리포트 출력 직전에 반드시
                거쳐야 하는 단계이며, 이것만으로 리포트가 무료로 제공되는 것은
                아닙니다.
              </li>
              <li>
                <strong>크레딧 사용:</strong> 리포트를 최종적으로 열람하기
                위해서는 미리 보유한 크레딧이 차감되어야 합니다.
              </li>
            </ul>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              Q4. 크레딧이 부족할 때는 어떻게 해야 하나요?
            </h2>
            <p className="service-intro-text">
              광고를 추가로 시청하여 크레딧을 확보할 수 있습니다.
            </p>
            <ul className="service-intro-list">
              <li>
                <strong>보상형 광고:</strong> 광고 1개를 시청할 때마다{" "}
                <strong>1C가 자동으로 충전</strong>됩니다.
              </li>
              <li>
                부족한 크레딧만큼 광고를 더 시청하여 크레딧을 불린 뒤, 리포트
                출력이나 확장 기능을 이용하실 수 있습니다.
              </li>
            </ul>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              Q5. 비회원과 회원은 어떤 차이가 있나요?
            </h2>
            <ul className="service-intro-list">
              <li>
                <strong>회원:</strong> 소셜 로그인을 통해 가입 시 20C의 무료
                크레딧이 즉시 지급됩니다. 모든 대화 내역이{" "}
                <strong>히스토리</strong>에 저장되어 다시 볼 수 있으며, 앱과
                웹에서 모두 이용 가능합니다.
              </li>
              <li>
                <strong>비회원:</strong> 별도의 가입 없이 웹에서 이용
                가능하지만(초기 3개월 제한),{" "}
                <strong>히스토리가 저장되지 않으며</strong> 기본 리포트
                조회까지로 서비스가 제한됩니다.
              </li>
            </ul>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              Q6. AIQ에서 추천하는 제품이 항상 최저가인가요?
            </h2>
            <p className="service-intro-text">
              AIQ는 무조건 최저가만 찾는 서비스가 아닙니다. 가격 비교 앱은 이미
              시중에 많지만, AIQ는{" "}
              <strong>
                &apos;왜 이 제품을 사야 하는가&apos;에 대한 판단 기준
              </strong>
              을 세워주는 데 집중합니다. AI들이 분석한 합리적인 근거를 바탕으로
              사용자에게 가장 적합한 제품을 제안하며, 최종 구매는 연결된 이커머스
              링크를 통해 확신을 가지고 진행하실 수 있습니다.
            </p>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              Q7. AIQ는 항상 정확한가요?
            </h2>
            <p className="service-intro-text">
              AIQ는 멀티 AI의 공통점과 차이점을 투명하게 구조화하여 제공하지만,
              AI 특성상 실시간 정보와는 미세한 차이가 발생할 수 있습니다.
              최종적인 구매 결정은 리포트 내 연결된 상세 정보를 확인하신 후
              진행하시는 것을 권장합니다.
            </p>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">문의하기</h2>
            <ul className="service-intro-list">
              <li>
                <strong>문의 접수:</strong> 아래의{" "}
                <a
                  href="https://forms.gle/qjSoSfVDSKuu2R3m9"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#6c5ce7", textDecoration: "underline" }}
                >
                  문의하기 구글 폼
                </a>
                {" "}링크를 통해 상세 내용을 남겨주세요.
              </li>
              <li>
                <strong>처리 기간:</strong> 영업일 기준 1~3일 이내에
                기재해주신 이메일로 답변을 드립니다.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
