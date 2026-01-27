"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, FileText } from "lucide-react";
import { LottieLoader } from "@/components/lottie-loader";

// Axios 인스턴스 설정
const api = axios.create({
    baseURL: "http://49.247.139.167:8080",
    headers: { "Content-Type": "application/json" },
});

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-aiq-black">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none"
          >
            <Star
              className={`w-8 h-8 transition-all duration-200 ${
                star <= (hovered || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-aiq-green self-center">
            {value}점
          </span>
        )}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const isFetched = useRef(false);

  // ⭐ 기존 상태들 (그대로)
  const [stars1, setStars1] = useState(0);
  const [stars2, setStars2] = useState(0);
  const [textFeedback, setTextFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nickname, setNickname] = useState("");
  const [errors, setErrors] = useState<{ ratings?: string }>({});

  // ✅ 모달 상태 (그대로)
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [savedReport, setSavedReport] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedNickname = sessionStorage.getItem("nickname");
      if (!storedNickname) {
        router.push("/");
        return;
      }
      setNickname(storedNickname);
    }
  }, [router]);

  const handleSubmit = async () => {
    if (isFetched.current) return;

    if (stars1 === 0 || stars2 === 0) {
      setErrors({ ratings: "모든 항목에 별점을 선택해 주세요" });
      return;
    }

    const storedNickname = sessionStorage.getItem("nickname");
    const storedPhoneNumber = sessionStorage.getItem("phonenumber");

    if (!storedPhoneNumber) {
      alert("사용자 정보가 없습니다. 처음부터 다시 시도해주세요.");
      return;
    }

    try {
      isFetched.current = true;
      setIsSubmitting(true);
      setErrors({});

      const feedbackData = {
        name: storedNickname,
        phoneNumber: storedPhoneNumber,
        convenienceRating: stars1,
        usageIntentRating: stars2,
        comment: textFeedback,
      };

      const response = await api.post("/api/feedback", feedbackData);

      if (response.status === 200 || response.status === 201) {
        alert("피드백이 성공적으로 전달되었습니다!");
        sessionStorage.clear();
        router.push("/thank-you");
      }
    } catch (error) {
      isFetched.current = false;
      setIsSubmitting(false);
      console.error("제출 실패:", error);
      alert("전송 중 오류가 발생했습니다.");
    }
  };

  // ✅ 보고서 다시 보기 → 모달 열기
  // 🔥 변경 포인트: aiq-report가 없으면 questionId로 백엔드에서 다시 받아오고 저장한 뒤 모달 오픈
  const handleViewReport = async () => {
    // 1) 세션에 저장된 보고서가 있으면 그걸 최우선 사용
    const cached = sessionStorage.getItem("aiq-report");
    if (cached) {
      setSavedReport(cached);
      setIsReportOpen(true);
      return;
    }

    // 2) 없으면 questionId로 백엔드에서 다시 받아오기 (최소한의 안전장치)
    const questionId = sessionStorage.getItem("questionId");
    if (!questionId) {
      // 여기서 막히면, report를 재구성할 키가 없는 상태
      alert("보고서를 불러올 수 없습니다. (questionId 없음)");
      return;
    }

    try {
      // ✅ 보고서 재호출 (report.tsx가 호출하는 엔드포인트와 동일)
      // baseURL이 http://localhost:8080 이므로 아래처럼 쓰면 됨
      const response = await api.post(`/api/ai/synthesize/${questionId}`);

      const data =
        typeof response.data === "string"
          ? response.data
          : response.data?.report || response.data?.content || "";

      if (!data) {
        alert("보고서를 불러올 수 없습니다. (응답 비어있음)");
        return;
      }

      // 🔥 다시는 안 깨지게 캐시에 저장
      sessionStorage.setItem("aiq-report", data);

      // 모달 오픈
      setSavedReport(data);
      setIsReportOpen(true);
    } catch (e) {
      console.error("보고서 재요청 실패:", e);
      alert("보고서를 불러올 수 없습니다. (서버 요청 실패)");
    }
  };

  // ==========================
  // report.tsx에서 그대로 복사
  // ==========================

  const parseBold = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, j) =>
      j % 2 === 1 ? (
        <strong
          key={j}
          className="text-aiq-green font-semibold bg-aiq-green/10 px-1.5 py-0.5 rounded-md"
        >
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  const linkRegex = /\[(.*?)\]\((https?:\/\/[^\s]+)\)/;

  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={i} className="text-lg font-extrabold mt-4">
            {trimmed.replace(/^#\s*/, "")}
          </h1>
        );
      }

      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={i} className="text-base font-bold mt-10 mb-3">
            {trimmed.replace(/^##\s*/, "")}
          </h2>
        );
      }

      if (trimmed.startsWith("### ")) {
        const rawTitle = trimmed.replace(/^###\s*/, "");
        const isFinalRecommendation = rawTitle.includes("3. 최종 추천");

        if (isFinalRecommendation && rawTitle.includes("|")) {
          const [left, right] = rawTitle.split("|");
          const productName = right.replace(/\*\*/g, "").trim();

          return (
            <h3
              key={i}
              className="flex items-center gap-2 text-xl font-extrabold mt-10 mb-5 text-indigo-600"
            >
              <span className="text-yellow-400">⭐</span>
              <span>{left.trim()} |</span>
              <span className="text-red-500 font-extrabold">{productName}</span>
            </h3>
          );
        }

        return (
          <h3 key={i} className="text-sm font-bold mt-5 mb-2 text-aiq-green">
            {parseBold(rawTitle)}
          </h3>
        );
      }

      if (trimmed.startsWith("- ") || /^\d+\./.test(trimmed)) {
        const content = trimmed.replace(/^- |\d+\. /, "");
        const linkMatch = content.match(linkRegex);

        return (
          <div key={i} className="flex gap-2 ml-1 my-1.5">
            <span>•</span>
            <span className="flex-1">
              {linkMatch ? (
                <>
                  {parseBold(content.replace(linkMatch[0], "").trim())}
                  <a
                    href={linkMatch[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 underline underline-offset-4 font-medium"
                  >
                    {linkMatch[1]}
                  </a>
                </>
              ) : (
                parseBold(content)
              )}
            </span>
          </div>
        );
      }

      return trimmed ? (
        <div key={i} className="my-2 leading-relaxed">
          {parseBold(trimmed)}
        </div>
      ) : (
        <div key={i} className="h-2" />
      );
    });
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-aiq-gray-light to-white flex flex-col items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-md">
          <div className="flex justify-center mb-6 animate-fade-in">
            <img
              src="/images/aiq-character.png"
              alt="AIQ Character"
              className="w-24 h-auto object-contain animate-float"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-border">
            <h1 className="text-xl font-bold text-center text-aiq-black mb-2">
              사용자 만족도 조사
            </h1>
            <p className="text-aiq-gray text-center text-sm mb-6">
              {nickname}님의 소중한 피드백을 부탁드려요!
            </p>

            <div className="space-y-6">
              <StarRating
                value={stars1}
                onChange={setStars1}
                label="비교 과정이 덜 번거로웠나요?"
              />
              <StarRating
                value={stars2}
                onChange={setStars2}
                label="이런 서비스가 있다면 사용할 의향이 있나요?"
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-aiq-black">
                  AIQ의 개선사항을 피드백 해주세요!
                </label>
                <Textarea
                  placeholder="사용하면서 느꼈던 점이나 개선 사항을 자유롭게 적어주세요."
                  value={textFeedback}
                  onChange={(e) => setTextFeedback(e.target.value)}
                  className="min-h-[100px] rounded-xl border-2 resize-none"
                />
              </div>

              <Button
                onClick={handleViewReport}
                variant="outline"
                className="w-full h-12 border-2 border-aiq-green text-aiq-green rounded-xl flex gap-2 bg-transparent"
              >
                <FileText className="w-5 h-5" />
                AIQ 보고서 다시 보기
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 bg-aiq-green hover:bg-aiq-green-dark text-white font-semibold rounded-xl text-lg transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <LottieLoader size={24} /> 제출 중...
                  </span>
                ) : (
                  "피드백 제출하기"
                )}
              </Button>

              {errors.ratings && (
                <p className="text-sm text-destructive text-center">
                  {errors.ratings}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {isReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          {/* 📱 반응형 컨테이너 */}
          <div
            className="
    w-[92vw]          /* 좌우 여백 확보 */
    max-w-3xl        /* 데스크탑 최대 폭 */
    max-h-[85vh]     /* 상하 여백 확보 */
    bg-white
    rounded-2xl
    shadow-xl
    overflow-hidden
    flex
    flex-col
  "
          >
            {/* 🟢 report와 동일한 초록 헤더 + 닫기 버튼 */}
            <div className="bg-aiq-green p-4 sm:p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold">
                  AIQ 통합 보고서
                </h3>
                <p className="text-xs sm:text-sm opacity-90">
                  GPT · Gemini · Perplexity 종합 분석
                </p>
              </div>

              {/* ❌ 닫기 버튼 유지 (여기로 이동) */}
              <button
                onClick={() => setIsReportOpen(false)}
                className="text-white/80 hover:text-white text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* 📄 본문 (report UI 그대로, 스크롤 영역) */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="w-full sm:max-w-3xl mx-auto">
                <div className="p-2 sm:p-6 space-y-8">
                  {renderMarkdown(savedReport)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
