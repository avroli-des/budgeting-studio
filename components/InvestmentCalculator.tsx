import React, { useState, useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { formatDisplayAmount, formatChartAxis } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { CalculatorIcon, ChevronDownIcon } from './icons';

interface InvestmentCalculatorProps {
  startAmountValue: number;
}

const InputSlider: React.FC<{label: string, value: string, setValue: (v: string) => void, min: number, max: number, step: number, unit: string}> = 
    ({ label, value, setValue, min, max, step, unit }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <div className="flex items-center gap-4 mt-1">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full custom-range-slider"
            />
            <div className="flex-shrink-0 w-28">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full rounded-md border-slate-300 text-center text-sm"
                />
                 <span className="text-xs text-slate-500">{unit}</span>
            </div>
        </div>
    </div>
);

const InvestmentCalculator: React.FC<InvestmentCalculatorProps> = ({ startAmountValue }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const { currency, rates, settings } = useCurrency();

    const [startAmount, setStartAmount] = useState(String(Math.round(startAmountValue)));
    const [monthlyContribution, setMonthlyContribution] = useState('5000');
    const [interestRate, setInterestRate] = useState('8');
    const [years, setYears] = useState('20');
    
    useEffect(() => {
        setStartAmount(String(Math.round(startAmountValue)));
    }, [startAmountValue]);

    const calculationResults = useMemo(() => {
        const P = parseFloat(startAmount) || 0;
        const PMT = parseFloat(monthlyContribution) || 0;
        const r = (parseFloat(interestRate) || 0) / 100;
        const t = parseInt(years, 10) || 0;
        const n = 12; // Compounded monthly

        const chartLabels: string[] = [];
        const principalData: number[] = [];
        const futureValueData: number[] = [];
        const interestData: number[] = [];
        
        for (let i = 0; i <= t; i++) {
            chartLabels.push(`Рік ${i}`);
            
            const totalMonths = i * n;
            
            // FV of principal
            const fvPrincipal = P * Math.pow(1 + r / n, totalMonths);
            
            // FV of series of payments
            const fvAnnuity = PMT === 0 || r === 0 
                ? PMT * totalMonths
                : PMT * ( (Math.pow(1 + r / n, totalMonths) - 1) / (r / n) );
            
            const totalValue = fvPrincipal + fvAnnuity;
            const totalPrincipal = P + (PMT * totalMonths);
            const totalInterest = totalValue - totalPrincipal;

            principalData.push(totalPrincipal);
            futureValueData.push(totalValue);
            interestData.push(totalInterest);
        }
        
        const finalValue = futureValueData[futureValueData.length - 1] || 0;
        const totalContributions = principalData[principalData.length - 1] || 0;
        const totalInterest = interestData[interestData.length - 1] || 0;

        const chartData = {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Загальна вартість',
                    data: futureValueData,
                    borderColor: '#4f46e5', // indigo-600
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.2,
                    pointRadius: 0,
                },
                {
                    label: 'Внески',
                    data: principalData,
                    borderColor: '#64748b', // slate-500
                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                    fill: true,
                    tension: 0.2,
                    pointRadius: 0,
                },
            ],
        };

        return {
            finalValue,
            totalContributions,
            totalInterest,
            chartData,
        };
    }, [startAmount, monthlyContribution, interestRate, years]);
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom' as const, },
            tooltip: {
                callbacks: {
                    label: (context: any) => `${context.dataset.label}: ${formatDisplayAmount({ amountInUah: context.parsed.y, targetCurrency: currency, rates, settings, simple: true })}`,
                },
            },
        },
        scales: {
            y: { ticks: { callback: (value: any) => formatChartAxis(value, currency, rates) } },
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full p-4 flex justify-between items-center hover:bg-slate-50"
            >
                <div className="flex items-center gap-3">
                    <CalculatorIcon className="w-7 h-7 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-slate-800">Калькулятор складних відсотків</h2>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>

            {!isCollapsed && (
                <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Controls */}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="startAmount" className="block text-sm font-medium text-slate-700">Початкова сума ({currency})</label>
                            <input
                                type="number"
                                id="startAmount"
                                value={startAmount}
                                onChange={(e) => setStartAmount(e.target.value)}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="monthlyContribution" className="block text-sm font-medium text-slate-700">Щомісячний внесок ({currency})</label>
                            <input
                                type="number"
                                id="monthlyContribution"
                                value={monthlyContribution}
                                onChange={(e) => setMonthlyContribution(e.target.value)}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm"
                            />
                        </div>
                         <InputSlider 
                            label="Річна відсоткова ставка"
                            value={interestRate}
                            setValue={setInterestRate}
                            min={1} max={20} step={0.5} unit="%"
                        />
                         <InputSlider 
                            label="Термін інвестування"
                            value={years}
                            setValue={setYears}
                            min={1} max={40} step={1} unit="років"
                        />
                    </div>
                    {/* Results */}
                    <div className="space-y-4">
                        <div className="text-center bg-white p-4 rounded-lg border border-slate-200">
                             <p className="text-sm text-slate-500">Прогнозована вартість через {years} років</p>
                             <p className="text-4xl font-bold text-indigo-600 mt-1">{formatDisplayAmount({ amountInUah: calculationResults.finalValue, targetCurrency: currency, rates, settings })}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center bg-white p-3 rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-500">Загальні внески</p>
                                <p className="font-semibold text-slate-700">{formatDisplayAmount({ amountInUah: calculationResults.totalContributions, targetCurrency: currency, rates, settings })}</p>
                            </div>
                            <div className="text-center bg-white p-3 rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-500">Зароблені відсотки</p>
                                <p className="font-semibold text-green-600">{formatDisplayAmount({ amountInUah: calculationResults.totalInterest, targetCurrency: currency, rates, settings })}</p>
                            </div>
                        </div>
                        <div className="h-64 bg-white p-2 rounded-lg border border-slate-200">
                            <Line data={calculationResults.chartData} options={chartOptions as any} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestmentCalculator;