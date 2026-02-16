"use client";

import { useEffect } from "react";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
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

      <div
        className="service-intro-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
      >
        <button
          className="service-intro-close"
          onClick={onClose}
          aria-label="닫기"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="service-intro-content">
          <h1 id="privacy-title" className="service-intro-title">
            개인정보처리방침
          </h1>

          <div className="service-intro-section">
            <p className="service-intro-text">
              본 개인정보 처리방침은 &apos;AIQ&apos;(이하 &quot;회사&quot;)가
              제공하는 서비스를 이용하는 이용자의 개인정보를 소중하게 관리하고,
              이용자가 안심하고 서비스를 이용할 수 있도록 개인정보 보호법 등
              관련 법령을 준수하여 작성되었습니다.
            </p>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              1. 수집하는 개인정보 항목 및 목적
            </h2>
            <p className="service-intro-text">
              회사는 원활한 서비스 제공을 위해 최소한의 개인정보를 수집하며,
              수집된 정보는 정해진 목적 이외의 용도로는 사용되지 않습니다.
            </p>
            <ul className="service-intro-list">
              <li>
                <strong>회원가입 및 관리:</strong> (소셜 로그인 시) 이름,
                닉네임, 프로필 사진, 이메일 주소, 생년월일
                <br />
                - 목적: 본인 확인, 중복 가입 방지, 이용자 식별
              </li>
              <li>
                <strong>서비스 이용 및 맞춤형 가이드 제공:</strong> 이용자의
                질문 키워드, AI 리포트 생성 이력, 크레딧 사용 및 충전 기록
                <br />
                - 목적: 쇼핑 판단 히스토리 관리, 확장 비교 기능 제공, 서비스
                품질 개선 및 통계 분석
              </li>
              <li>
                <strong>마케팅 및 서비스 고도화 (선택):</strong> 기기 정보(OS,
                모델명), 접속 로그, 쿠키(Cookie)
                <br />
                - 목적: 개인별 맞춤형 제품 추천 및 제휴 정보 제공, 신규 기능
                고도화
              </li>
            </ul>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              2. 개인정보의 보유 및 이용기간
            </h2>
            <ul className="service-intro-list">
              <li>
                이용자의 개인정보는 원칙적으로{" "}
                <strong>회원 탈퇴 시 즉시 파기</strong>합니다.
              </li>
              <li>
                단, 신규 가입 혜택(크레딧)의 부정 수급 방지 및 중복 가입
                확인을 위해 탈퇴 후 3개월간 일부 식별 정보를 암호화하여 보관할
                수 있습니다.
              </li>
              <li>
                관련 법령(전자상거래법 등)에 따라 보존이 필요한 경우, 해당
                법령에서 정한 기간 동안 안전하게 보관합니다.
              </li>
            </ul>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              3. 개인정보의 제3자 제공 및 위탁
            </h2>
            <ul className="service-intro-list">
              <li>
                회사는 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다.
              </li>
              <li>
                단, 리포트 내 제품 구매를 위해 외부 커머스 사이트로 이동하는
                경우, 해당 플랫폼의 정책에 따라 정보가 처리됩니다. (이
                과정에서 AIQ가 이용자의 직접적인 결제 정보나 배송지 정보를
                수집하거나 공유하지 않습니다.)
              </li>
              <li>
                효율적인 서비스 제공을 위해 다음과 같이 업무를 위탁하고
                있습니다.
                <br />
                - 위탁 대상: 구글/네이버/카카오 (소셜 로그인 인증), 결제
                대행사 (유료 크레딧 결제 시)
              </li>
            </ul>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              4. 이용자의 권리 및 행사 방법
            </h2>
            <ul className="service-intro-list">
              <li>
                이용자는 언제든지 서비스 내 설정 메뉴를 통해 자신의 개인정보를
                조회하거나 수정할 수 있습니다.
              </li>
              <li>
                이용자는 언제든지 서비스 탈퇴를 통해 개인정보 수집 및 이용에
                대한 동의를 철회할 수 있습니다.
              </li>
              <li>
                만 14세 미만 아동의 경우 법정대리인의 동의가 필요하며, 회사는
                이를 확인하기 위한 절차를 거칠 수 있습니다.
              </li>
            </ul>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              5. 크레딧 및 보상형 광고 관련 안내
            </h2>
            <p className="service-intro-text">
              무료 크레딧 획득을 위한 보상형 광고 시청 시, 광고 플랫폼
              제공사(Ad Network)를 통해 기기 식별값(ADID 등)이 활용될 수
              있습니다. 이는 광고 부정 수급 방지 및 중복 시청 확인을 위한
              목적이며, 이용자의 성명이나 연락처 등 민감한 개인정보는 포함되지
              않습니다.
            </p>
          </div>

          <div className="service-intro-section">
            <h2 className="service-intro-subtitle">
              6. 개인정보 보호를 위한 노력
            </h2>
            <p className="service-intro-text">
              회사는 이용자의 개인정보를 암호화하여 저장하며, 외부로부터의
              해킹이나 침입을 방지하기 위해 최신 보안 시스템을 적용하고
              있습니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
