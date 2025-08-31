
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, PlusIcon, ArrowRightLeftIcon } from './icons';

interface FloatingActionButtonProps {
  onAddTransaction: (type: 'income' | 'expense' | 'transfer') => void;
  disabled: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onAddTransaction, disabled }) => {
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

  const handleActionClick = (type: 'income' | 'expense' | 'transfer') => {
    onAddTransaction(type);
    setIsOpen(false);
  };
  
  const buttonClass = "flex items-center justify-end w-full p-3 rounded-full shadow-lg transition-all duration-200 ease-in-out";
  const labelClass = "text-sm font-semibold mr-3 whitespace-nowrap transition-opacity duration-200";

  if (disabled) {
    return (
        <div className="fixed bottom-6 right-6 z-20">
             <div className="flex items-center justify-center p-4 rounded-full bg-slate-300 text-white cursor-not-allowed shadow-lg" title="Спочатку додайте рахунок">
                <PlusIcon className="h-7 w-7" />
             </div>
        </div>
    )
  }

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-3">
        {isOpen && (
            <div className="flex flex-col items-end gap-3">
                <button
                    onClick={() => handleActionClick('transfer')}
                    className={`${buttonClass} bg-blue-500 hover:bg-blue-600 text-white`}
                    aria-label="Додати переказ"
                >
                    <span className={labelClass}>Переказ</span>
                    <ArrowRightLeftIcon className="h-6 w-6 flex-shrink-0" />
                </button>
                 <button
                    onClick={() => handleActionClick('expense')}
                    className={`${buttonClass} bg-red-500 hover:bg-red-600 text-white`}
                    aria-label="Додати витрату"
                >
                    <span className={labelClass}>Витрата</span>
                    <ArrowDownIcon className="h-6 w-6 flex-shrink-0" />
                </button>
                <button
                    onClick={() => handleActionClick('income')}
                    className={`${buttonClass} bg-green-500 hover:bg-green-600 text-white`}
                    aria-label="Додати дохід"
                >
                    <span className={labelClass}>Дохід</span>
                    <ArrowUpIcon className="h-6 w-6 flex-shrink-0" />
                </button>
            </div>
        )}

        <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center justify-center p-4 rounded-full shadow-lg transition-transform duration-200 ease-in-out ${isOpen ? 'bg-slate-600 rotate-45' : 'bg-blue-600 hover:bg-blue-700'}`}
            aria-label={isOpen ? "Закрити меню" : "Відкрити меню додавання"}
        >
            <PlusIcon className="h-7 w-7 text-white" />
        </button>
    </div>
  );
};

export default FloatingActionButton;
