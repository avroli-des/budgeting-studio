
import React, { useState, useEffect } from 'react';
import { InvestmentPlatform, InvestmentPlatformCategory } from '../types';
import { INVESTMENT_PLATFORM_TYPES } from '../constants';

interface AddPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<InvestmentPlatform, 'id'> | InvestmentPlatform) => void;
  platformToEdit?: InvestmentPlatform | null;
}

const AddPlatformModal: React.FC<AddPlatformModalProps> = ({ isOpen, onClose, onSave, platformToEdit }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InvestmentPlatformCategory>('brokerage');
  
  const isEditing = !!platformToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setName(platformToEdit.name);
            setCategory(platformToEdit.category);
        } else {
            setName('');
            setCategory('brokerage');
        }
    }
  }, [isOpen, platformToEdit, isEditing]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const dataToSave = {
        ...(isEditing && { id: platformToEdit.id }),
        name: name.trim(),
        category,
        ...(isEditing && { currentValue: platformToEdit.currentValue }),
      };
      onSave(dataToSave);
      onClose();
    }
  };
  
  const handleClose = () => {
      onClose();
  }
  
  const title = isEditing ? 'Редагувати платформу' : 'Додати платформу';
  const buttonText = isEditing ? 'Зберегти зміни' : 'Додати платформу';

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
                        <label htmlFor="platformName" className="block text-sm font-medium text-slate-700">Назва платформи</label>
                        <input
                            type="text"
                            id="platformName"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Напр., Interactive Brokers"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="platformCategory" className="block text-sm font-medium text-slate-700">Категорія</label>
                        <select
                            id="platformCategory"
                            value={category}
                            onChange={e => setCategory(e.target.value as InvestmentPlatformCategory)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                            {INVESTMENT_PLATFORM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
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

export default AddPlatformModal;