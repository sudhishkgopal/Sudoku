import { DIGITS } from "../engine/constants";

interface Props {
  onNumber: (num: number) => void;
  onErase: () => void;
}

export default function NumberPad({ onNumber, onErase }: Props) {
  return (
    <div className="mt-4 grid grid-cols-5 gap-2" style={{ width: 'min(95vw, 450px)' }}>
      {DIGITS.map(n => (
        <button
          key={n}
          onClick={() => onNumber(n)}
          className="aspect-square bg-gray-700 hover:bg-gray-600 active:bg-blue-700 rounded-lg text-xl font-bold text-white touch-manipulation"
        >
          {n}
        </button>
      ))}
      <button
        onClick={onErase}
        className="aspect-square bg-gray-700 hover:bg-gray-600 active:bg-red-700 rounded-lg text-sm font-bold text-gray-300 touch-manipulation"
      >
        ✕
      </button>
    </div>
  );
}