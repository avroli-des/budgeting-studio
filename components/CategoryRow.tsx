
import React from 'react';
import { Category } from '../types';
import { getCurrencyClass, formatDisplayAmount } from '../helpers';
import { TrashIcon, PlusCircleIcon } from './icons';
import { useCurrency } from '../contexts/CurrencyContext';

interface CategoryRowProps {
  category: Category;
  activity: number;
  onActivityClick: (categoryId: string, categoryName: string) => void;
  onAddExpenseClick: (categoryId: string) => void;
  onDelete: (categoryId: string, categoryName: string) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ category, activity, onActivityClick, onAddExpenseClick, onDelete }) => {
  const { currency, rates, settings } = useCurrency();
  
  return (
    <tr className="group hover:bg-slate-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
        <div className="flex items-center gap-2">
            <span>{category.name}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-right">
        <div className="flex justify-end items-center space-x-2">
            <button
              onClick={() => onAddExpenseClick(category.id)}
              className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Додати витрату"
            >
              <PlusCircleIcon className="w-5 h-5" />
            </button>
            <span
              className={`cursor-pointer hover:underline ${getCurrencyClass(activity)}`}
              onClick={() => onActivityClick(category.id, category.name)}
              title="Переглянути транзакції"
            >
              {formatDisplayAmount({ amountInUah: activity, targetCurrency: currency, rates, settings })}
            </span>
        </div>
      </td>
      <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button 
            onClick={() => onDelete(category.id, category.name)}
            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Видалити категорію"
          >
              <TrashIcon className="w-5 h-5"/>
          </button>
      </td>
    </tr>
  );
};

export default CategoryRow;