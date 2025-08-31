

import React, { useState, useEffect, useRef } from 'react';
import { IncomeSource } from '../types';
import { formatDisplayAmount } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from './icons';
import { INCOME_SOURCE_CATEGORIES } from '../constants';

interface IncomeMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

const IncomeMenu: React.FC<IncomeMenuProps> = ({ onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} 
                className="p-1 rounded-full text-slate-400 hover:bg-slate-200/50 hover:text-slate-600"
                aria-label="Меню джерела доходу"
            >
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                        <button
                            onClick={() => { onEdit(); setIsOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            <PencilIcon className="w-4 h-4 text-slate-500" />
                            <span>Редагувати</span>
                        </button>
                        <button
                            onClick={() => { onDelete(); setIsOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                            <TrashIcon className="w-4 h-4 text-red-500" />
                            <span>Видалити</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


interface IncomeSourceCardProps {
    source: IncomeSource;
    earnedThisMonth: number;
    earnedAllTime: number;
    goalAmount?: number;
    onEdit: () => void;
    onDelete: () => void;
}

const IncomeSourceCard: React.FC<IncomeSourceCardProps> = ({ source, earnedThisMonth, earnedAllTime, goalAmount = 0, onEdit, onDelete }) => {
    const { currency, rates, settings } = useCurrency();
    const { name, category, expectedAmount } = source;
    
    const categoryInfo = INCOME_SOURCE_CATEGORIES.find(c => c.value === category) || INCOME_SOURCE_CATEGORIES.find(c => c.value === 'other')!;
    const IconComponent = categoryInfo.icon;
    
    const expectedProgress = expectedAmount > 0 ? Math.min((earnedThisMonth / expectedAmount) * 100, 100) : 0;
    const goalProgress = goalAmount > 0 ? Math.min((earnedThisMonth / goalAmount) * 100, 100) : 0;

    return (
        <div className="relative bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between min-h-[260px]">
            <div className="absolute top-2 right-2">
                <IncomeMenu onEdit={onEdit} onDelete={onDelete} />
            </div>
            
            <div>
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-slate-100">
                        <IconComponent className={`w-7 h-7 ${categoryInfo.color.split(' ')[1]}`} />
                    </div>
                    <div className="flex-grow min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 truncate pr-8">{name}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryInfo.color}`}>
                            {categoryInfo.label}
                        </span>
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-slate-500">За місяць</span>
                        <span className="font-semibold text-green-600 font-mono">{formatDisplayAmount({ amountInUah: earnedThisMonth, targetCurrency: currency, rates, settings })}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-slate-500">За весь час</span>
                        <span className="font-semibold text-slate-700 font-mono">{formatDisplayAmount({ amountInUah: earnedAllTime, targetCurrency: currency, rates, settings })}</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-5 space-y-2">
                {goalAmount > 0 && (
                     <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium text-slate-600">Прогрес до цілі</span>
                            <span className="text-xs font-medium text-slate-600">{goalProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div 
                                className="h-2.5 rounded-full transition-all duration-500 bg-blue-500"
                                style={{ width: `${goalProgress}%` }}
                                title={`${formatDisplayAmount({ amountInUah: earnedThisMonth, targetCurrency: currency, rates, settings, simple: true })} / ${formatDisplayAmount({ amountInUah: goalAmount, targetCurrency: currency, rates, settings, simple: true })}`}
                            ></div>
                        </div>
                    </div>
                )}
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-slate-600">Від очікуваного</span>
                        <span className="text-xs font-medium text-slate-600">{expectedProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div 
                            className="h-2.5 rounded-full transition-all duration-500 bg-emerald-500"
                            style={{ width: `${expectedProgress}%` }}
                            title={`${formatDisplayAmount({ amountInUah: earnedThisMonth, targetCurrency: currency, rates, settings, simple: true })} / ${formatDisplayAmount({ amountInUah: expectedAmount, targetCurrency: currency, rates, settings, simple: true })}`}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomeSourceCard;