"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [phonenumber, setPhonenumber] = useState("");
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [errors, setErrors] = useState<{
    nickname?: string;
    checkbox?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { nickname?: string; checkbox?: string } = {};

    if (!nickname.trim()) {
      newErrors.nickname = "이름을 입력해주세요";
    }

    if (!check1 || !check2) {
      newErrors.checkbox = "위의 해당사항을 충족해야 참여할 수 있습니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("nickname", nickname);
        sessionStorage.setItem(
          "phonenumber",
          phonenumber.replace(/-/g, "") || ""
        );
      }
      router.push("/question");
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7)
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhonenumber(formatted);
  };

  return (
    <main className="h-full w-full flex items-center justify-center relative">
      <div className="register-scale">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-aiq-green/10 rounded-full blur-2xl animate-pulse-soft" />
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-aiq-green/10 rounded-full blur-3xl animate-pulse-soft delay-300" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="flex justify-center mb-6 animate-fade-in">
            <h1 className="text-5xl font-black text-aiq-green tracking-tight">
              AIQ
            </h1>
          </div>

          <div className="flex justify-center mb-8 animate-fade-in-up delay-100">
            <img
              src="/images/aiq-character.png"
              alt="AIQ Character"
              className="w-36 h-auto object-contain drop-shadow-lg animate-float"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-border animate-fade-in-up delay-200">
            <h1 className="text-2xl font-bold text-center text-aiq-black mb-2">
              MVP 테스터 모집
            </h1>
            <p className="text-aiq-gray text-center mb-6">
              AIQ의 첫 번째 테스터가 되어주세요!
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="nickname"
                  className="text-aiq-black font-medium"
                >
                  이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="홍길동"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className={`h-12 rounded-xl border-2 transition-all duration-300 focus:border-aiq-green focus:ring-aiq-green ${
                    errors.nickname ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.nickname && (
                  <p className="text-sm text-destructive animate-fade-in">
                    {errors.nickname}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phonenumber"
                  className="text-aiq-black font-medium"
                >
                  전화번호{" "}
                  <span className="text-aiq-gray text-sm font-normal">
                    (선택)
                  </span>
                </Label>
                <Input
                  id="phonenumber"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={phonenumber}
                  onChange={handlePhoneChange}
                  className="h-12 rounded-xl border-2 transition-all duration-300 focus:border-aiq-green focus:ring-aiq-green border-border"
                />
                <div className="bg-aiq-green-light/50 rounded-lg p-3 mt-2">
                  <p className="text-xs text-aiq-green-dark leading-relaxed">
                    <span className="font-semibold">
                      * 추첨을 통해 스타벅스 기프티콘을 제공해 드립니다!🧋
                    </span>
                    <br />
                    이벤트에 참여하실 분은 전화번호를 반드시 작성해 주세요.
                  </p>
                </div>
              </div>

              <div className="space-y-5 pt-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="check1"
                    checked={check1}
                    onCheckedChange={(checked) => setCheck1(checked as boolean)}
                    className="mt-0.5 data-[state=checked]:bg-aiq-green data-[state=checked]:border-aiq-green"
                  />
                  <Label
                    htmlFor="check1"
                    className="text-sm text-aiq-black leading-relaxed cursor-pointer"
                  >
                    최근 2년 내, 중·고가 제품을 2회 이상 구매한 경험이 있나요?
                    <small className="text-gray-600">
                      (ex. 수십만~수백만 원대)
                    </small>
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="check2"
                    checked={check2}
                    onCheckedChange={(checked) => setCheck2(checked as boolean)}
                    className="mt-0.5 data-[state=checked]:bg-aiq-green data-[state=checked]:border-aiq-green"
                  />
                  <Label
                    htmlFor="check2"
                    className="text-sm text-aiq-black leading-relaxed cursor-pointer"
                  >
                    AI 2개 이상으로 쇼핑 비교를 해본 적이 있나요?
                    <small className="block text-gray-600">
                      (ex. GPT · Gemini · Perplexity)
                    </small>
                  </Label>
                </div>

                <p className="text-xs text-aiq-gray mt-4">
                  *위 조건에 부합하신 분만 테스트에 참여해 주세요.
                </p>

                {errors.checkbox && (
                  <p className="text-sm text-destructive animate-fade-in">
                    {errors.checkbox}
                  </p>
                )}
              </div>

              <Button
                onClick={handleNext}
                className="w-full h-12 mt-2 bg-aiq-green hover:bg-aiq-green-dark text-white font-semibold rounded-xl text-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              >
                MVP 테스트 하러가기 →
              </Button>
            </div>

            <p className="text-xs text-aiq-gray text-center mt-4">
              테스터 참여 시 개인정보 수집에 동의하게 됩니다.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
