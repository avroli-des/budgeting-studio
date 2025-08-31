
import React from 'react';
import { AchievementWithStatus } from '../../types';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { TrophyIcon, LockClosedIcon } from '@heroicons/react/24/solid';

interface AchievementsHighlightProps {
  achievements: AchievementWithStatus[];
  onViewAll: () => void;
}

const MiniAchievementCard: React.FC<{ ach: AchievementWithStatus }> = ({ ach }) => {
    const isUnlocked = ach.status === 'completed';
    
    const rarityBorder = {
        bronze: 'border-amber-500/50',
        silver: 'border-slate-400/50',
        gold: 'border-yellow-400/50',
        platinum: 'border-indigo-500/50',
    };
    const rarityBg = {
        bronze: 'bg-amber-100/50',
        silver: 'bg-slate-200/50',
        gold: 'bg-yellow-100/50',
        platinum: 'bg-indigo-100/50',
    };
     const rarityIcon = {
        bronze: 'text-amber-600',
        silver: 'text-slate-500',
        gold: 'text-yellow-500',
        platinum: 'text-indigo-600',
    };

    return (
        <div className={`p-3 rounded-lg flex items-center gap-3 border ${isUnlocked ? rarityBorder[ach.rarity] : 'border-slate-200'} ${isUnlocked ? rarityBg[ach.rarity] : 'bg-slate-50'}`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUnlocked ? 'bg-white' : 'bg-slate-200'}`}>
                {isUnlocked ? <ach.icon className={`w-6 h-6 ${rarityIcon[ach.rarity]}`} /> : <LockClosedIcon className="w-6 h-6 text-slate-400" />}
            </div>
            <div className="min-w-0">
                <p className="font-bold text-sm text-slate-800 truncate">{ach.name}</p>
                {isUnlocked && ach.unlockedDate ? (
                     <p className="text-xs text-slate-500">
                        Розблоковано: {format(new Date(ach.unlockedDate), 'd MMM yyyy', { locale: uk })}
                    </p>
                ) : (
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-full bg-slate-200 rounded-full h-1.5 flex-grow">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${ach.progress * 100}%`}}></div>
                        </div>
                        <span className="text-xs font-mono text-slate-500">{Math.floor(ach.progress * 100)}%</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const AchievementsHighlight: React.FC<AchievementsHighlightProps> = ({ achievements, onViewAll }) => {
  
  const highlights = React.useMemo(() => {
    const unlocked = achievements
        .filter(a => a.status === 'completed')
        .sort((a,b) => new Date(b.unlockedDate!).getTime() - new Date(a.unlockedDate!).getTime());
        
    const inProgress = achievements
        .filter(a => a.status === 'in-progress')
        .sort((a,b) => b.progress - a.progress);

    return [...unlocked, ...inProgress].slice(0, 3);
  }, [achievements]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrophyIcon className="w-7 h-7 text-amber-500" />
            Досягнення
        </h2>
        <button onClick={onViewAll} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
          Переглянути всі
        </button>
      </div>
      {highlights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {highlights.map(ach => <MiniAchievementCard key={ach.id} ach={ach} />)}
        </div>
      ) : (
        <p className="text-center text-slate-500 py-4">
            Почніть відстежувати свої доходи, щоб розблокувати досягнення!
        </p>
      )}
    </div>
  );
};

export default AchievementsHighlight;