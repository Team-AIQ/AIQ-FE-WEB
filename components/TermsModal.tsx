"use client";

import { useEffect } from "react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
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

      <div className="service-intro-modal" role="dialog" aria-modal="true" aria-labelledby="terms-title">
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
          <h1 id="terms-title" className="service-intro-title">
            이용약관
          </h1>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">제1조 (목적)</h2>
            <p className="service-intro-text">
              본 약관은 &apos;AIQ&apos;(이하 &quot;서비스&quot;)가 제공하는 AI
              기반 쇼핑 판단 지원 서비스의 이용 조건 및 절차, 회사와 이용자
              간의 권리와 의무를 규정함을 목적으로 합니다.
            </p>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">제2조 (용어의 정의)</h2>
            <ol className="service-intro-list service-intro-list--numbered">
              <li>
                <strong>&quot;크레딧&quot;</strong>: 서비스 내에서 AI 분석
                리포트 확인, 확장 비교 등 유료 기능을 이용하기 위해 사용되는
                가상의 도구입니다.
              </li>
              <li>
                <strong>&quot;보상형 광고&quot;</strong>: 이용자가 크레딧을
                충전하기 위해 자발적으로 시청하는 광고를 의미합니다.
              </li>
              <li>
                <strong>&quot;판단 리포트&quot;</strong>: 다수의 AI 모델 답변을
                종합하여 제공되는 쇼핑 분석 결과물입니다.
              </li>
            </ol>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              제3조 (회원가입 및 계정 관리)
            </h2>
            <ol className="service-intro-list service-intro-list--numbered">
              <li>
                이용자는 회사가 정한 절차에 따라 소셜 계정 또는 이메일을 통해
                가입함으로써 이용계약을 신청합니다.
              </li>
              <li>
                회사는 가입 시 서비스 제공에 필요한 최소한의 정보(이름, 닉네임,
                생일 등)를 수집할 수 있습니다.
              </li>
              <li>
                이용자는 자신의 계정 정보를 안전하게 관리해야 하며, 타인에게
                양도하거나 대여할 수 없습니다.
              </li>
            </ol>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              제4조 (서비스의 제공 및 제한)
            </h2>
            <ol className="service-intro-list service-intro-list--numbered">
              <li>
                서비스는 연중무휴 1일 24시간 제공함을 원칙으로 합니다.
              </li>
              <li>
                회사는 시스템 점검, 교체, 고장 등 운영상 상당한 이유가 있는
                경우 서비스 제공을 일시적으로 중단할 수 있습니다.
              </li>
              <li>
                <strong>접속 정책:</strong> 앱(App)은 로그인 후 이용이
                가능하며, 웹(Web)은 비회원 상태에서도 일부 기능을 이용할 수
                있으나 이용 범위가 제한될 수 있습니다.
              </li>
            </ol>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">제5조 (크레딧 정책)</h2>
            <ol className="service-intro-list service-intro-list--numbered">
              <li>
                <strong>충전:</strong> 이용자는 광고 시청 또는 유료 결제를 통해
                크레딧을 획득할 수 있습니다.
              </li>
              <li>
                <strong>차등 소진:</strong> 일반 질문, 확장 비교, 재질문 등
                이용하는 기능의 복잡도에 따라 정해진 크레딧이 소진됩니다.
              </li>
              <li>
                <strong>유효기간:</strong> 신규 가입 혜택으로 제공된 무료
                크레딧 등은 회사가 정한 기간(예: 3개월) 내에 사용해야 하며,
                기간 경과 시 소멸됩니다.
              </li>
            </ol>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">제6조 (구매 및 결제)</h2>
            <ol className="service-intro-list service-intro-list--numbered">
              <li>
                유료 크레딧 구매는 각 플랫폼(App Store, 웹 결제 등)의 결제
                방식을 따릅니다.
              </li>
              <li>
                <strong>환불:</strong> 유료로 구매한 크레딧의 환불은 관련 법령
                및 회사의 환불 정책에 따르며, 이미 사용한 크레딧이나 무료로
                지급된 크레딧은 환불되지 않습니다.
              </li>
            </ol>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              제7조 (면책 조항 및 책임의 제한)
            </h2>
            <ol className="service-intro-list service-intro-list--numbered">
              <li>
                서비스는 여러 AI 모델의 답변을 수집하여 비교·제공하는 도구이며,
                답변 내용의 객관적 정확성이나 품질을 완벽하게 보장하지 않습니다.
              </li>
              <li>
                리포트 내에 제공된 제품 링크는 외부 쇼핑몰로 연결되며, 해당
                사이트에서 발생하는 모든 상거래 활동(구매, 배송, 환불 등)은
                해당 쇼핑몰의 책임하에 이루어집니다.
              </li>
              <li>
                이용자가 서비스의 정보를 바탕으로 내린 최종 구매 결정 및 그에
                따른 결과에 대하여 회사는 고의 또는 중과실이 없는 한 책임을
                지지 않습니다.
              </li>
            </ol>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              제8조 (이용자의 의무 및 금지행위)
            </h2>
            <p className="service-intro-text">
              이용자는 다음 각호의 행위를 하여서는 안 됩니다.
            </p>
            <ol className="service-intro-list service-intro-list--numbered">
              <li>타인의 정보 도용 및 허위 사실 기재</li>
              <li>
                서비스의 정상적인 운영을 방해하거나 시스템에 무리를 주는 행위
              </li>
              <li>
                서비스를 통해 얻은 정보를 상업적 목적으로 복제 또는 배포하는
                행위
              </li>
            </ol>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              제9조 (준거법 및 재판관할)
            </h2>
            <ol className="service-intro-list service-intro-list--numbered">
              <li>
                본 약관의 해석 및 회사와 이용자 간의 분쟁에 대하여는 대한민국
                법령을 적용합니다.
              </li>
              <li>
                서비스 이용 중 발생한 분쟁에 관한 소송은 회사의 본점 소재지
                관할 법원을 우선적 관할 법원으로 합니다.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
