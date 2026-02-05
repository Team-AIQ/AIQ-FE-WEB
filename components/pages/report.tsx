"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronDown, AlertCircle } from "lucide-react";
import { LottieLoader } from "@/components/lottie-loader";

export default function ReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [report, setReport] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API 중복 호출 방지
  const isFetched = useRef(false);

  useEffect(() => {
    if (isFetched.current) return;

    const questionId =
      searchParams.get("questionId") || sessionStorage.getItem("questionId");

    if (!questionId) {
      router.push("/");
      return;
    }

    const fetchReport = async () => {
      try {
        isFetched.current = true;

        const response = await api.post(
          `http://49.247.139.167:8080/api/ai/synthesize/${questionId}`
        );

        const data =
          typeof response.data === "string"
            ? response.data
            : response.data.report || response.data.content || "";

        if (!data) {
          throw new Error("보고서 내용이 비어있습니다.");
        }

        setReport(data);
        sessionStorage.setItem("aiq-report", data);
      } catch (err) {
        console.error("보고서 요청 오류:", err);
        setError("AIQ 보고서를 생성하는 중 오류가 발생했습니다.");
        isFetched.current = false;
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [router, searchParams]);

  const handleNextClick = () => {
    router.push("/feedback");
  };

  // --- 섹션 분리
  const sections = report.split("---").map((s) => s.trim());
  const firstSection = sections[0] || "";
  const secondSection = sections[1] || "";

  // --- 마크다운 렌더링
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

      if (
        trimmed.startsWith("GPT:") ||
        trimmed.startsWith("Gemini:") ||
        trimmed.startsWith("Perplexity:")
      ) {
        const [model, ...rest] = trimmed.split(":");
        const desc = rest.join(":").trim();

        const colorMap: Record<string, string> = {
          GPT: "bg-blue-50 text-blue-700 border-blue-200",
          Gemini: "bg-purple-50 text-purple-700 border-purple-200",
          Perplexity: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };

        return (
          <div
            key={i}
            className={`border rounded-xl p-4 my-4 ${colorMap[model]}`}
          >
            <div className="font-bold mb-1">{model}</div>
            <div className="text-sm leading-relaxed">{parseBold(desc)}</div>
          </div>
        );
      }

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
    <main className="min-h-screen bg-gradient-to-b from-aiq-gray-light to-white flex flex-col relative">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm">
        <h1 className="text-2xl font-black text-aiq-green">AIQ</h1>
        <div className="text-xs font-medium px-3 py-1 bg-aiq-green/10 text-aiq-green rounded-full">
          AI 분석 완료
        </div>
      </header>

      {/* 🔥 핵심: 로딩 / 콘텐츠 분리 */}
      <div className="flex-1 relative">
        {isLoading ? (
          // ✅ 로딩은 화면 기준 정중앙
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <LottieLoader size={160} />
            <p className="mt-6 text-aiq-gray font-medium text-center">
              3개 모델의 답변을 통합하여 보고서를 쓰고 있어요...
            </p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-destructive/5 text-destructive border p-6 rounded-2xl text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                다시 시도
              </Button>
            </div>
          </div>
        ) : (
          // ✅ 로딩 끝난 뒤에만 스크롤
          <div className="p-4 overflow-auto">
            <div className="max-w-3xl mx-auto animate-fade-in-up">
              <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
                <div className="bg-aiq-green p-6 text-white">
                  <h3 className="text-xl font-bold">AIQ 통합 보고서</h3>
                  <p className="text-sm opacity-90">
                    GPT · Gemini · Perplexity 종합 분석
                  </p>
                </div>

                <div className="p-6 space-y-8">
                  <div>{renderMarkdown(firstSection)}</div>

                  {secondSection && (
                    <>
                      <div className="border-t border-dashed my-8" />
                      <div>{renderMarkdown(secondSection)}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Button */}
      {!isLoading && !error && (
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent p-6">
          <div className="max-w-3xl mx-auto">
            <Button
              onClick={handleNextClick}
              className="w-full h-14 bg-aiq-green text-white font-bold rounded-2xl"
            >
              다음 단계로
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
