'use client';

import { useLayoutEffect, useMemo, useRef } from "react";

import type { CaptureStatus } from "../hooks/useAsciiCamera";
import { MAX_COLUMNS, MIN_COLUMNS } from "../lib/ascii";

type Props = {
  asciiFrame: string;
  status: CaptureStatus;
  errorMessage: string;
  columns: number;
  onCharCellSizeChange: (width: number, height: number) => void;
};

const MIN_FONT_SIZE = 6;
const MAX_FONT_SIZE = 12;
const LINE_HEIGHT_RATIO = 0.62;
const MEASURE_SAMPLE = "MMMMMMMMMM";

function calculateSizing(columns: number) {
  const clamped = Math.max(MIN_COLUMNS, Math.min(columns, MAX_COLUMNS));
  const range = MAX_COLUMNS - MIN_COLUMNS || 1;
  const normalized = (clamped - MIN_COLUMNS) / range;
  const fontSize = MAX_FONT_SIZE - normalized * (MAX_FONT_SIZE - MIN_FONT_SIZE);
  const lineHeight = fontSize * LINE_HEIGHT_RATIO;

  return {
    fontSize,
    lineHeight,
    style: {
      fontSize: `${fontSize.toFixed(2)}px`,
      lineHeight: `${lineHeight.toFixed(2)}px`,
    },
  };
}

export function AsciiDisplay({
  asciiFrame,
  status,
  errorMessage,
  columns,
  onCharCellSizeChange,
}: Props) {
  const hasError = status === "error";
  const isEmpty = !asciiFrame && !hasError;
  const sizing = useMemo(() => calculateSizing(columns), [columns]);
  const measureRef = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const span = measureRef.current;
    if (!span) return;
    const rect = span.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    onCharCellSizeChange(rect.width / MEASURE_SAMPLE.length, rect.height);
  }, [onCharCellSizeChange, sizing.fontSize, sizing.lineHeight]);

  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-lime-500/30 bg-black/70">
      <pre
        className="relative h-full w-full overflow-hidden whitespace-pre font-mono text-lime-200"
        aria-live="polite"
        style={sizing.style}
      >
        <span
          ref={measureRef}
          aria-hidden="true"
          className="pointer-events-none absolute select-none opacity-0"
        >
          {MEASURE_SAMPLE}
        </span>
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
