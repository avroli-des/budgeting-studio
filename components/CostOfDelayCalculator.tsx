import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { formatDisplayAmount, formatChartAxis } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { ClockIcon, ChevronDownIcon } from './icons';

// Chart.js is already registered in ReportsPage, so we don't need to re-register everything here.
// But it's good practice to ensure they are available if this component were to be used elsewhere.
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);


const CostOfDelayCalculator: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const { currency, rates, settings } = useCurrency();

    const [monthlyInvestment, setMonthlyInvestment] = useState('5000');
    const [interestRate, setInterestRate] = useState('8');
    const [currentAge, setCurrentAge] = useState('25');
    const [retirementAge, setRetirementAge] = useState('65');
    const [delayYears, setDelayYears] = useState('5');
    
    const calculationResults = useMemo(() => {
        const PMT = parseFloat(monthlyInvestment) || 0;
        const r = (parseFloat(interestRate) || 0) / 100;
        const startNowAge = parseInt(currentAge, 10) || 25;
        const startLaterAge = startNowAge + (parseInt(delayYears, 10) || 0);
        const endAge = parseInt(retirementAge, 10) || 65;
        const n = 12;

        const calculateGrowth = (startAge: number) => {
            const values: number[] = [];
            let futureValue = 0;
            for (let age = startNowAge; age <= endAge; age++) {
                if (age < startAge) {
                    values.push(0);
                } else {
                    const totalMonths = (age - startAge) * 12;
                    futureValue = PMT === 0 || r === 0 
                        ? PMT * totalMonths
                        : PMT * ( (Math.pow(1 + r / n, totalMonths) - 1) / (r / n) );
                    values.push(futureValue);
                }
            }
            return values;
        };

        const startNowData = calculateGrowth(startNowAge);
        const startLaterData = calculateGrowth(startLaterAge);

        const labels = Array.from({ length: endAge - startNowAge + 1 }, (_, i) => String(startNowAge + i));

        const chartData = {
            labels,
            datasets: [
                {
                    label: `Почати зараз (у ${startNowAge})`,
                    data: startNowData,
                    borderColor: '#16a34a', // green-600
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    fill: true,
                    tension: 0.2,
                },
                {
                    label: `Почати через ${delayYears} років (у ${startLaterAge})`,
                    data: startLaterData,
                    borderColor: '#ef4444', // red-500
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.2,
                },
            ],
        };

        const finalValueNow = startNowData[startNowData.length - 1] || 0;
        const finalValueLater = startLaterData[startLaterData.length - 1] || 0;
        const costOfDelay = finalValueNow - finalValueLater;

        return { chartData, finalValueNow, finalValueLater, costOfDelay };

    }, [monthlyInvestment, interestRate, currentAge, retirementAge, delayYears]);

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
            x: { title: { display: true, text: 'Вік' } },
        },
        interaction: { mode: 'index' as const, intersect: false },
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full p-4 flex justify-between items-center hover:bg-slate-50"
            >
                <div className="flex items-center gap-3">
                    <ClockIcon className="w-7 h-7 text-red-500" />
                    <h2 className="text-2xl font-bold text-slate-800">Калькулятор вартості очікування</h2>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>

            {!isCollapsed && (
                <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Controls */}
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Дізнайтеся, скільки ви можете втратити, відкладаючи інвестиції на потім. Навіть невеликі затримки можуть коштувати значних сум у довгостроковій перспективі.</p>
                         <div>
                            <label htmlFor="cod-monthly" className="block text-sm font-medium">Щомісячний внесок ({currency})</label>
                            <input type="number" id="cod-monthly" value={monthlyInvestment} onChange={(e) => setMonthlyInvestment(e.target.value)} className="mt-1 w-full rounded-md border-slate-300"/>
                        </div>
                        <div>
                            <label htmlFor="cod-rate" className="block text-sm font-medium">Річна відсоткова ставка (%)</label>
                            <input type="number" id="cod-rate" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="mt-1 w-full rounded-md border-slate-300"/>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label htmlFor="cod-age" className="block text-sm font-medium">Ваш вік</label>
                                <input type="number" id="cod-age" value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} className="mt-1 w-full rounded-md border-slate-300"/>
                            </div>
                             <div>
                                <label htmlFor="cod-delay" className="block text-sm font-medium">Затримка</label>
                                <input type="number" id="cod-delay" value={delayYears} onChange={(e) => setDelayYears(e.target.value)} className="mt-1 w-full rounded-md border-slate-300"/>
                            </div>
                            <div>
                                <label htmlFor="cod-retire" className="block text-sm font-medium">До віку</label>
                                <input type="number" id="cod-retire" value={retirementAge} onChange={(e) => setRetirementAge(e.target.value)} className="mt-1 w-full rounded-md border-slate-300"/>
                            </div>
                        </div>
                    </div>
                    {/* Results */}
                    <div className="space-y-4">
                         <div className="text-center bg-red-100/50 p-4 rounded-lg border border-red-200">
                             <p className="text-sm text-red-700">Втрачена вигода через очікування</p>
                             <p className="text-3xl font-bold text-red-600 mt-1">{formatDisplayAmount({ amountInUah: calculationResults.costOfDelay, targetCurrency: currency, rates, settings })}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="text-center bg-green-100/50 p-3 rounded-lg border border-green-200">
                                <p className="text-xs text-green-700">Капітал, якщо почати зараз</p>
                                <p className="font-semibold text-green-800">{formatDisplayAmount({ amountInUah: calculationResults.finalValueNow, targetCurrency: currency, rates, settings })}</p>
                            </div>
                            <div className="text-center bg-slate-100 p-3 rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-600">Капітал, якщо почати пізніше</p>
                                <p className="font-semibold text-slate-700">{formatDisplayAmount({ amountInUah: calculationResults.finalValueLater, targetCurrency: currency, rates, settings })}</p>
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

export default CostOfDelayCalculator;