'use client';

import { useCallback, useEffect, useRef, useState } from "react";

const ASCII_CHARS = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@";
const CHAR_PIXEL_ASPECT = 0.55; // 誤差を補正して縦横比を整える
const DEFAULT_COLUMNS = 96;

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationRef = useRef<number>();
  const columnsRef = useRef(DEFAULT_COLUMNS);
  const lastFrameRef = useRef(0);

  const [asciiFrame, setAsciiFrame] = useState("");
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [status, setStatus] = useState<"initial" | "pending" | "capturing" | "error">("initial");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  useEffect(() => {
    if (canvasRef.current && !ctxRef.current) {
      ctxRef.current = canvasRef.current.getContext("2d", { willReadFrequently: true });
    }
  }, []);

  const renderAsciiFrame = useCallback(() => {
    const video = videoRef.current;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;

    if (!video || !ctx || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    const now = performance.now();
    if (now - lastFrameRef.current < 80) {
      return;
    }
    lastFrameRef.current = now;

    const targetWidth = Math.max(40, Math.min(columnsRef.current, 160));
    const aspectRatio =
      video.videoWidth > 0 && video.videoHeight > 0 ? video.videoWidth / video.videoHeight : 4 / 3;
    const targetHeight = Math.max(20, Math.round((targetWidth / aspectRatio) * CHAR_PIXEL_ASPECT));

    if (canvas.width !== targetWidth) {
      canvas.width = targetWidth;
    }
    if (canvas.height !== targetHeight) {
      canvas.height = targetHeight;
    }

    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imageData.data;

    let ascii = "";
    for (let y = 0; y < targetHeight; y += 1) {
      let row = "";
      for (let x = 0; x < targetWidth; x += 1) {
        const offset = (y * targetWidth + x) * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const normalized = Math.max(0, Math.min(1, luminance / 255));
        const index = Math.min(
          ASCII_CHARS.length - 1,
          Math.floor((1 - normalized) * (ASCII_CHARS.length - 1))
        );
        row += ASCII_CHARS[index];
      }
      ascii += row + "\n";
    }

    setAsciiFrame(ascii);
  }, []);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;

    const ensureContext = () => {
      if (!canvasRef.current) return;
      if (!ctxRef.current) {
        ctxRef.current = canvasRef.current.getContext("2d", { willReadFrequently: true });
      }
    };

    const startLoop = () => {
      if (!active) return;
      const step = () => {
        if (!active) return;
        renderAsciiFrame();
        animationRef.current = window.requestAnimationFrame(step);
      };
      animationRef.current = window.requestAnimationFrame(step);
    };

    const requestCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setErrorMessage("このブラウザーはカメラへのアクセスをサポートしていません。");
        return;
      }

      try {
        setStatus("pending");
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 960 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        const video = videoRef.current;
        if (!video) {
          return;
        }

        ensureContext();
        video.srcObject = stream;
        await video.play();
        setStatus("capturing");
        startLoop();
      } catch (error) {
        if (!active) {
          return;
        }
        setStatus("error");
        if (error instanceof DOMException && error.name === "NotAllowedError") {
          setErrorMessage("カメラのアクセスが拒否されています。ブラウザー設定を確認してください。");
        } else if (error instanceof DOMException && error.name === "NotFoundError") {
          setErrorMessage("利用可能なカメラが見つかりません。デバイスを確認してください。");
        } else {
          setErrorMessage("カメラの初期化中に問題が発生しました。ページを再読み込みしてください。");
        }
      }
    };

    requestCamera();

    return () => {
      active = false;
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [renderAsciiFrame]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-black px-4 py-10 text-lime-200">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-lime-100 sm:text-4xl">
          Live ASCII Camera
        </h1>
        <p className="max-w-xl text-sm text-lime-300/80 sm:text-base">
          PCやスマートフォンのフロントカメラにアクセスし、映像をリアルタイムでASCIIアートとして表示します。
          カメラの使用許可を求められたら承認してください。
        </p>
      </header>

      <main className="mt-10 flex w-full max-w-5xl flex-1 flex-col items-stretch gap-8">
        <section className="flex flex-col gap-4 rounded-xl border border-lime-500/40 bg-lime-950/10 p-6 shadow-lg">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-medium text-lime-100 sm:text-base">
              表示列数: <span className="font-semibold">{columns} 列</span>
            </label>
            <input
              type="range"
              min={40}
              max={160}
              step={8}
              value={columns}
              onChange={(event) => setColumns(Number(event.target.value))}
              className="w-full cursor-pointer accent-lime-400 sm:w-64"
              aria-label="ASCIIアートの横方向の分解能調整"
            />
          </div>
          <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-lime-500/30 bg-black/70">
            <pre
              className="h-full w-full overflow-hidden whitespace-pre font-mono text-[10px] leading-[0.62rem] text-lime-200 sm:text-xs sm:leading-[0.68rem]"
              aria-live="polite"
            >
              {asciiFrame || (status === "error" ? "" : "カメラの映像を待機中…")}
            </pre>
            {status === "error" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center text-sm text-red-300 sm:text-base">
                {errorMessage}
              </div>
            )}
          </div>
          <p className="text-xs text-lime-300/80 sm:text-sm">
            表示が粗い場合は列数スライダーを増やしてください。描画はCPU処理のため、列数を増やすとパフォーマンスが低下する可能性があります。
          </p>
        </section>

        <section className="rounded-xl border border-lime-500/20 bg-lime-950/5 p-6 text-sm text-lime-300/80 sm:text-base">
          <h2 className="mb-2 text-lg font-semibold text-lime-100 sm:text-xl">ヒント</h2>
          <ul className="space-y-2">
            <li>・iOSやAndroidでは、ページをHTTPSで提供するとフロントカメラへのアクセスが安定します。</li>
            <li>・暗い場所では高コントラストなASCIIアートになりにくいため、適度に照明を確保してください。</li>
            <li>・ブラウザー設定でカメラ権限を拒否している場合は、再度許可してください。</li>
          </ul>
        </section>
      </main>

      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
