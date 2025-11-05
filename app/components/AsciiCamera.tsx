'use client';

import { AsciiControls } from "./AsciiControls";
import { AsciiDisplay } from "./AsciiDisplay";
import { AsciiTips } from "./AsciiTips";
import { useAsciiCamera } from "../hooks/useAsciiCamera";

export function AsciiCamera() {
  const {
    asciiFrame,
    columns,
    status,
    errorMessage,
    setColumns,
    updateCharCellSize,
    rows,
    videoRef,
    canvasRef,
  } = useAsciiCamera();

  return (
    <>
      <section className="flex w-full flex-col gap-4 rounded-xl border border-lime-500/40 bg-lime-950/10 p-6 shadow-lg">
        <AsciiControls columns={columns} onColumnsChange={setColumns} />
        <AsciiDisplay
          asciiFrame={asciiFrame}
          status={status}
          errorMessage={errorMessage}
          columns={columns}
          rows={rows}
          onCharCellSizeChange={updateCharCellSize}
        />
        <p className="text-xs text-lime-300/80 sm:text-sm">
          表示が粗い場合は列数スライダーを増やしてください。描画はCPU処理のため、列数を増やすとパフォーマンスが低下する可能性があります。
        </p>
      </section>

      <AsciiTips />

      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}
