
import React, { useEffect, useState } from 'react';
import { Achievement } from '../../types';
import { TrophyIcon, XMarkIcon } from '../icons';

interface AchievementToastProps {
  queue: Achievement[];
  onDismiss: (id: string) => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ queue, onDismiss }) => {
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (queue.length > 0 && !current) {
      const next = queue[0];
      setCurrent(next);
      setIsVisible(true);

      const showTimer = setTimeout(() => {
        setIsVisible(false);
      }, 5000); // Show for 5 seconds

      const dismissTimer = setTimeout(() => {
        onDismiss(next.id);
        setCurrent(null);
      }, 5500); // Dismiss after fade out

      return () => {
        clearTimeout(showTimer);
        clearTimeout(dismissTimer);
      };
    }
  }, [queue, current, onDismiss]);

  if (!current) {
    return null;
  }
  
  const rarityColors = {
    bronze: 'from-amber-500 to-yellow-600',
    silver: 'from-slate-400 to-slate-500',
    gold: 'from-yellow-400 to-amber-500',
    platinum: 'from-indigo-400 to-purple-500',
  };

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm p-4 rounded-xl shadow-2xl bg-gradient-to-br text-white transition-all duration-500 ease-in-out ${rarityColors[current.rarity]} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <TrophyIcon className="w-8 h-8" />
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-bold">Досягнення розблоковано!</p>
          <p className="mt-1 text-sm font-semibold">{current.name}</p>
        </div>
        <div className="ml-4 flex flex-shrink-0">
          <button
            type="button"
            className="inline-flex rounded-md bg-white/20 p-1.5 text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setIsVisible(false)}
          >
            <span className="sr-only">Закрити</span>
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementToast;
