
import React from 'react';
import { Category } from '../types';
import { getCurrencyClass, formatDisplayAmount } from '../helpers';
import { TrashIcon } from './icons';
import { useCurrency } from '../contexts/CurrencyContext';

interface CategoryCardMobileProps {
  category: Category;
  activity: number;
  onActivityClick: (categoryId: string, categoryName: string) => void;
  onDelete: (categoryId: string, categoryName: string) => void;
}

const CategoryCardMobile: React.FC<CategoryCardMobileProps> = ({ category, activity, onActivityClick, onDelete }) => {
  const { currency, rates, settings } = useCurrency();

  return (
    <div className="p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 pr-2">
            <p className="font-medium text-slate-800">{category.name}</p>
        </div>
        <button 
          onClick={() => onDelete(category.id, category.name)}
          className="text-slate-400 hover:text-red-500 flex-shrink-0"
          title="Видалити категорію"
        >
          <TrashIcon className="w-5 h-5"/>
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center bg-slate-50 rounded-md p-2 -mx-2">
            <span className="font-medium text-slate-600">Витрати за місяць</span>
            <span 
                className={`font-mono font-bold cursor-pointer hover:underline ${getCurrencyClass(activity)}`}
                onClick={() => onActivityClick(category.id, category.name)}
                title="Переглянути транзакції"
            >
                {formatDisplayAmount({ amountInUah: activity, targetCurrency: currency, rates, settings })}
            </span>
        </div>
      </div>
    </div>
  );
};

export default CategoryCardMobile;