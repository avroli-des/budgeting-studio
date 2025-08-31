

import React, { useState } from 'react';
import { AppData } from '../types';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: AppData) => void;
}

const isValidAppData = (data: any): data is AppData => {
  return (
    data &&
    typeof data.appName === 'string' &&
    Array.isArray(data.categoryGroups) &&
    Array.isArray(data.transactions) &&
    Array.isArray(data.accounts) &&
    (Array.isArray(data.incomeSources) || data.incomeSources === undefined) && // Allow undefined for backward compatibility
    (typeof data.unlockedAchievements === 'object' || data.unlockedAchievements === undefined) && // Allow undefined
    (Array.isArray(data.investmentPlatforms) || data.investmentPlatforms === undefined) &&
    (typeof data.monthlyInvestmentTarget === 'number' || data.monthlyInvestmentTarget === undefined) &&
    data.categoryGroups.every((g: any) => typeof g.id === 'string' && typeof g.name === 'string' && Array.isArray(g.categories)) &&
    data.transactions.every((t: any) => typeof t.id === 'string' && typeof t.date === 'string' && typeof t.amount === 'number') &&
    data.accounts.every((a: any) => typeof a.id === 'string' && typeof a.name === 'string' && typeof a.balance === 'number')
  );
};


const ImportDataModal: React.FC<ImportDataModalProps> = ({ isOpen, onClose, onImport }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    setError('');
    if (!jsonInput.trim()) {
      setError('Будь ласка, вставте ваші дані у форматі JSON.');
      return;
    }

    try {
      const parsedData = JSON.parse(jsonInput);
      
      if (!isValidAppData(parsedData)) {
        setError('Неправильна структура JSON. Перевірте, чи файл містить обов\'язкові поля.');
        return;
      }
      
      onImport(parsedData);
      onClose();

    } catch (e) {
      setError('Неправильний формат JSON. Будь ласка, перевірте ваш файл на помилки синтаксису.');
      console.error(e);
    }
  };
  
  const handleClose = () => {
      setJsonInput('');
      setError('');
      onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl modal-enter" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Імпорт даних</h2>
        </div>
        
        <div className="p-6 space-y-4">
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg" role="alert">
                <p className="font-bold">Увага!</p>
                <p className="text-sm">Імпортування даних повністю **ЗАМІНИТЬ** усі ваші поточні бюджети, категорії та транзакції. Цю дію неможливо скасувати.</p>
            </div>

            <div>
              <label htmlFor="json-input" className="block text-sm font-medium text-slate-700 mb-1">
                Вставте ваші дані у форматі JSON:
              </label>
              <textarea
                id="json-input"
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                className="w-full h-64 p-2 border border-slate-300 rounded-md shadow-sm font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder={`{
  "appName": "Мій Новий Бюджет",
  "categoryGroups": [...],
  "transactions": [...],
  "accounts": [...],
  "incomeSources": [...],
  "monthlyGoals": {...},
  "unlockedAchievements": {...},
  "investmentPlatforms": [...],
  "monthlyInvestmentTarget": 10000,
  "currencySettings": {
    "default": "UAH",
    "reports": "UAH",
    "investments": "USD"
  }
}`}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
        </div>
        
        <div className="flex justify-end space-x-3 p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
          <button 
            type="button" 
            onClick={handleClose} 
            className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Скасувати
          </button>
          <button 
            type="button" 
            onClick={handleImport} 
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Імпортувати та замінити дані
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportDataModal;
