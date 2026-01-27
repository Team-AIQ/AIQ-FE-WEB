"use client";
import { Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "@/pages/register";
import QuestionPage from "@/pages/question";
import AnswerPage from "@/pages/answer";
import ReportPage from "@/pages/report";
import FeedbackPage from "@/pages/feedback";
import ThankYouPage from "@/pages/thank-you";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<RegisterPage />} />
      <Route path="/question" element={<QuestionPage />} />
      <Route path="/answer" element={<AnswerPage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/thank-you" element={<ThankYouPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
