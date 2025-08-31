import React, { useState, useMemo } from 'react';
import { formatDisplayAmount } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { FlagIcon, ChevronDownIcon } from './icons';

interface FinancialIndependenceCalculatorProps {
    currentPortfolio: number;
}

const FinancialIndependenceCalculator: React.FC<FinancialIndependenceCalculatorProps> = ({ currentPortfolio }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const { currency, rates, settings } = useCurrency();
    const [annualSpending, setAnnualSpending] = useState('600000');
    const [monthlyInvestment, setMonthlyInvestment] = useState('15000');
    const [interestRate, setInterestRate] = useState('7');
    
    const calculation = useMemo(() => {
        const P = currentPortfolio;
        const PMT = parseFloat(monthlyInvestment) || 0;
        const annualR = (parseFloat(interestRate) || 0) / 100;
        const spending = parseFloat(annualSpending) || 0;

        if (spending === 0) return { fiNumber: 0, yearsToFi: Infinity };

        const fiNumber = spending * 25; // 4% rule
        if (P >= fiNumber) return { fiNumber, yearsToFi: 0 };
        
        // derived from financial formula for time to reach a future value
        // This is a simplification and can be inaccurate. A loop is better.
        let years = 0;
        let balance = P;
        let months = 0;
        const monthlyR = annualR / 12;

        if (PMT <= (spending/12 - P*monthlyR) && PMT > 0) { // rough check if contributions can't outpace spending inflation
            return { fiNumber, yearsToFi: Infinity };
        }

        while (balance < fiNumber && months < 1200) { // 100 years limit
            balance = balance * (1 + monthlyR) + PMT;
            months++;
        }
        
        years = months / 12;
        
        return { fiNumber, yearsToFi: years > 100 ? Infinity : years };
    }, [currentPortfolio, annualSpending, monthlyInvestment, interestRate]);

    const fiProgress = calculation.fiNumber > 0 ? (currentPortfolio / calculation.fiNumber) * 100 : 0;

    return (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full p-4 flex justify-between items-center hover:bg-slate-50"
            >
                <div className="flex items-center gap-3">
                    <FlagIcon className="w-7 h-7 text-green-500" />
                    <h2 className="text-2xl font-bold text-slate-800">Калькулятор фінансової незалежності</h2>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>
            {!isCollapsed && (
                <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* Controls */}
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Розрахуйте, коли ви зможете досягти фінансової незалежності (FI), використовуючи правило 4%.</p>
                        <div>
                            <label htmlFor="fi-spending" className="block text-sm font-medium">Річні витрати ({currency})</label>
                            <input type="number" id="fi-spending" value={annualSpending} onChange={(e) => setAnnualSpending(e.target.value)} className="mt-1 w-full rounded-md border-slate-300"/>
                        </div>
                        <div>
                            <label htmlFor="fi-monthly" className="block text-sm font-medium">Щомісячні інвестиції ({currency})</label>
                            <input type="number" id="fi-monthly" value={monthlyInvestment} onChange={(e) => setMonthlyInvestment(e.target.value)} className="mt-1 w-full rounded-md border-slate-300"/>
                        </div>
                        <div>
                            <label htmlFor="fi-rate" className="block text-sm font-medium">Очікувана річна дохідність (%)</label>
                            <input type="number" id="fi-rate" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="mt-1 w-full rounded-md border-slate-300"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500">Поточний портфель</label>
                            <p className="font-bold text-lg text-slate-800">{formatDisplayAmount({ amountInUah: currentPortfolio, targetCurrency: currency, rates, settings })}</p>
                        </div>
                    </div>
                     {/* Results */}
                     <div className="space-y-4">
                        <div className="text-center bg-green-100/50 p-4 rounded-lg border border-green-200">
                             <p className="text-sm text-green-700">Ваше "FI число" (ціль)</p>
                             <p className="text-3xl font-bold text-green-800 mt-1">{formatDisplayAmount({ amountInUah: calculation.fiNumber, targetCurrency: currency, rates, settings })}</p>
                        </div>
                         <div className="text-center bg-white p-4 rounded-lg border border-slate-200">
                             <p className="text-sm text-slate-500">Час до фінансової незалежності</p>
                             <p className="text-3xl font-bold text-slate-800 mt-1">
                                {calculation.yearsToFi === Infinity ? "Дуже довго" : calculation.yearsToFi === 0 ? "Вже досягнуто!" : `${calculation.yearsToFi.toFixed(1)} років`}
                             </p>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-slate-600">Прогрес до FI</span>
                                <span className="text-sm font-medium text-slate-600">{fiProgress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-4">
                                <div className="bg-green-500 h-4 rounded-full" style={{ width: `${Math.min(fiProgress, 100)}%`}}></div>
                            </div>
                        </div>
                     </div>
                </div>
            )}
         </div>
    );
};

export default FinancialIndependenceCalculator;