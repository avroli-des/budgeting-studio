
import React, { useState, useMemo } from 'react';
import { AchievementCategory, AchievementWithStatus } from '../../types';
import AchievementCard from './AchievementCard';
import { XMarkIcon, MagnifyingGlassIcon } from '../icons';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: AchievementWithStatus[];
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose, achievements }) => {
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState<'all' | 'completed' | 'in-progress' | 'locked'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories: { key: AchievementCategory | 'all', label: string }[] = [
      { key: 'all', label: 'Всі' },
      { key: 'milestone', label: 'Віхи' },
      { key: 'consistency', label: 'Стабільність' },
      { key: 'growth', label: 'Зростання' },
      { key: 'special', label: 'Спеціальні' },
  ];
  const statuses: { key: typeof activeStatus, label: string }[] = [
      { key: 'all', label: 'Всі' },
      { key: 'completed', label: 'Завершені' },
      { key: 'in-progress', label: 'В процесі' },
      { key: 'locked', label: 'Заблоковані' },
  ];

  const filteredAchievements = useMemo(() => {
    return achievements.filter(ach => {
      const categoryMatch = activeCategory === 'all' || ach.category === activeCategory;
      const statusMatch = activeStatus === 'all' || ach.status === activeStatus;
      const searchMatch = searchTerm === '' || 
                          ach.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ach.description.toLowerCase().includes(searchTerm.toLowerCase());
      return categoryMatch && statusMatch && searchMatch;
    });
  }, [achievements, activeCategory, activeStatus, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden modal-enter" 
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Усі досягнення</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200">
            <XMarkIcon className="w-6 h-6"/>
          </button>
        </header>

        <div className="p-4 space-y-4 flex-shrink-0 border-b border-slate-200">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                        type="search"
                        placeholder="Пошук досягнень..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-0 py-2 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                    />
                </div>
                 <div className="flex-shrink-0">
                    <select
                        value={activeStatus}
                        onChange={(e) => setActiveStatus(e.target.value as typeof activeStatus)}
                        className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
                    >
                        {statuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                 </div>
            </div>
            {/* Category Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                    {categories.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            className={`${cat.key === activeCategory ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                                whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </nav>
            </div>
        </div>

        <div className="p-4 sm:p-6 flex-grow overflow-y-auto bg-slate-50/50">
            {filteredAchievements.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredAchievements.map(ach => (
                        <AchievementCard key={ach.id} achievement={ach} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                    <p className="font-semibold">Нічого не знайдено</p>
                    <p className="text-sm">Спробуйте змінити фільтри або пошуковий запит.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AchievementsModal;