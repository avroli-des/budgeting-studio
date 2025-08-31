import React, { useState } from 'react';
import { Account, CategoryGroup } from '../types';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { newAccountId?: string, newCategoryId?: string }) => void;
  transactionCount: number;
  accounts: Account[];
  categoryGroups: CategoryGroup[];
  hasNonExpenseItems: boolean;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionCount,
  accounts,
  categoryGroups,
  hasNonExpenseItems,
}) => {
  const [newAccountId, setNewAccountId] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: { newAccountId?: string, newCategoryId?: string } = {};
    if (newAccountId) updates.newAccountId = newAccountId;
    if (newCategoryId) updates.newCategoryId = newCategoryId;

    if (Object.keys(updates).length > 0) {
      onSave(updates);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md modal-enter" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Редагувати {transactionCount} транзакції</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="bulk-account" className="block text-sm font-medium text-slate-700">Змінити рахунок</label>
              <select
                id="bulk-account"
                value={newAccountId}
                onChange={e => setNewAccountId(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Без змін</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="bulk-category"
                className={`block text-sm font-medium ${hasNonExpenseItems ? 'text-slate-400' : 'text-slate-700'}`}
              >
                Змінити категорію
              </label>
              <select
                id="bulk-category"
                value={newCategoryId}
                onChange={e => setNewCategoryId(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                disabled={hasNonExpenseItems}
                title={hasNonExpenseItems ? "Можна змінювати категорію лише для витрат" : ""}
              >
                <option value="">Без змін</option>
                {categoryGroups.filter(g => g.name !== "Інвестиції").map(group => (
                    <optgroup key={group.id} label={group.name}>
                        {group.categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </optgroup>
                ))}
              </select>
              {hasNonExpenseItems && (
                <p className="mt-1 text-xs text-slate-500">
                  Зміна категорії доступна лише тоді, коли всі вибрані транзакції є витратами.
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
              Скасувати
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Застосувати зміни
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEditModal;
