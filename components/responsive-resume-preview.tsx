"use client";

import { useEffect, useState } from "react";
import { ResumePreview } from "./resume-preview";
import { ResumeSheetPreview } from "./resume-sheet-preview";

interface ResponsiveResumePreviewProps {
  resumeUrl: string;
  resumeName: string;
}

export function ResponsiveResumePreview({
  resumeUrl,
  resumeName,
}: ResponsiveResumePreviewProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1440);
    };

    checkIfMobile();

    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  if (isMobile) {
    return <ResumeSheetPreview resumeUrl={resumeUrl} resumeName={resumeName} />;
  }

  return <ResumePreview resumeUrl={resumeUrl} resumeName={resumeName} />;
}
