

import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Account, Currency } from '../types';
import { getCurrencyClass, formatDisplayAmount } from '../helpers';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, XMarkIcon } from './icons';
import { useCurrency } from '../contexts/CurrencyContext';

interface TransactionMenuProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

const TransactionMenu: React.FC<TransactionMenuProps> = ({ transaction, onEdit, onDelete }) => {
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

    const handleEdit = () => {
        onEdit(transaction);
        setIsOpen(false);
    };
    
    const handleDelete = () => {
        onDelete(transaction);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                aria-label="Меню транзакції"
            >
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                        <button
                            onClick={handleEdit}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            <PencilIcon className="w-4 h-4 text-slate-500" />
                            <span>Редагувати</span>
                        </button>
                        <button
                            onClick={handleDelete}
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


interface TransactionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categoryName: string;
  accounts: Account[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

const TransactionListModal: React.FC<TransactionListModalProps> = ({ isOpen, onClose, transactions, categoryName, accounts, onEdit, onDelete }) => {
  if (!isOpen) return null;

  const { currency, rates, settings } = useCurrency();
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const accountsById = new Map<string, Account>(accounts.map(a => [a.id, a]));

  const handleEdit = (transaction: Transaction) => {
      onEdit(transaction);
      onClose(); // Close this modal to open the edit modal
  }

  const handleDelete = (transaction: Transaction) => {
      onDelete(transaction);
      onClose(); // Close this modal to open the confirmation modal
  }

  return (
    <div className="fixed inset-0 z-30 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl modal-enter flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800">Транзакції: {categoryName}</h2>
            <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200">
                <XMarkIcon className="w-6 h-6"/>
            </button>
        </header>
        <main className="p-6 overflow-y-auto flex-grow">
            {sortedTransactions.length > 0 ? (
                 <ul className="divide-y divide-slate-200">
                    {sortedTransactions.map(t => {
                        const uahAmountWithSign = -t.amount;
                        const originalAmountWithSign = -(t.originalAmount || 0);
                        const currencyClass = getCurrencyClass(uahAmountWithSign);

                        return (
                            <li key={t.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-slate-800">{t.payee}</p>
                                    <p className="text-sm text-slate-500">{new Date(t.date).toLocaleDateString('uk-UA')} &middot; {accountsById.get(t.accountId)?.name || 'Невідомий'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className={`font-mono font-medium ${currencyClass}`}>
                                        {formatDisplayAmount({
                                            amountInUah: uahAmountWithSign,
                                            targetCurrency: currency,
                                            rates,
                                            settings,
                                            originalAmount: originalAmountWithSign,
                                            originalCurrency: t.originalCurrency as Currency,
                                        })}
                                    </p>
                                    <TransactionMenu transaction={t} onEdit={handleEdit} onDelete={handleDelete} />
                                </div>
                            </li>
                        )
                    })}
                 </ul>
            ) : (
                <p className="text-center text-slate-500 py-8">Для цієї категорії немає транзакцій.</p>
            )}
        </main>
         <footer className="flex justify-end p-6 bg-slate-50 rounded-b-xl border-t border-slate-200 flex-shrink-0">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Закрити
            </button>
          </footer>
      </div>
    </div>
  );
};

export default TransactionListModal;