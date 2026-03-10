interface Props {
  notesMode: boolean;
  onNotesToggle: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isComplete: boolean;
  showGraph: boolean;
  onShowGraphToggle: () => void;
}

export default function Controls({ notesMode, onNotesToggle, onUndo, canUndo, isComplete, showGraph, onShowGraphToggle }: Props) {
  return (
    <div className="flex gap-3 mt-4" style={{ width: 'min(95vw, 450px)' }}>
      <button
        onClick={onNotesToggle}
        className={`flex-1 py-3 rounded-lg font-semibold text-sm touch-manipulation ${
          notesMode ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'
        }`}
      >
        Notes {notesMode ? 'ON' : 'OFF'}
      </button>

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="flex-1 py-3 rounded-lg font-semibold text-sm bg-gray-700 text-gray-300 disabled:opacity-40 touch-manipulation"
      >
        Undo
      </button>

      {isComplete && (
        <button
          onClick={onShowGraphToggle}
          className={`flex-1 py-3 rounded-lg font-semibold text-sm touch-manipulation ${
            showGraph ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          Graph {showGraph ? 'ON' : 'OFF'}
        </button>
      )}
    </div>
  );
}
