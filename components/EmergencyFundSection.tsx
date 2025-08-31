

import React, { useState } from 'react';
import { Category } from '../types';
import { formatDisplayAmount } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { ShieldCheckIcon } from './icons';
import SetEmergencyFundGoalModal from './SetEmergencyFundGoalModal';

interface EmergencyFundSectionProps {
    category?: Category;
    savedAmount: number;
    avgMonthlyExpenses: number;
    onSetGoal: (target: number) => void;
}

const EmergencyFundSection: React.FC<EmergencyFundSectionProps> = ({ category, savedAmount, avgMonthlyExpenses, onSetGoal }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { currency, rates, settings } = useCurrency();
    const goalTarget = category?.goalTarget || 0;
    const progress = goalTarget > 0 ? Math.min((savedAmount / goalTarget) * 100, 100) : 0;

    const getHealthStatus = (): { text: string; color: string } => {
        if (goalTarget === 0) return { text: 'Ціль не встановлено', color: 'slate' };
        if (progress >= 100) return { text: 'Повністю профінансовано', color: 'green' };
        if (progress >= 50) return { text: 'Хороший прогрес', color: 'yellow' };
        return { text: 'Потребує уваги', color: 'red' };
    };
    
    const { text: healthText, color: healthColor } = getHealthStatus();

    const colorClasses = {
        green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500', progress: 'bg-green-500' },
        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500', progress: 'bg-yellow-500' },
        red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500', progress: 'bg-red-500' },
        slate: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-500', progress: 'bg-slate-500' },
    };
    const currentColors = colorClasses[healthColor as keyof typeof colorClasses];

    return (
        <>
            <div className={`p-6 rounded-xl shadow-sm border-l-4 ${currentColors.border} ${currentColors.bg}`}>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheckIcon className={`w-7 h-7 ${currentColors.text}`} />
                            <h2 className={`text-2xl font-bold ${currentColors.text}`}>Фонд на випадок надзвичайних ситуацій</h2>
                        </div>
                        <p className={`text-sm font-semibold ${currentColors.text}`}>{healthText}</p>
                    </div>
                     <button 
                        onClick={() => setIsModalOpen(true)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 self-start md:self-center"
                    >
                        {goalTarget > 0 ? 'Редагувати ціль' : 'Встановити ціль'}
                    </button>
                </div>

                <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-bold ${currentColors.text}`}>{formatDisplayAmount({ amountInUah: savedAmount, targetCurrency: currency, rates, settings })}</span>
                        <span className={`text-slate-500`}>з {formatDisplayAmount({ amountInUah: goalTarget, targetCurrency: currency, rates, settings })}</span>
                    </div>

                    <div className="mt-2">
                         <div className="flex justify-between mb-1">
                            <span className={`text-sm font-medium ${currentColors.text}`}>Прогрес</span>
                            <span className={`text-sm font-medium ${currentColors.text}`}>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-4">
                            <div className={`${currentColors.progress} h-4 rounded-full`} style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
             <SetEmergencyFundGoalModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSetGoal}
                currentGoal={goalTarget}
                avgMonthlyExpenses={avgMonthlyExpenses}
            />
        </>
    );
};

export default EmergencyFundSection;