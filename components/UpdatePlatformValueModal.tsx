
import React, { useState, useEffect } from 'react';
import { InvestmentPlatform } from '../types';

interface UpdatePlatformValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (platform: InvestmentPlatform) => void;
  platform: InvestmentPlatform;
}

const UpdatePlatformValueModal: React.FC<UpdatePlatformValueModalProps> = ({ isOpen, onClose, onSave, platform }) => {
  const [currentValue, setCurrentValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCurrentValue(String(platform.currentValue || ''));
    }
  }, [isOpen, platform]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = parseFloat(currentValue);
    if (!isNaN(numericValue)) {
        onSave({ ...platform, currentValue: numericValue });
    }
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm modal-enter" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">Оновити вартість</h2>
            </div>
            <div className="p-6">
                <p className="text-sm text-slate-500 mb-4">Введіть поточну загальну вартість активів на "{platform.name}".</p>
                <label htmlFor="currentValue" className="block text-sm font-medium text-slate-700">Поточна вартість</label>
                <input
                    type="number"
                    id="currentValue"
                    value={currentValue}
                    onChange={e => setCurrentValue(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0.00"
                    step="0.01"
                    required
                    autoFocus
                />
            </div>
            <div className="flex justify-end space-x-3 p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
                <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Скасувати
                </button>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Зберегти
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePlatformValueModal;