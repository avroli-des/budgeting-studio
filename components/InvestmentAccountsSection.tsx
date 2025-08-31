

import React from 'react';
import { Account } from '../types';
import { formatDisplayAmount, getCurrencyClass } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { BanknotesIcon } from './icons';

interface InvestmentAccountsSectionProps {
  accounts: Account[];
}

const InvestmentAccountsSection: React.FC<InvestmentAccountsSectionProps> = ({ accounts }) => {
    const { currency, rates, settings } = useCurrency();
    const totalValue = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="border-t border-slate-200 pt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <BanknotesIcon className="w-7 h-7 text-green-600" />
            Інвестиційні рахунки
        </h2>
        <div className="text-right">
            <p className="text-sm text-slate-500">Загальна вартість</p>
            <p className="text-xl font-bold text-slate-800">{formatDisplayAmount({ amountInUah: totalValue, targetCurrency: currency, rates, settings })}</p>
        </div>
      </div>
      {accounts.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <ul className="divide-y divide-slate-200">
            {accounts.map(account => (
              <li key={account.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-800">{account.name}</p>
                  <p className="text-sm text-slate-500 capitalize">{account.type}</p>
                </div>
                <p className={`text-lg font-mono font-semibold ${getCurrencyClass(account.balance)}`}>
                  {formatDisplayAmount({ amountInUah: account.balance, targetCurrency: currency, rates, settings })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center p-8 bg-white rounded-lg border border-dashed border-slate-300">
            <p className="text-slate-500">У вас немає інвестиційних рахунків.</p>
            <p className="text-sm text-slate-400 mt-1">Додайте їх на сторінці "Рахунки".</p>
        </div>
      )}
    </div>
  );
};

export default InvestmentAccountsSection;