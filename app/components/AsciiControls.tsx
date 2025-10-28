'use client';

type Props = {
  columns: number;
  onColumnsChange: (value: number) => void;
};

export function AsciiControls({ columns, onColumnsChange }: Props) {
  return (
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
        onChange={(event) => onColumnsChange(Number(event.target.value))}
        className="w-full cursor-pointer accent-lime-400 sm:w-64"
        aria-label="ASCIIアートの横方向の分解能調整"
      />
    </div>
  );
}
