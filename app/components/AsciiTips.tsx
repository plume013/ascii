'use client';

export function AsciiTips() {
  return (
    <section className="rounded-xl border border-lime-500/20 bg-lime-950/5 p-6 text-sm text-lime-300/80 sm:text-base">
      <h2 className="mb-2 text-lg font-semibold text-lime-100 sm:text-xl">ヒント</h2>
      <ul className="space-y-2">
        <li>・iOSやAndroidでは、ページをHTTPSで提供するとフロントカメラへのアクセスが安定します。</li>
        <li>・暗い場所では高コントラストなASCIIアートになりにくいため、適度に照明を確保してください。</li>
        <li>・ブラウザー設定でカメラ権限を拒否している場合は、再度許可してください。</li>
      </ul>
    </section>
  );
}
