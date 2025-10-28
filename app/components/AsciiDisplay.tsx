'use client';

import type { CaptureStatus } from "../hooks/useAsciiCamera";

type Props = {
  asciiFrame: string;
  status: CaptureStatus;
  errorMessage: string;
};

export function AsciiDisplay({ asciiFrame, status, errorMessage }: Props) {
  const hasError = status === "error";
  const isEmpty = !asciiFrame && !hasError;

  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-lime-500/30 bg-black/70">
      <pre
        className="h-full w-full overflow-hidden whitespace-pre font-mono text-[10px] leading-[0.62rem] text-lime-200 sm:text-xs sm:leading-[0.68rem]"
        aria-live="polite"
      >
        {isEmpty ? "カメラの映像を待機中…" : asciiFrame}
      </pre>
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center text-sm text-red-300 sm:text-base">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
