import React, { useState, useMemo } from 'react';
import { Transaction, CategoryGroup } from '../types';
import { formatDisplayAmount, getMonthKey } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { FlagIcon, FireIcon } from './icons';

interface SetTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (target: number) => void;
  currentTarget: number;
}

const SetTargetModal: React.FC<SetTargetModalProps> = ({ isOpen, onClose, onSave, currentTarget }) => {
    const [target, setTarget] = useState(String(currentTarget || ''));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(parseFloat(target) || 0);
        onClose();
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-slate-800">Щомісячна ціль інвестування</h2>
                        <div className="mt-4">
                            <label htmlFor="investment-target" className="block text-sm font-medium text-slate-700">Сума</label>
                            <input
                                type="number" id="investment-target" value={target}
                                onChange={e => setTarget(e.target.value)}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500"
                                placeholder="0.00" step="100" autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 p-4 bg-slate-50 rounded-b-lg">
                        <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm">Скасувати</button>
                        <button type="submit" className="py-2 px-4 border border-transparent shadow-sm rounded-md text-white bg-blue-600 hover:bg-blue-700">Зберегти</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


interface MonthlyInvestmentTrackerProps {
  target: number;
  transactions: Transaction[];
  categoryGroups: CategoryGroup[];
  onSetTarget: (target: number) => void;
}

const MonthlyInvestmentTracker: React.FC<MonthlyInvestmentTrackerProps> = ({ target, transactions, categoryGroups, onSetTarget }) => {
    const { currency, rates, settings } = useCurrency();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const investmentCategoryIds = useMemo(() => {
        const investmentGroup = categoryGroups.find(g => g.name === 'Інвестиції');
        return new Set(investmentGroup?.categories.map(c => c.id) || []);
    }, [categoryGroups]);

    const { investedThisMonth, streak } = useMemo(() => {
        const now = new Date();
        const currentMonthKey = getMonthKey(now);
        
        const monthlyInvestments = new Map<string, number>();
        transactions.forEach(t => {
            if (t.type === 'expense' && t.categoryId && investmentCategoryIds.has(t.categoryId) && t.payee !== "Початковий баланс") {
                const monthKey = getMonthKey(new Date(t.date));
                monthlyInvestments.set(monthKey, (monthlyInvestments.get(monthKey) || 0) + t.amount);
            }
        });

        const investedThisMonth = monthlyInvestments.get(currentMonthKey) || 0;

        // Calculate streak
        let currentStreak = 0;
        let streakEnded = false;
        const sortedMonths = Array.from(monthlyInvestments.keys()).sort().reverse();
        
        let monthToCheck = new Date();
        if(sortedMonths.length > 0) {
            const latestTransactionMonth = new Date(sortedMonths[0] + '-01T12:00:00Z');
            // Start checking from the month of the last investment or current month, whichever is later
            if (latestTransactionMonth > monthToCheck) monthToCheck = latestTransactionMonth;
        }

        while (!streakEnded && target > 0) {
            const key = getMonthKey(monthToCheck);
            const invested = monthlyInvestments.get(key) || 0;
            if (invested >= target) {
                currentStreak++;
            } else {
                 // Allow one grace month for the current month if it's not over yet
                if (key !== currentMonthKey) {
                    streakEnded = true;
                }
            }
            // Move to the previous month
             if (currentStreak === 0 && key !== currentMonthKey) {
                streakEnded = true; // No streak if the previous month was a miss
            } else {
                monthToCheck.setMonth(monthToCheck.getMonth() - 1);
            }
        }
        
        return { investedThisMonth, streak: currentStreak };
    }, [transactions, investmentCategoryIds, target]);

    const progress = target > 0 ? Math.min((investedThisMonth / target) * 100, 100) : 0;

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FlagIcon className="w-6 h-6 text-blue-600" />
                            Щомісячний план інвестування
                        </h2>
                        <p className="text-sm text-slate-500">Ваш прогрес у досягненні щомісячної інвестиційної цілі.</p>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-orange-500">
                            <FireIcon className="w-6 h-6" />
                            <span className="font-bold text-lg">{streak} міс.</span>
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                            {target > 0 ? 'Змінити ціль' : 'Встановити ціль'}
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-800">{formatDisplayAmount({ amountInUah: investedThisMonth, targetCurrency: currency, rates, settings })}</span>
                        {target > 0 && <span className="text-slate-500">з {formatDisplayAmount({ amountInUah: target, targetCurrency: currency, rates, settings })}</span>}
                    </div>

                    {target > 0 && (
                        <div className="mt-2">
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-blue-700">Прогрес</span>
                                <span className="text-sm font-medium text-blue-700">{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-4">
                                <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
             <SetTargetModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSetTarget}
                currentTarget={target}
            />
        </>
    );
};

export default MonthlyInvestmentTracker;