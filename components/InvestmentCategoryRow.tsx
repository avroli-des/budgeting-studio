

import React from 'react';
import { Category } from '../types';
import { formatDisplayAmount } from '../helpers';
import { TrashIcon, TrophyIcon, PencilIcon } from './icons';
import { useCurrency } from '../contexts/CurrencyContext';

interface InvestmentCategoryRowProps {
  investment: Category;
  savedAmount: number;
  onEdit: (investment: Category) => void;
  onDelete: (investment: Category) => void;
}

const InvestmentCategoryRow: React.FC<InvestmentCategoryRowProps> = ({ investment, savedAmount, onEdit, onDelete }) => {
  const { currency, rates, settings } = useCurrency();
  const target = investment.goalTarget || 0;
  const progress = target > 0 ? Math.min((savedAmount / target) * 100, 100) : 0;
  const isCompleted = progress >= 100;

  return (
    <tr className="group hover:bg-slate-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
        <div className="flex items-center gap-2">
            <TrophyIcon className={`w-5 h-5 ${isCompleted ? 'text-green-500' : 'text-amber-500'}`} />
            <span>{investment.name}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-right">
        {formatDisplayAmount({ amountInUah: savedAmount, targetCurrency: currency, rates, settings })} / {formatDisplayAmount({ amountInUah: target, targetCurrency: currency, rates, settings })}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
            <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                    className={`${isCompleted ? 'bg-green-500' : 'bg-purple-600'} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <span className="text-xs font-semibold text-slate-600 w-10 text-right">{progress.toFixed(0)}%</span>
        </div>
      </td>
      <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={() => onEdit(investment)}
                className="text-slate-400 hover:text-blue-500"
                title="Редагувати"
            >
                <PencilIcon className="w-5 h-5"/>
            </button>
            <button 
                onClick={() => onDelete(investment)}
                className="text-slate-400 hover:text-red-500"
                title="Видалити"
            >
                <TrashIcon className="w-5 h-5"/>
            </button>
          </div>
      </td>
    </tr>
  );
};

export default InvestmentCategoryRow;