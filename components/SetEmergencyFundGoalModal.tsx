

import React, { useState, useEffect } from 'react';
import { formatDisplayAmount } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';

interface SetEmergencyFundGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (target: number) => void;
  currentGoal: number;
  avgMonthlyExpenses: number;
}

const SetEmergencyFundGoalModal: React.FC<SetEmergencyFundGoalModalProps> = ({ isOpen, onClose, onSave, currentGoal, avgMonthlyExpenses }) => {
  const [target, setTarget] = useState('');
  const { currency, rates, settings } = useCurrency();

  useEffect(() => {
    if (isOpen) {
      setTarget(currentGoal > 0 ? String(currentGoal) : '');
    }
  }, [isOpen, currentGoal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmount = parseFloat(target) || 0;
    onSave(targetAmount);
    onClose();
  };

  if (!isOpen) return null;
  
  const suggested3Months = avgMonthlyExpenses * 3;
  const suggested6Months = avgMonthlyExpenses * 6;

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md modal-enter" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Ціль для фонду на НС</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {avgMonthlyExpenses > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-600">Ваші середні місячні витрати: ~{formatDisplayAmount({ amountInUah: avgMonthlyExpenses, targetCurrency: currency, rates, settings })}</p>
                    <div className="mt-2 space-y-2 text-sm">
                        <button type="button" onClick={() => setTarget(String(suggested3Months.toFixed(2)))} className="w-full text-left p-2 rounded-md hover:bg-slate-200">
                            <strong>Рекомендація (3 міс.):</strong> {formatDisplayAmount({ amountInUah: suggested3Months, targetCurrency: currency, rates, settings })}
                        </button>
                        <button type="button" onClick={() => setTarget(String(suggested6Months.toFixed(2)))} className="w-full text-left p-2 rounded-md hover:bg-slate-200">
                            <strong>Рекомендація (6 міс.):</strong> {formatDisplayAmount({ amountInUah: suggested6Months, targetCurrency: currency, rates, settings })}
                        </button>
                    </div>
                </div>
              )}
              <div>
                <label htmlFor="ef-target" className="block text-sm font-medium text-slate-700">Встановіть свою ціль</label>
                <input
                  type="number"
                  id="ef-target"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="0.00"
                  required
                  step="0.01"
                  autoFocus
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
              Скасувати
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Зберегти ціль
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetEmergencyFundGoalModal;