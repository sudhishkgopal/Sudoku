import { DIGITS } from "../engine/constants";

interface Props {
  onNumber: (num: number) => void;
  onErase: () => void;
  remaining: number[];
}

export default function NumberPad({ onNumber, onErase, remaining }: Props) {
  return (
    <div
      className="mt-4 grid grid-cols-5 gap-2"
      style={{ width: "min(95vw, 450px)" }}
    >
      {DIGITS.map((n, i) => (
        <button
          key={n}
          onClick={() => onNumber(n)}
          disabled={remaining[i] === 0}
          className="aspect-square bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-blue-200 dark:active:bg-blue-700 rounded-lg text-xl font-bold text-gray-900 dark:text-white touch-manipulation disabled:opacity-30 disabled:dark:opacity-30 flex flex-col items-center justify-center shadow-sm dark:shadow-none transition-colors duration-200"
        >
          {n}
          {remaining[i] > 0 && (
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 leading-none">
              {remaining[i]}
            </span>
          )}
        </button>
      ))}
      <button
        onClick={onErase}
        className="aspect-square bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-red-200 dark:active:bg-red-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 touch-manipulation shadow-sm dark:shadow-none transition-colors duration-200"
      >
        ✕
      </button>
    </div>
  );
}
