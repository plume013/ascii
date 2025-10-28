'use client';

import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  CHAR_PIXEL_ASPECT,
  DEFAULT_COLUMNS,
  convertImageDataToAscii,
} from "../lib/ascii";

export type CaptureStatus = "initial" | "pending" | "capturing" | "error";

type UseAsciiCameraResult = {
  asciiFrame: string;
  columns: number;
  status: CaptureStatus;
  errorMessage: string;
  setColumns: (value: number) => void;
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
};

export function useAsciiCamera(): UseAsciiCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationRef = useRef<number>();
  const columnsRef = useRef(DEFAULT_COLUMNS);
  const lastFrameRef = useRef(0);

  const [asciiFrame, setAsciiFrame] = useState("");
  const [columns, setColumnsState] = useState(DEFAULT_COLUMNS);
  const [status, setStatus] = useState<CaptureStatus>("initial");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  useEffect(() => {
    if (canvasRef.current && !ctxRef.current) {
      ctxRef.current = canvasRef.current.getContext("2d", {
        willReadFrequently: true,
      });
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
      video.videoWidth > 0 && video.videoHeight > 0
        ? video.videoWidth / video.videoHeight
        : 4 / 3;
    const targetHeight = Math.max(
      20,
      Math.round((targetWidth / aspectRatio) * CHAR_PIXEL_ASPECT)
    );

    if (canvas.width !== targetWidth) {
      canvas.width = targetWidth;
    }
    if (canvas.height !== targetHeight) {
      canvas.height = targetHeight;
    }

    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -targetWidth, 0, targetWidth, targetHeight);
    ctx.restore();

    const ascii = convertImageDataToAscii(
      ctx.getImageData(0, 0, targetWidth, targetHeight)
    );

    setAsciiFrame(ascii);
  }, []);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;

    const ensureContext = () => {
      if (!canvasRef.current) return;
      if (!ctxRef.current) {
        ctxRef.current = canvasRef.current.getContext("2d", {
          willReadFrequently: true,
        });
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
          setErrorMessage(
            "カメラのアクセスが拒否されています。ブラウザー設定を確認してください。"
          );
        } else if (
          error instanceof DOMException &&
          error.name === "NotFoundError"
        ) {
          setErrorMessage("利用可能なカメラが見つかりません。デバイスを確認してください。");
        } else {
          setErrorMessage(
            "カメラの初期化中に問題が発生しました。ページを再読み込みしてください。"
          );
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

  const setColumns = (value: number) => {
    setColumnsState(value);
  };

  return {
    asciiFrame,
    columns,
    status,
    errorMessage,
    setColumns,
    videoRef,
    canvasRef,
  };
}
