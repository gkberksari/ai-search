"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import Image from "next/image";
import { useState } from "react";

interface ResumePreviewProps {
  resumeUrl: string;
  resumeName: string;
}

export function ResumePreview({ resumeUrl, resumeName }: ResumePreviewProps) {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeError = () => {
    setIsError(true);
    setIsLoading(false);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <HoverCard openDelay={100} closeDelay={200}>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer">
          <Image
            src="/icons/icon-pdf-2.svg"
            alt={resumeName}
            className="w-5 h-5 object-cover"
            width={20}
            height={20}
          />
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-[640px] h-[660px] p-0">
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 overflow-hidden relative">
            {isLoading && !isError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-sm text-gray-600">Loading preview...</p>
              </div>
            )}

            {isError ? (
              <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
                <Image
                  src="/icons/icon-pdf-2.svg"
                  alt="PDF"
                  width={48}
                  height={48}
                  className="mb-4"
                />
                <p className="text-sm text-gray-600 mb-2">
                  Preview not available
                </p>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Click to open PDF
                </a>
              </div>
            ) : (
              <iframe
                src={`${resumeUrl}#toolbar=0`}
                className="w-full h-full"
                title={resumeName}
                onError={handleIframeError}
                onLoad={handleIframeLoad}
              />
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
