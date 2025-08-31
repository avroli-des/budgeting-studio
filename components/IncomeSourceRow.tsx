

import React, { useState, useEffect, useRef } from 'react';
import { IncomeSource } from '../types';
import { formatDisplayAmount } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from './icons';

interface IncomeSourceMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

const IncomeSourceMenu: React.FC<IncomeSourceMenuProps> = ({ onEdit, onDelete }) => {
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
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700"
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

interface IncomeSourceRowProps {
    source: IncomeSource;
    receivedAmount: number;
    onEdit: () => void;
    onDelete: () => void;
}

const IncomeSourceRow: React.FC<IncomeSourceRowProps> = ({ source, receivedAmount, onEdit, onDelete }) => {
    const { currency, rates, settings } = useCurrency();
    const { name, expectedAmount } = source;
    const progress = expectedAmount > 0 ? Math.min((receivedAmount / expectedAmount) * 100, 100) : 0;

    return (
        <div className="bg-white/60 p-3 rounded-lg border border-green-200/80">
            <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-800">{name}</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">
                        {formatDisplayAmount({ amountInUah: receivedAmount, targetCurrency: currency, rates, settings })} / {formatDisplayAmount({ amountInUah: expectedAmount, targetCurrency: currency, rates, settings })}
                    </span>
                    <IncomeSourceMenu onEdit={onEdit} onDelete={onDelete} />
                </div>
            </div>
            <div className="w-full bg-green-200/70 rounded-full h-2.5">
                <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${progress}%` }}
                    title={`${progress.toFixed(0)}% отримано`}
                ></div>
            </div>
        </div>
    );
};

export default IncomeSourceRow;