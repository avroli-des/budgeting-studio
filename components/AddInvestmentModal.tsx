
import React, { useState, useEffect } from 'react';
import { Category } from '../types';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id?: string; name: string; target: number }) => void;
  investmentToEdit?: Category | null;
}

const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({ isOpen, onClose, onSave, investmentToEdit }) => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');

  const isEditing = investmentToEdit != null;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setName(investmentToEdit.name);
            setTarget(String(investmentToEdit.goalTarget || ''));
        } else {
            setName('');
            setTarget('');
        }
    }
  }, [isOpen, isEditing, investmentToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmount = parseFloat(target);
    if (name.trim() && targetAmount > 0) {
      onSave({ 
          id: isEditing ? investmentToEdit.id : undefined,
          name: name.trim(), 
          target: targetAmount, 
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  const title = isEditing ? "Редагувати інвестицію" : "Створити нову інвестицію";
  const buttonText = isEditing ? "Зберегти зміни" : "Створити інвестицію";

  return (
    <div className="fixed inset-0 z-30 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md modal-enter" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            </div>
            <div className="p-6 space-y-4">
                <div>
                <label htmlFor="investmentName" className="block text-sm font-medium text-slate-700">Назва інвестиції</label>
                <input
                    type="text"
                    id="investmentName"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Напр., Акції, Криптовалюта"
                    required
                    autoFocus
                />
                </div>
                <div>
                <label htmlFor="investmentTarget" className="block text-sm font-medium text-slate-700">Цільова сума</label>
                <input
                    type="number"
                    id="investmentTarget"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0.00"
                    required
                    step="0.01"
                />
                </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
                <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
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

export default AddInvestmentModal;