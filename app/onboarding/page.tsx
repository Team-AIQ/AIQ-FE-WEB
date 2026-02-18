"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getUserNickname, setOnboardingDone } from "@/lib/auth";

const INTRO_LINES = [
  "AIQ 사용법을 알려줄게",
  "바로 시작하고 싶으면 하단에 '건너뛰기'를 눌러줘!",
];
const INTRO_TYPEWRITER_SPEED = 50;
const INTRO_START_DELAY = 300;

const AI_MESSAGES = [
  "만나서 반가워 지구인!",
  "나는 AIQ 행성에서 온 Pickle(피클)이라고 해.",
  "지구에는 없는 '워프쇼핑'을 알려주려고 멀리서 날아왔어.",
  "지구인의 '시간'이라는 귀한 자원을 아껴줄 AIQ 방식을 소개해 줄게!",
];
const AI_MESSAGES_STEP2 = [
  "지구인들은 물건 하나 살 때 여러 개의 탭을 띄우고 몇 시간씩 비교한다며?😮",
  "우리 행성에서는 그걸 '선형적 노동'이라고 불러.",
  "검색하고, 대조하고, 망설이는 비효율적인 시간 말이야.",
  "혹시 너도 최근에 뭘 살지 고민하느라 에너지를 낭비한 적 있어?",
];
const AI_MESSAGES_STEP3 = [
  "그 시간을 짧게 압축시켜 주는 게 바로 워프쇼핑이야!⚡",
  "네가 필요한 제품에 대한 질문을 던지면",
  "내가 GPT, Perplexity, Gemini의 답변을 불러 모을거야.",
  "정밀한 분석을 위해 내가 몇가지 질문을 던질 건데, 너는 거기에 답만 하면 끝이야!",
];
const CHOICE_BUTTON_STEP3 = "오, 여러 AI 의견을 한 번에 정리해 주는구나!";
const AI_MESSAGES_STEP4 = [
  "응! 분석이 끝나면 AI들의 합의점과 추천 제품을 담은 리포트를 보낼거야.",
  "이 리포트를 보면 이제 더 이상 망설임 없이 오직 '확신'만 남을 거라고 장담해!",
  "자, 준비됐어? 네 장바구니 속 고민을 나에게 보여줄래?",
];
const CHOICE_BUTTON_STEP4 = "좋아, 바로 시작할게!";
const AI_MESSAGE_DELAY = 450;

const CHOICE_BUTTONS = ["워프쇼핑이 뭐야?", "응! 어서 알려줘"];
const CHOICE_BUTTON_STEP2 = "있어, 비교하는 게 너무 귀찮고 힘들었어.";

function useTypewriter(lines: string[], speed: number, startDelay: number) {
  const [displayText, setDisplayText] = useState<React.ReactNode[]>([]);
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const charIdRef = useRef(0);
  const fullText = lines.join("\n");

  useEffect(() => {
    const runTypewriter = (idx: number) => {
      if (idx >= fullText.length) {
        setShowCursor(false);
        return;
      }
      const char = fullText[idx];
      const id = charIdRef.current++;
      setDisplayText((prev) => [
        ...prev,
        char === "\n" ? <br key={id} /> : char,
      ]);
      timeoutRef.current = setTimeout(() => runTypewriter(idx + 1), speed);
    };
    const t = setTimeout(() => runTypewriter(0), startDelay);
    return () => {
      clearTimeout(t);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { displayText, showCursor };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("사용자");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [progress, setProgress] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [visibleMessagesStep2, setVisibleMessagesStep2] = useState<number>(0);
  const [visibleMessagesStep3, setVisibleMessagesStep3] = useState<number>(0);
  const [visibleMessagesStep4, setVisibleMessagesStep4] = useState<number>(0);
  const [userMessages, setUserMessages] = useState<string[]>([]);
  const [clickedButtons, setClickedButtons] = useState<Record<number, boolean>>(
    {}
  );
  const [clickedStep2Button, setClickedStep2Button] = useState(false);
  const [clickedStep3Button, setClickedStep3Button] = useState(false);
  const [clickedStep4Button, setClickedStep4Button] = useState(false);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = getUserNickname();
    if (name) setNickname(name);
  }, []);

  // AI 메시지 하나씩 등장 (step 1)
  useEffect(() => {
    if (visibleMessages >= AI_MESSAGES.length) return;
    const t = setTimeout(() => {
      setVisibleMessages((v) => v + 1);
    }, AI_MESSAGE_DELAY);
    return () => clearTimeout(t);
  }, [visibleMessages]);

  // Step 2: AI 메시지 하나씩 등장
  useEffect(() => {
    if (step !== 2 || visibleMessagesStep2 >= AI_MESSAGES_STEP2.length) return;
    const t = setTimeout(() => {
      setVisibleMessagesStep2((v) => v + 1);
    }, AI_MESSAGE_DELAY);
    return () => clearTimeout(t);
  }, [step, visibleMessagesStep2]);

  // Step 3: '있어, 비교하는 게...' 클릭 후 AI 메시지 하나씩 등장
  useEffect(() => {
    if (step !== 3 || visibleMessagesStep3 >= AI_MESSAGES_STEP3.length) return;
    const t = setTimeout(() => {
      setVisibleMessagesStep3((v) => v + 1);
    }, AI_MESSAGE_DELAY);
    return () => clearTimeout(t);
  }, [step, visibleMessagesStep3]);

  // Step 4: '오, 여러 AI 의견을...' 클릭 후 AI 메시지 하나씩 등장
  useEffect(() => {
    if (step !== 4 || visibleMessagesStep4 >= AI_MESSAGES_STEP4.length) return;
    const t = setTimeout(() => {
      setVisibleMessagesStep4((v) => v + 1);
    }, AI_MESSAGE_DELAY);
    return () => clearTimeout(t);
  }, [step, visibleMessagesStep4]);

  const handleChoiceClick = (index: number, text: string) => {
    if (clickedButtons[index]) return;
    setClickedButtons((prev) => ({ ...prev, [index]: true }));
    setUserMessages((prev) => [...prev, text]);
    setProgress(25);
    setStep(2);
  };

  const handleStep2ChoiceClick = () => {
    if (clickedStep2Button) return;
    setClickedStep2Button(true);
    setUserMessages((prev) => [...prev, CHOICE_BUTTON_STEP2]);
    setProgress(50);
    setStep(3);
  };

  const handleStep3ChoiceClick = () => {
    if (clickedStep3Button) return;
    setClickedStep3Button(true);
    setUserMessages((prev) => [...prev, CHOICE_BUTTON_STEP3]);
    setProgress(75);
    setStep(4);
  };

  const handleStep4ChoiceClick = () => {
    if (clickedStep4Button) return;
    setClickedStep4Button(true);
    setUserMessages((prev) => [...prev, CHOICE_BUTTON_STEP4]);
    setProgress(100);
    setOnboardingDone();
    setTimeout(() => {
      router.replace("/chat");
    }, 1500);
  };

  // Step 3 전환 시 채팅이 위로 올라가는 느낌: 부드럽게 맨 아래로 스크롤
  useEffect(() => {
    if (step !== 3) return;
    const container = chatContainerRef.current;
    if (!container) return;
    const timer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      });
    });
    return () => cancelAnimationFrame(timer);
  }, [step]);

  // 새 메시지 추가 시 채팅 영역 맨 아래로 자동 스크롤
  useEffect(() => {
    if (!chatContainerRef.current) return;
    // Step 2에서 버튼 클릭 후 특정 메시지로 스크롤하는 경우는 제외
    if (step === 2 && userMessages.length >= 2) return;
    
    const timer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = chatContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    });
    return () => cancelAnimationFrame(timer);
  }, [visibleMessages, visibleMessagesStep2, visibleMessagesStep3, visibleMessagesStep4, userMessages.length, step]);

  // Step 2에서 버튼 클릭 후 새 사용자 메시지를 상단에 보이도록 스크롤
  useEffect(() => {
    if (step !== 2 || userMessages.length < 2) return;
    const timer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        lastUserMsgRef.current?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      });
    });
    return () => cancelAnimationFrame(timer);
  }, [step, userMessages.length]);

  const handleSkip = () => {
    setOnboardingDone();
    router.replace("/chat");
  };

  return (
    <>
      <div className="login-bg onboarding-bg" role="presentation" />

      <header className="onboarding-header">
        <Link href="/" className="onboarding-logo">
          <img
            src="/image/hero-logo.png"
            alt="AIQ"
            className="onboarding-logo-img"
            onError={(e) => e.currentTarget.parentElement?.classList.add("fallback")}
          />
          <span className="onboarding-logo-fallback">
            <span className="logo-icon">A</span>
            <span className="logo-text">AIQ</span>
          </span>
        </Link>
      </header>

      <div className="onboarding-layout">
        {/* 왼쪽: 타자기 + 캐릭터 + 건너뛰기 */}
        <aside className="onboarding-left">
          <p className="onboarding-intro" aria-live="polite">
            {INTRO_LINES.map((line, idx) => (
              <span key={idx}>
                {line}
                {idx < INTRO_LINES.length - 1 && <br />}
              </span>
            ))}
          </p>
          <div className="onboarding-character-wrap">
            <div className="onboarding-character">
              <img
                src="/image/hero-character.png"
                alt="AIQ 피클"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          </div>
          <button
            type="button"
            className="onboarding-skip-btn"
            onClick={handleSkip}
          >
            <img
              src="/image/skip-alien-icon.png"
              alt=""
              className="onboarding-skip-icon-img"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <span className="onboarding-skip-text">건너뛰기</span>
            <span className="onboarding-skip-arrow"> &gt;</span>
          </button>
        </aside>

        {/* 오른쪽: 유저명 칸 + 채팅 */}
        <section className="onboarding-right">
          <div className="onboarding-right-top">
            <div className="onboarding-user-box">
              <img
                src="/image/user-icon.png"
                alt=""
                className="onboarding-user-icon"
                aria-hidden
              />
              <span className="onboarding-user-name">{nickname}</span>
            </div>

            <div className="onboarding-gauge-wrap">
              <img
                key={progress}
                src={
                  progress === 0
                    ? "/image/onboarding-gauge-0.png"
                    : progress === 25
                      ? "/image/onboarding-gauge-25.png"
                      : progress === 50
                        ? "/image/onboarding-gauge-50.png"
                        : progress === 75
                          ? "/image/onboarding-gauge-75.png"
                          : "/image/onboarding-gauge-100.png"
                }
                alt={`진행률 ${progress}%`}
                className="onboarding-gauge-img"
              />
            </div>
          </div>

          <div className="onboarding-chat-wrap">
            <div className="onboarding-chat-bg" aria-hidden="true" />
            <div ref={chatContainerRef} className="onboarding-chat">
            {/* 전체 채팅 한 흐름: Step 3 전환 시 스크롤만으로 위로 올라가는 느낌 */}
            {AI_MESSAGES.slice(0, visibleMessages).map((msg, i) => (
              <div
                key={i}
                className={`onboarding-msg onboarding-msg--ai${i > 0 ? " onboarding-msg--ai-continuation" : ""}`}
              >
                {i === 0 ? (
                  <div className="onboarding-msg-avatar">
                    <img
                      src="/image/aiq-chat-profile.png"
                      alt="AIQ"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                ) : null}
                <div className="onboarding-msg-bubble">{msg}</div>
              </div>
            ))}
            {userMessages[0] != null && (
              <div className="onboarding-msg onboarding-msg--user">
                <div className="onboarding-msg-bubble onboarding-msg-bubble--user">
                  {userMessages[0]}
                </div>
              </div>
            )}
            {step >= 2 &&
              AI_MESSAGES_STEP2.slice(0, visibleMessagesStep2).map((msg, i) => (
                <div
                  key={`step2-${i}`}
                  className={`onboarding-msg onboarding-msg--ai${i > 0 ? " onboarding-msg--ai-continuation" : ""}`}
                >
                  {i === 0 ? (
                    <div className="onboarding-msg-avatar">
                      <img
                        src="/image/aiq-chat-profile.png"
                        alt="AIQ"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  ) : null}
                  <div className="onboarding-msg-bubble">{msg}</div>
                </div>
              ))}
            {userMessages[1] != null && (
              <div
                ref={lastUserMsgRef}
                className="onboarding-msg onboarding-msg--user"
              >
                <div className="onboarding-msg-bubble onboarding-msg-bubble--user">
                  {userMessages[1]}
                </div>
              </div>
            )}
            {step >= 3 &&
              AI_MESSAGES_STEP3.slice(0, visibleMessagesStep3).map((msg, i) => (
                <div
                  key={`step3-${i}`}
                  className={`onboarding-msg onboarding-msg--ai${i > 0 ? " onboarding-msg--ai-continuation" : ""}`}
                >
                  {i === 0 ? (
                    <div className="onboarding-msg-avatar">
                      <img
                        src="/image/aiq-chat-profile.png"
                        alt="AIQ"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  ) : null}
                  <div className="onboarding-msg-bubble">{msg}</div>
                </div>
              ))}
            {userMessages[2] != null && (
              <div className="onboarding-msg onboarding-msg--user">
                <div className="onboarding-msg-bubble onboarding-msg-bubble--user">
                  {userMessages[2]}
                </div>
              </div>
            )}
            {step === 4 &&
              AI_MESSAGES_STEP4.slice(0, visibleMessagesStep4).map((msg, i) => (
                <div
                  key={`step4-${i}`}
                  className={`onboarding-msg onboarding-msg--ai${i > 0 ? " onboarding-msg--ai-continuation" : ""}`}
                >
                  {i === 0 ? (
                    <div className="onboarding-msg-avatar">
                      <img
                        src="/image/aiq-chat-profile.png"
                        alt="AIQ"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  ) : null}
                  <div className="onboarding-msg-bubble">{msg}</div>
                </div>
              ))}
            {userMessages[3] != null && (
              <div className="onboarding-msg onboarding-msg--user">
                <div className="onboarding-msg-bubble onboarding-msg-bubble--user">
                  {userMessages[3]}
                </div>
              </div>
            )}
            </div>
          </div>

          <div className="onboarding-choices">
            {step === 1 ? (
              CHOICE_BUTTONS.map((text, i) => {
                const allMessagesVisible = visibleMessages >= AI_MESSAGES.length;
                const isDisabled = clickedButtons[i] || !allMessagesVisible;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`onboarding-choice-btn ${
                      clickedButtons[i] ? "onboarding-choice-btn--clicked" : ""
                    } ${!allMessagesVisible ? "onboarding-choice-btn--waiting" : ""}`}
                    onClick={() => handleChoiceClick(i, text)}
                    disabled={isDisabled}
                  >
                    {text}
                  </button>
                );
              })
            ) : step === 2 ? (() => {
              const allStep2Visible =
                visibleMessagesStep2 >= AI_MESSAGES_STEP2.length;
              const step2Disabled =
                clickedStep2Button || !allStep2Visible;
              return (
                <button
                  type="button"
                  className={`onboarding-choice-btn onboarding-choice-btn--long ${
                    clickedStep2Button ? "onboarding-choice-btn--clicked" : ""
                  } ${!allStep2Visible ? "onboarding-choice-btn--waiting" : ""}`}
                  onClick={handleStep2ChoiceClick}
                  disabled={step2Disabled}
                >
                  {CHOICE_BUTTON_STEP2}
                </button>
              );
            })() : step === 3 ? (() => {
              const allStep3Visible =
                visibleMessagesStep3 >= AI_MESSAGES_STEP3.length;
              const step3Disabled =
                clickedStep3Button || !allStep3Visible;
              return (
                <button
                  type="button"
                  className={`onboarding-choice-btn onboarding-choice-btn--long ${
                    clickedStep3Button ? "onboarding-choice-btn--clicked" : ""
                  } ${!allStep3Visible ? "onboarding-choice-btn--waiting" : ""}`}
                  onClick={handleStep3ChoiceClick}
                  disabled={step3Disabled}
                >
                  {CHOICE_BUTTON_STEP3}
                </button>
              );
            })() : (() => {
              const allStep4Visible =
                visibleMessagesStep4 >= AI_MESSAGES_STEP4.length;
              const step4Disabled =
                clickedStep4Button || !allStep4Visible;
              return (
                <button
                  type="button"
                  className={`onboarding-choice-btn onboarding-choice-btn--long ${
                    clickedStep4Button ? "onboarding-choice-btn--clicked" : ""
                  } ${!allStep4Visible ? "onboarding-choice-btn--waiting" : ""}`}
                  onClick={handleStep4ChoiceClick}
                  disabled={step4Disabled}
                >
                  {CHOICE_BUTTON_STEP4}
                </button>
              );
            })()}
          </div>
        </section>
      </div>
    </>
  );
}
