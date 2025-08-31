


import React, { useState, useEffect, useMemo } from 'react';
import { MonthlyGoal, IncomeSource } from '../types';
import { formatDisplayAmount } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';

interface SetMonthlyGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: MonthlyGoal) => void;
  incomeSources: IncomeSource[];
  currentGoal: MonthlyGoal;
}

const SetMonthlyGoalModal: React.FC<SetMonthlyGoalModalProps> = ({ isOpen, onClose, onSave, incomeSources, currentGoal }) => {
  const [totalGoal, setTotalGoal] = useState('');
  const [sourceGoals, setSourceGoals] = useState<{ [sourceId: string]: string }>({});
  const [motivation, setMotivation] = useState('');
  const [isTotalManuallySet, setIsTotalManuallySet] = useState(false);
  const { currency, rates, settings } = useCurrency();

  useEffect(() => {
    if (isOpen) {
      setTotalGoal(String(currentGoal.totalGoal || ''));
      setMotivation(currentGoal.motivation || '');
      const initialSourceGoals = incomeSources.reduce((acc, source) => {
        acc[source.id] = String(currentGoal.sourceGoals[source.id] || '');
        return acc;
      }, {} as { [sourceId: string]: string });
      setSourceGoals(initialSourceGoals);

      // Determine if the total was manually set
      const initialTotal = currentGoal.totalGoal || 0;
      const initialSum = Object.values(currentGoal.sourceGoals).reduce((s: number, v: number) => s + (v || 0), 0);
      setIsTotalManuallySet(initialTotal > 0 && initialTotal !== initialSum);
    }
  }, [isOpen, currentGoal, incomeSources]);
  
  const totalAssigned = useMemo(() => {
    return Object.values(sourceGoals).reduce((sum: number, amount: string) => sum + (parseFloat(amount) || 0), 0);
  }, [sourceGoals]);

  useEffect(() => {
    if (isOpen && !isTotalManuallySet) {
      setTotalGoal(totalAssigned > 0 ? String(totalAssigned) : '');
    }
  }, [totalAssigned, isTotalManuallySet, isOpen]);


  const handleSourceGoalChange = (sourceId: string, value: string) => {
    setSourceGoals(prev => ({ ...prev, [sourceId]: value }));
  };

  const handleTotalGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTotalGoal(value);
    if (value === '') {
      setIsTotalManuallySet(false);
    } else {
      setIsTotalManuallySet(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericTotalGoal = parseFloat(totalGoal) || 0;
    
    const numericSourceGoals = Object.entries(sourceGoals).reduce((acc, [id, amount]: [string, string]) => {
        const numAmount = parseFloat(amount) || 0;
        if (numAmount > 0) {
            acc[id] = numAmount;
        }
        return acc;
    }, {} as { [sourceId: string]: number });
    
    onSave({ 
        totalGoal: numericTotalGoal, 
        sourceGoals: numericSourceGoals,
        motivation: motivation.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg modal-enter" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Встановити ціль доходу на місяць</h2>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label htmlFor="totalGoal" className="block text-sm font-medium text-slate-700">Загальна ціль</label>
                <input
                  type="number"
                  id="totalGoal"
                  value={totalGoal}
                  onChange={handleTotalGoalChange}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  autoFocus
                />
              </div>

               <div>
                <label htmlFor="motivation" className="block text-sm font-medium text-slate-700">Моя мотивація (Чому?)</label>
                <textarea
                    id="motivation"
                    rows={2}
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Напр., Накопичити на відпустку, закрити кредит..."
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h3 className="text-base font-semibold text-slate-700">Цілі за джерелами (необов'язково)</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {incomeSources.map(source => (
                      <div key={source.id} className="grid grid-cols-3 gap-3 items-center">
                        <label htmlFor={`source-${source.id}`} className="text-sm text-slate-600 truncate col-span-2">{source.name}</label>
                        <input
                          type="number"
                          id={`source-${source.id}`}
                          value={sourceGoals[source.id] || ''}
                          onChange={(e) => handleSourceGoalChange(source.id, e.target.value)}
                          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    ))}
                </div>
                 <div className="flex justify-between items-center pt-2 text-sm font-medium">
                    <span className="text-slate-600">Всього розподілено:</span>
                    <span className={`font-mono ${totalAssigned > (parseFloat(totalGoal) || 0) ? 'text-red-600' : 'text-slate-800'}`}>
                        {formatDisplayAmount({ amountInUah: totalAssigned, targetCurrency: currency, rates, settings, simple: true })}
                    </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Скасувати
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Зберегти ціль
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetMonthlyGoalModal;