import React, { useState, useEffect, useRef } from 'react';
import { Category } from '../types';
import { formatCurrency, formatDisplayAmount } from '../helpers';
import { ChartIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from './icons';
import { useCurrency } from '../contexts/CurrencyContext';

interface InvestmentMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

const InvestmentMenu: React.FC<InvestmentMenuProps> = ({ onEdit, onDelete }) => {
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
                onClick={() => setIsOpen(!isOpen)} 
                className="p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                aria-label="Меню інвестиції"
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


interface InvestmentCardProps {
    investment: Category;
    savedAmount: number;
    onEdit: () => void;
    onDelete: () => void;
}

const InvestmentCard: React.FC<InvestmentCardProps> = ({ investment, savedAmount, onEdit, onDelete }) => {
    const { currency, rates, settings } = useCurrency();
    const { name, goalTarget = 0 } = investment;
    const progress = goalTarget > 0 ? Math.min((savedAmount / goalTarget) * 100, 100) : 0;
    const isCompleted = progress >= 100;
    
    const displaySaved = formatDisplayAmount({amountInUah: savedAmount, targetCurrency: currency, rates, settings});
    const displayTarget = formatDisplayAmount({amountInUah: goalTarget, targetCurrency: currency, rates, settings});


    return (
        <div className={`relative bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between ${isCompleted ? 'border-green-400' : ''}`}>
             <div className="absolute top-2 right-2">
                <InvestmentMenu onEdit={onEdit} onDelete={onDelete} />
             </div>
            {isCompleted && (
                <div className="absolute top-0 left-0 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-br-lg">
                    Виконано!
                </div>
            )}
            
            <div>
                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-green-100' : 'bg-purple-100'}`}>
                        <ChartIcon className={`w-7 h-7 ${isCompleted ? 'text-green-600' : 'text-purple-600'}`} />
                    </div>
                    <div className="flex-grow min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 truncate pr-8">{name}</h3>
                    </div>
                </div>

                <div className="mt-5">
                    <p className="text-sm text-slate-500 mb-1">Інвестовано</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-800">{displaySaved}</span>
                        <span className="text-slate-500">з {displayTarget}</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-5">
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-purple-700">Прогрес</span>
                    <span className="text-sm font-medium text-purple-700">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4">
                    <div className="bg-purple-600 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default InvestmentCard;