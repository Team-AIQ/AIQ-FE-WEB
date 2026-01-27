"use client";
import { Suspense } from "react";
import ReportPage from "@/components/pages/report";

export const dynamic = "force-dynamic";

export default function Report() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportPage />
    </Suspense>
  );
}
