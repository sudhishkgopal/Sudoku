import { useRegisterSW } from 'virtual:pwa-register/react';

export default function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 shadow-xl text-sm">
      <span className="text-gray-200">New version available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg font-medium touch-manipulation"
      >
        Update
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="text-gray-400 hover:text-gray-200 touch-manipulation"
      >
        ✕
      </button>
    </div>
  );
}
