
import React, { useState, useEffect } from 'react';
import { IncomeSource, IncomeCategory } from '../types';
import { INCOME_SOURCE_CATEGORIES } from '../constants';

interface AddIncomeSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id?: string; name: string; category: IncomeCategory; expectedAmount: number; description?: string, isRecurring?: boolean, paymentDay?: number }) => void;
  sourceToEdit?: IncomeSource | null;
}

const AddIncomeSourceModal: React.FC<AddIncomeSourceModalProps> = ({ isOpen, onClose, onSave, sourceToEdit }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('salary');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [paymentDay, setPaymentDay] = useState('');

  const isEditing = !!sourceToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setName(sourceToEdit.name);
            setCategory(sourceToEdit.category);
            setExpectedAmount(String(sourceToEdit.expectedAmount || ''));
            setDescription(sourceToEdit.description || '');
            setIsRecurring(sourceToEdit.isRecurring || false);
            setPaymentDay(String(sourceToEdit.paymentDay || ''));
        } else {
            setName('');
            setCategory('salary');
            setExpectedAmount('');
            setDescription('');
            setIsRecurring(false);
            setPaymentDay('');
        }
    }
  }, [isOpen, sourceToEdit, isEditing]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(expectedAmount);
    if (name.trim() && numericAmount >= 0) {
      onSave({
        id: isEditing ? sourceToEdit.id : undefined,
        name: name.trim(),
        category,
        expectedAmount: numericAmount,
        description: description.trim(),
        isRecurring,
        paymentDay: isRecurring ? (parseInt(paymentDay, 10) || undefined) : undefined,
      });
      onClose();
    }
  };
  
  const handleClose = () => {
      onClose();
  };
  
  const title = isEditing ? 'Редагувати джерело доходу' : 'Додати джерело доходу';
  const buttonText = isEditing ? 'Зберегти зміни' : 'Додати джерело';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md modal-enter" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="sourceName" className="block text-sm font-medium text-slate-700">Назва джерела</label>
                        <input
                            type="text"
                            id="sourceName"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Напр., Зарплата, Фріланс"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="sourceCategory" className="block text-sm font-medium text-slate-700">Категорія</label>
                        <select
                            id="sourceCategory"
                            value={category}
                            onChange={e => setCategory(e.target.value as IncomeCategory)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                            {INCOME_SOURCE_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="expectedAmount" className="block text-sm font-medium text-slate-700">Очікувана сума / міс.</label>
                        <input
                            type="number"
                            id="expectedAmount"
                            value={expectedAmount}
                            onChange={e => setExpectedAmount(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="0.00"
                            required
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label htmlFor="sourceDescription" className="block text-sm font-medium text-slate-700">Опис (необов'язково)</label>
                         <textarea
                            id="sourceDescription"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={2}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Додаткова інформація про джерело доходу"
                         />
                    </div>
                    <div className="pt-4 border-t border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="flex-grow flex flex-col">
                                <span className="text-sm font-medium text-slate-700">Регулярний дохід</span>
                                <span className="text-xs text-slate-500">Це постійний, повторюваний платіж?</span>
                            </span>
                            <label htmlFor="isRecurring" className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="isRecurring" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                         <div>
                            <label htmlFor="paymentDay" className="block text-sm font-medium text-slate-700 disabled:text-slate-400">Очікуваний день оплати</label>
                            <input
                            type="number"
                            id="paymentDay"
                            value={paymentDay}
                            onChange={(e) => setPaymentDay(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
                            placeholder="Напр., 15"
                            min="1"
                            max="31"
                            disabled={!isRecurring}
                            />
                            <p className="mt-1 text-xs text-slate-500">День місяця, коли ви очікуєте оплату (1-31).</p>
                        </div>
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

export default AddIncomeSourceModal;