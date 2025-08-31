

import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CategoryGroup, IncomeCategory, InvestmentPlatformCategory } from './types';
import { BanknotesIcon, BriefcaseIcon, ComputerDesktopIcon, QuestionMarkCircleIcon, RocketLaunchIcon } from './components/icons';

export const ACCOUNT_TYPES = [
    { value: 'checking', label: 'Розрахунковий' },
    { value: 'savings', label: 'Накопичувальний' },
    { value: 'cash', label: 'Готівка' },
    { value: 'credit', label: 'Кредитна картка' },
    { value: 'investment', label: 'Інвестиційний' },
];

export const SUPPORTED_CURRENCIES = [
    { code: 'UAH', name: 'Українська гривня' },
    { code: 'USD', name: 'Долар США' },
    { code: 'PLN', name: 'Польський злотий' },
    { code: 'EUR', name: 'Євро' },
];

export const INITIAL_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: uuidv4(),
    name: "Щомісячні рахунки",
    categories: [
      { id: uuidv4(), name: "Оренда/Іпотека" },
      { id: uuidv4(), name: "Комунальні послуги" },
      { id: uuidv4(), name: "Інтернет та телефон" },
      { id: uuidv4(), name: "Підписки" },
    ],
  },
  {
    id: uuidv4(),
    name: "Щоденні витрати",
    categories: [
      { id: uuidv4(), name: "Продукти" },
      { id: uuidv4(), name: "Транспорт" },
      { id: uuidv4(), name: "Одяг" },
    ],
  },
  {
    id: uuidv4(),
    name: "Дозвілля та відпочинок",
    categories: [
       { id: uuidv4(), name: "Розваги" },
       { id: uuidv4(), name: "Відпустка" },
       { id: uuidv4(), name: "Харчування поза домом" },
    ]
  },
  {
    id: uuidv4(),
    name: "Накопичення та борги",
    categories: [
      { 
        id: uuidv4(), 
        name: "Фонд на випадок надзвичайних ситуацій", 
      },
      { id: uuidv4(), name: "Погашення боргу" },
      { id: uuidv4(), name: "Інші накопичення" },
    ],
  },
  {
    id: uuidv4(),
    name: "Інше",
    categories: [
      { id: uuidv4(), name: "Різне" },
    ]
  }
];

export const INCOME_SOURCE_CATEGORIES: {
    value: IncomeCategory;
    label: string;
    color: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
}[] = [
    { value: 'salary', label: 'Зарплата', color: 'bg-blue-100 text-blue-800', icon: BriefcaseIcon },
    { value: 'freelance', label: 'Фріланс', color: 'bg-indigo-100 text-indigo-800', icon: ComputerDesktopIcon },
    { value: 'side-hustle', label: 'Дод. заробіток', color: 'bg-purple-100 text-purple-800', icon: RocketLaunchIcon },
    { value: 'investments', label: 'Інвестиції', color: 'bg-green-100 text-green-800', icon: BanknotesIcon },
    { value: 'other', label: 'Інше', color: 'bg-slate-100 text-slate-800', icon: QuestionMarkCircleIcon },
];

export const INVESTMENT_PLATFORM_TYPES: { value: InvestmentPlatformCategory; label: string }[] = [
    { value: 'brokerage', label: 'Фондовий брокер' },
    { value: 'crypto', label: 'Крипто-біржа' },
    { value: 'robo-advisor', label: 'Робо-едвайзер' },
    { value: '401k', label: 'Пенсійний план' },
];