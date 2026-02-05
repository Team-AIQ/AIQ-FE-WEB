"use client";

/**
 * AIQCard: "카드 껍데기"만 담당.
 * - 원래 report.tsx의 카드 UI(초록 헤더 + 흰 본문)를 그대로 옮김
 * - prose(문서 스타일)는 여기서 적용하지 않음 (중복 방지)
 */
export default function AIQCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-aiq-green/5 border border-aiq-green/20 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-aiq-green p-6 text-white flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center p-1 shadow-inner">
          <img
            src="/images/aiq-character.png"
            alt="AIQ"
            className="w-full h-full object-contain"
          />
        </div>

        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          {subtitle && (
            <p className="text-aiq-green-light text-sm opacity-90">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="p-6 space-y-8">{children}</div>
    </div>
  );
}
