'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { CaptureStatus } from "../hooks/useAsciiCamera";
import { MAX_COLUMNS, MIN_COLUMNS } from "../lib/ascii";

type Props = {
  asciiFrame: string;
  status: CaptureStatus;
  errorMessage: string;
  columns: number;
  rows: number;
  onCharCellSizeChange: (width: number, height: number) => void;
};

type Size = { width: number; height: number };

const BASE_FONT_SIZE = 64;
const MEASURE_SAMPLE = "MMMMMMMMMM";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function AsciiDisplay({
  asciiFrame,
  status,
  errorMessage,
  columns,
  rows,
  onCharCellSizeChange,
}: Props) {
  const hasError = status === "error";
  const isEmpty = !asciiFrame && !hasError;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);

  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  });
  const [charBaseMetrics, setCharBaseMetrics] = useState<Size>({
    width: 8,
    height: 12,
  });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => updateSize());
      observer.observe(container);
      return () => observer.disconnect();
    }

    return () => undefined;
  }, []);

  useLayoutEffect(() => {
    const span = measureRef.current;
    if (!span) return;
    const rect = span.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    setCharBaseMetrics({
      width: rect.width / MEASURE_SAMPLE.length,
      height: rect.height,
    });
  }, []);

  const metrics = useMemo(() => {
    const clampedColumns = clamp(columns, MIN_COLUMNS, MAX_COLUMNS);
    const clampedRows = Math.max(1, rows);

    const charWidth = charBaseMetrics.width || 1;
    const charHeight = charBaseMetrics.height || 1;
    const availableWidth = containerSize.width || 1;
    const availableHeight = containerSize.height || 1;

    const horizontalScale = availableWidth / (clampedColumns * charWidth);
    const verticalScale = availableHeight / (clampedRows * charHeight);
    const scale = clamp(Math.min(horizontalScale, verticalScale), 0.05, 4);

    const fontSize = BASE_FONT_SIZE * scale;
    const lineHeight = charHeight * scale;
    const renderedCharWidth = charWidth * scale;

    return {
      fontSize,
      lineHeight,
      renderedCharWidth,
      charHeight: lineHeight,
      style: {
        fontSize: `${fontSize}px`,
        lineHeight: `${lineHeight}px`,
      },
    };
  }, [charBaseMetrics, columns, containerSize, rows]);

  useEffect(() => {
    if (!Number.isFinite(metrics.renderedCharWidth) || metrics.renderedCharWidth <= 0) {
      return;
    }
    if (!Number.isFinite(metrics.charHeight) || metrics.charHeight <= 0) {
      return;
    }
    onCharCellSizeChange(metrics.renderedCharWidth, metrics.charHeight);
  }, [metrics.renderedCharWidth, metrics.charHeight, onCharCellSizeChange]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg border border-lime-500/30 bg-black/70"
      style={{ minHeight: "clamp(320px, 65vw, 720px)" }}
    >
      <pre
        className="relative h-full w-full overflow-hidden whitespace-pre font-mono text-lime-200"
        aria-live="polite"
        style={metrics.style}
      >
        <span
          ref={measureRef}
          aria-hidden="true"
          className="pointer-events-none absolute select-none opacity-0"
          style={{
            fontSize: `${BASE_FONT_SIZE}px`,
            lineHeight: `${BASE_FONT_SIZE}px`,
            whiteSpace: "nowrap",
          }}
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
