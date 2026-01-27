"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import axios from "axios"; // 1. api 에러 해결을 위해 axios 임포트

export default function ThankYouPage() {
    const router = useRouter(); // 2. handleRestart 에러 해결을 위한 router 선언
    const [nickname, setNickname] = useState("");
    const isFetched = useRef(false); // 3. useRef 에러 해결 (상단 import 확인 필수)

    // 설문 데이터 상태 (이전 페이지에서 정보를 못 가져올 경우를 대비한 초기값)
    const [stars1, setStars1] = useState(0);
    const [stars2, setStars2] = useState(0);
    const [textFeedback, setTextFeedback] = useState("");

    // axios 인스턴스 설정 (api 에러 해결)
    const api = axios.create({
        baseURL: "http://49.247.139.167:8080",
        headers: { "Content-Type": "application/json" },
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedNickname = sessionStorage.getItem("nickname");
            if (storedNickname) setNickname(storedNickname);

            // 이전 페이지에서 넘어온 데이터가 있다면 세팅
            setStars1(Number(sessionStorage.getItem("stars1") || 0));
            setStars2(Number(sessionStorage.getItem("stars2") || 0));
            setTextFeedback(sessionStorage.getItem("textFeedback") || "");
        }
    }, []);

    // 4. 다시 테스트하기 버튼 함수
    const handleRestart = () => {
        try {
            // sessionStorage.clear(); // 데이터 초기화
            router.push("/question"); // 메인 페이지로 이동
        } catch (error) {
            console.error("Restart Error:", error);
        }
    };

    // 5. 피드백 제출 함수 (요청하신 형식 적용)
    const handleSubmit = async () => {
        if (isFetched.current) return;

        const storedNickname = sessionStorage.getItem("nickname");
        const storedPhoneNumber = sessionStorage.getItem("phonenumber"); // handleNext에서 저장한 키값

        console.log("세션에서 가져온 번호:", storedPhoneNumber);
        if (!storedPhoneNumber) {
            alert("사용자 정보가 없습니다. 처음부터 다시 시도해주세요.");
            return;
        }

        try {
            isFetched.current = true;

            const feedbackData = {
                name: storedNickname,
                phoneNumber: storedPhoneNumber,
                convenienceRating: stars1,
                usageIntentRating: stars2,
                comment: textFeedback
            };

            const response = await api.post("/api/feedback", feedbackData);

            if (response.status === 200 || response.status === 201) {
                alert("피드백이 성공적으로 전달되었습니다!");
                sessionStorage.clear();
            }
        } catch (error) {
            isFetched.current = false;
            console.error("제출 실패:", error);
            alert("전송 중 오류가 발생했습니다.");
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-aiq-green-light via-white to-aiq-gray-light flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* 배경 디자인 UI */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-32 h-32 bg-aiq-green/20 rounded-full blur-3xl animate-pulse-soft" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-aiq-green/15 rounded-full blur-3xl animate-pulse-soft delay-300" />
            </div>

            <div className="relative z-10 w-full max-w-md text-center">
                <div className="flex justify-center mb-6 animate-fade-in">
                    <h1 className="text-4xl font-black text-aiq-green tracking-tight">AIQ</h1>
                </div>

                <div className="flex justify-center mb-8 animate-fade-in-up delay-100">
                    <img src="/images/aiq-character.png" alt="AIQ Character" className="w-36 h-auto object-contain animate-float" />
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-8 border border-aiq-green/20 animate-fade-in-up delay-200">
                    <h2 className="text-2xl font-bold text-aiq-black mb-3">
                        {nickname ? <><span className="text-aiq-green">{nickname}</span>님, </> : ""}감사합니다!
                    </h2>

                    <p className="text-aiq-gray mb-6 leading-relaxed">
                        AIQ MVP 테스터로 참여해주셔서 감사합니다.<br />
                        피드백은 서비스 발전에 큰 도움이 됩니다.
                    </p>

                    <div className="space-y-3">
                        {/* 제출 버튼이 따로 없다면, 여기서 자동으로 handleSubmit을 호출하거나 버튼을 추가해야 합니다 */}
                        <Button
                            onClick={handleRestart}
                            className="w-full h-12 bg-aiq-green hover:bg-aiq-green-dark text-white font-semibold rounded-xl transition-all"
                        >
                            처음으로 돌아가기
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}