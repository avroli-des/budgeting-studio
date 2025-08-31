
import React, { useState, useEffect } from 'react';
import { Account } from '../types';
import { ACCOUNT_TYPES } from '../constants';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id?: string; name: string; type: Account['type']; initialBalance?: number }) => void;
  accountToEdit?: Account | null;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onSave, accountToEdit }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('checking');
  const [initialBalance, setInitialBalance] = useState('');
  
  const isEditing = !!accountToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setName(accountToEdit.name);
            setType(accountToEdit.type);
            setInitialBalance(String(accountToEdit.balance));
        } else {
            setName('');
            setType('checking');
            setInitialBalance('');
        }
    }
  }, [isOpen, accountToEdit, isEditing]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({
        id: isEditing ? accountToEdit.id : undefined,
        name: name.trim(),
        type,
        ...(!isEditing && { initialBalance: parseFloat(initialBalance) || 0 })
      });
      onClose();
    }
  };
  
  const handleClose = () => {
      onClose();
  }
  
  const title = isEditing ? 'Редагувати рахунок' : 'Додати новий рахунок';
  const buttonText = isEditing ? 'Зберегти зміни' : 'Додати рахунок';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md modal-enter" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            </div>
            <div className="p-6">
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="accountName" className="block text-sm font-medium text-slate-700">Назва рахунку</label>
                        <input
                            type="text"
                            id="accountName"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Напр., Картка Monobank"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="accountType" className="block text-sm font-medium text-slate-700">Тип рахунку</label>
                        <select
                            id="accountType"
                            value={type}
                            onChange={e => setType(e.target.value as Account['type'])}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                            {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="initialBalance" className="block text-sm font-medium text-slate-700">
                            {isEditing ? 'Поточний баланс' : 'Початковий баланс'}
                        </label>
                        <input
                            type="number"
                            id="initialBalance"
                            value={initialBalance}
                            onChange={e => setInitialBalance(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                            placeholder="0.00"
                            step="0.01"
                            disabled={isEditing}
                        />
                         <p className="mt-1 text-xs text-slate-500">
                           {isEditing 
                            ? "Баланс не можна змінити тут. Створіть транзакцію, щоб його відкоригувати." 
                            : "Буде створено транзакцію \"Початковий баланс\". Для кредиток введіть суму зі знаком мінус, напр., -5000."}
                         </p>
                    </div>
                 </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
            <button type="button" onClick={handleClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Скасувати
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {buttonText}
            </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;