import React from 'react';
import { AchievementWithStatus } from '../../types';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface AchievementCardProps {
  achievement: AchievementWithStatus;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const { name, description, icon: Icon, rarity, status, progress, unlockedDate, repeatable, count } = achievement;
  const isUnlocked = status === 'completed';

  const rarityStyles = {
    bronze: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      text: 'text-amber-600',
      tag: 'bg-amber-500 text-white',
    },
    silver: {
      border: 'border-slate-400/30',
      bg: 'bg-slate-400/10',
      text: 'text-slate-500',
      tag: 'bg-slate-500 text-white',
    },
    gold: {
      border: 'border-yellow-400/30',
      bg: 'bg-yellow-400/10',
      text: 'text-yellow-500',
      tag: 'bg-yellow-500 text-white',
    },
    platinum: {
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-600',
      tag: 'bg-indigo-600 text-white',
    },
  };
  
  const styles = rarityStyles[rarity];

  return (
    <div className={`p-5 rounded-xl border flex flex-col transition-all duration-200 ${isUnlocked ? `${styles.bg} ${styles.border}` : 'bg-white border-slate-200'}`}>
        <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${isUnlocked ? 'bg-white' : 'bg-slate-100'}`}>
                {isUnlocked ? <Icon className={`w-7 h-7 ${styles.text}`} /> : <LockClosedIcon className="w-7 h-7 text-slate-400" />}
            </div>
            <div className="min-w-0 flex-grow">
                <h3 className="font-bold text-slate-800 leading-tight">{name}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${isUnlocked ? styles.tag : 'bg-slate-200 text-slate-600'}`}>
                        {rarity}
                    </span>
                    {repeatable && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${count && count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-500'}`}>
                            x{count || 0}
                        </span>
                    )}
                </div>
            </div>
        </div>
        <p className="text-sm text-slate-600 mt-3 flex-grow">{description}</p>
        
        <div className="mt-4">
             {status === 'completed' && unlockedDate && !repeatable ? (
                <p className="text-xs text-center font-medium text-green-700 bg-green-100/80 rounded-full py-1">
                    Розблоковано: {format(new Date(unlockedDate), 'd MMMM yyyy', { locale: uk })}
                </p>
             ) : status !== 'completed' ? (
                <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs font-medium text-slate-500">Прогрес</span>
                        <span className="text-sm font-bold font-mono text-slate-700">{Math.floor(progress * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress * 100}%`}}></div>
                    </div>
                </div>
             ) : null}
        </div>
    </div>
  );
};

export default AchievementCard;