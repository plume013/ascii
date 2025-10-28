import { AsciiCamera } from "./components/AsciiCamera";

export default function Home() {
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

      <main className="mt-10 flex w-full flex-1 flex-col items-stretch gap-8">
        <AsciiCamera />
      </main>
    </div>
  );
}
