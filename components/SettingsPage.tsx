import React, { useContext, useMemo, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Cog6ToothIcon, ArrowPathIcon } from './icons';
import { SUPPORTED_CURRENCIES } from '../constants';
import { Currency, CurrencySettings } from '../types';

interface SettingsPageProps {
    currencySettings: CurrencySettings;
    onUpdateCurrencySettings: (settings: CurrencySettings) => void;
}

const Section: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
                {children}
            </div>
        </div>
    </div>
);

const CurrencySettingsSection: React.FC<{ settings: CurrencySettings; onUpdate: (s: CurrencySettings) => void }> = ({ settings, onUpdate }) => {
    
    const handleSettingChange = (page: keyof CurrencySettings, value: Currency) => {
        onUpdate({
            ...settings,
            [page]: value,
        });
    };

    return (
        <Section
            title="Валюта за замовчуванням"
            description="Оберіть основну валюту для відображення на різних сторінках. Зміни будуть застосовані при наступному переході на сторінку."
        >
            <div>
                <label htmlFor="default-currency" className="block text-sm font-medium text-slate-700">Транзакції та Доходи</label>
                <select id="default-currency" value={settings.default} onChange={e => handleSettingChange('default', e.target.value as Currency)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="reports-currency" className="block text-sm font-medium text-slate-700">Звіти</label>
                <select id="reports-currency" value={settings.reports} onChange={e => handleSettingChange('reports', e.target.value as Currency)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="investments-currency" className="block text-sm font-medium text-slate-700">Інвестиції</label>
                <select id="investments-currency" value={settings.investments} onChange={e => handleSettingChange('investments', e.target.value as Currency)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                </select>
            </div>
        </Section>
    );
};

const ExchangeRateDashboard = () => {
    const { rates, lastUpdated, isRatesLoading, refreshRates } = useCurrency();

    return (
        <Section
            title="Курси валют"
            description="Поточні курси, що використовуються в додатку. Оновлюються автоматично раз на день."
        >
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">1 USD =</span>
                    <span className="font-mono font-semibold text-lg text-slate-800">{rates?.USD ? (1 / rates.USD).toFixed(4) : '...'} UAH</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">1 PLN =</span>
                    <span className="font-mono font-semibold text-lg text-slate-800">{rates?.PLN ? (1 / rates.PLN).toFixed(4) : '...'} UAH</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">1 EUR =</span>
                    <span className="font-mono font-semibold text-lg text-slate-800">{rates?.EUR ? (1 / rates.EUR).toFixed(4) : '...'} UAH</span>
                </div>
            </div>
             <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                <div className="text-xs text-slate-500">
                    <p>Останнє оновлення:</p>
                    <p>{lastUpdated ? new Date(lastUpdated).toLocaleString('uk-UA') : 'Ніколи'}</p>
                </div>
                <button
                    onClick={refreshRates}
                    disabled={isRatesLoading}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md shadow-sm text-white bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${isRatesLoading ? 'animate-spin' : ''}`} />
                    <span>{isRatesLoading ? 'Оновлення...' : 'Оновити'}</span>
                </button>
            </div>
        </Section>
    );
};

const ExchangeRateCalculator = () => {
    const [amount, setAmount] = useState('100');
    const [from, setFrom] = useState<Currency>('USD');
    const [to, setTo] = useState<Currency>('UAH');
    const { rates } = useCurrency();

    const convertedAmount = useMemo(() => {
        if (!rates || !amount) return 0;
        const numAmount = parseFloat(amount);
        const rateFromUAH = from === 'UAH' ? 1 : rates[from];
        const rateToUAH = to === 'UAH' ? 1 : rates[to];

        if (!rateFromUAH || !rateToUAH) return 0;

        // Convert 'from' amount to UAH first, then convert from UAH to 'to' currency
        const amountInUAH = numAmount / rateFromUAH;
        return amountInUAH * rateToUAH;

    }, [amount, from, to, rates]);
    
    return (
        <Section
            title="Калькулятор валют"
            description="Швидко конвертуйте суми між підтримуваними валютами за останнім збереженим курсом."
        >
             <div className="flex items-end gap-2">
                <div className="flex-grow">
                    <label htmlFor="amount-calc" className="block text-sm font-medium text-slate-700">Сума</label>
                    <input type="number" id="amount-calc" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300" />
                </div>
                <div className="w-28">
                    <label htmlFor="from-calc" className="block text-sm font-medium text-slate-700">З</label>
                    <select id="from-calc" value={from} onChange={e => setFrom(e.target.value as Currency)} className="mt-1 block w-full rounded-md border-slate-300">
                        {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                </div>
                 <div className="w-28">
                    <label htmlFor="to-calc" className="block text-sm font-medium text-slate-700">В</label>
                    <select id="to-calc" value={to} onChange={e => setTo(e.target.value as Currency)} className="mt-1 block w-full rounded-md border-slate-300">
                        {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                </div>
            </div>
            <div className="mt-4 text-center bg-slate-100 p-4 rounded-lg">
                <p className="text-sm text-slate-600">Результат</p>
                <p className="text-2xl font-bold text-slate-800">{convertedAmount.toFixed(2)} {to}</p>
            </div>
        </Section>
    );
};


const ProfileSection = () => {
    const { user } = useContext(AuthContext);
    if (!user) return null;
    
    return (
        <Section
            title="Профіль"
            description="Ваша особиста інформація з вашого Google акаунту."
        >
            <div className="flex items-center gap-4">
                <img src={user.picture} alt={user.name} className="h-16 w-16 rounded-full" />
                <div>
                    <p className="font-semibold text-lg text-slate-800">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                </div>
            </div>
        </Section>
    );
}

const SettingsPage: React.FC<SettingsPageProps> = ({ currencySettings, onUpdateCurrencySettings }) => {
  const handleToggleChange = (key: keyof CurrencySettings, value: boolean) => {
    onUpdateCurrencySettings({
        ...currencySettings,
        [key]: value,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex items-center gap-3">
            <Cog6ToothIcon className="w-8 h-8 text-slate-500" />
            <h1 className="text-3xl font-bold text-slate-800">Налаштування</h1>
        </div>

        <ProfileSection />
        <CurrencySettingsSection settings={currencySettings} onUpdate={onUpdateCurrencySettings} />
        
        <Section
            title="Налаштування відображення"
            description="Керуйте тим, як суми відображаються у додатку."
        >
            <div className="flex items-center justify-between">
                <span className="flex-grow flex flex-col">
                    <span className="text-sm font-medium text-slate-700">Округлювати суми до цілих</span>
                    <span className="text-xs text-slate-500">Приховувати копійки у всіх сумах.</span>
                </span>
                <label htmlFor="rounding-toggle" className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="rounding-toggle" checked={currencySettings.roundToWholeNumbers} onChange={(e) => handleToggleChange('roundToWholeNumbers', e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
            <div className="border-t border-slate-200 -mx-6"></div>
            <div className="flex items-center justify-between">
                <span className="flex-grow flex flex-col">
                    <span className="text-sm font-medium text-slate-700">Показувати оригінальну валюту</span>
                    <span className="text-xs text-slate-500">Напр., 400 PLN (was $100 USD).</span>
                </span>
                <label htmlFor="original-toggle" className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="original-toggle" checked={currencySettings.showOriginalCurrency} onChange={(e) => handleToggleChange('showOriginalCurrency', e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
        </Section>

        <ExchangeRateDashboard />
        <ExchangeRateCalculator />
    </div>
  );
};

export default React.memo(SettingsPage);