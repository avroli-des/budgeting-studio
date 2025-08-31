import React, { useState, useMemo, useEffect, useRef } from 'react';
import { InvestmentPlatform, Transaction, InvestmentPlatformCategory } from '../types';
import { formatDisplayAmount, getCurrencyClass } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { PlusIcon, BanknotesIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon } from './icons';
import { INVESTMENT_PLATFORM_TYPES } from '../constants';
import AddPlatformModal from './AddPlatformModal';
import UpdatePlatformValueModal from './UpdatePlatformValueModal';
import ConfirmationModal from './ConfirmationModal';

interface PlatformMenuProps {
  onEdit: () => void;
  onUpdateValue: () => void;
  onDelete: () => void;
}

const PlatformMenu: React.FC<PlatformMenuProps> = ({ onEdit, onUpdateValue, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded-full text-slate-500 hover:bg-slate-200">
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                        <button onClick={() => { onUpdateValue(); setIsOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                           <BanknotesIcon className="w-4 h-4 text-slate-500" /> Оновити вартість
                        </button>
                        <button onClick={() => { onEdit(); setIsOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            <PencilIcon className="w-4 h-4 text-slate-500" /> Редагувати
                        </button>
                        <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                            <TrashIcon className="w-4 h-4 text-red-500" /> Видалити
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

interface InvestmentPlatformsSectionProps {
  platforms: InvestmentPlatform[];
  transactions: Transaction[];
  onAddOrUpdatePlatform: (data: Omit<InvestmentPlatform, 'id'> | InvestmentPlatform) => void;
  onRemovePlatform: (platformId: string) => void;
}

const InvestmentPlatformsSection: React.FC<InvestmentPlatformsSectionProps> = ({ platforms, transactions, onAddOrUpdatePlatform, onRemovePlatform }) => {
    const { currency, rates, settings } = useCurrency();
    const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
    const [editingPlatform, setEditingPlatform] = useState<InvestmentPlatform | null>(null);
    const [isUpdateValueModalOpen, setIsUpdateValueModalOpen] = useState(false);
    const [platformToUpdate, setPlatformToUpdate] = useState<InvestmentPlatform | null>(null);
    const [platformToDelete, setPlatformToDelete] = useState<InvestmentPlatform | null>(null);

    const investedByPlatform = useMemo(() => {
        const invested = new Map<string, number>();
        transactions.forEach(t => {
            if (t.platformId && t.type === 'expense') {
                invested.set(t.platformId, (invested.get(t.platformId) || 0) + t.amount);
            }
        });
        return invested;
    }, [transactions]);
    
    const totalInvested = Array.from(investedByPlatform.values()).reduce((sum: number, val: number) => sum + val, 0);
    const totalCurrentValue = platforms.reduce((sum: number, p) => sum + (p.currentValue || 0), 0);
    const totalGainLoss = totalCurrentValue - totalInvested;

    const openAddPlatformModal = () => {
        setEditingPlatform(null);
        setIsPlatformModalOpen(true);
    };
    const openEditPlatformModal = (platform: InvestmentPlatform) => {
        setEditingPlatform(platform);
        setIsPlatformModalOpen(true);
    };
     const openUpdateValueModal = (platform: InvestmentPlatform) => {
        setPlatformToUpdate(platform);
        setIsUpdateValueModalOpen(true);
    };

    return (
        <>
            <div className="border-t border-slate-200 pt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">Інвестиційні платформи</h2>
                    <button onClick={openAddPlatformModal} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md shadow-sm text-white bg-slate-700 hover:bg-slate-800">
                        <PlusIcon className="w-4 h-4" /> Додати платформу
                    </button>
                </div>
                {platforms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {platforms.map(p => {
                            const invested = investedByPlatform.get(p.id) || 0;
                            const gainLoss = (p.currentValue || 0) - invested;
                            const categoryLabel = INVESTMENT_PLATFORM_TYPES.find(t => t.value === p.category)?.label || p.category;
                            return (
                                <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-800">{p.name}</h3>
                                            <p className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">{categoryLabel}</p>
                                        </div>
                                        <PlatformMenu onEdit={() => openEditPlatformModal(p)} onDelete={() => setPlatformToDelete(p)} onUpdateValue={() => openUpdateValueModal(p)} />
                                    </div>
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-xs text-slate-500">Інвестовано</p>
                                            <p className="font-semibold text-slate-700">{formatDisplayAmount({ amountInUah: invested, targetCurrency: currency, rates, settings })}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Поточна вартість</p>
                                            <p className="font-semibold text-blue-600">{formatDisplayAmount({ amountInUah: p.currentValue || 0, targetCurrency: currency, rates, settings })}</p>
                                        </div>
                                         <div>
                                            <p className="text-xs text-slate-500">Прибуток/Збиток</p>
                                            <p className={`font-semibold ${getCurrencyClass(gainLoss)}`}>{formatDisplayAmount({ amountInUah: gainLoss, targetCurrency: currency, rates, settings })}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-slate-500 p-8">Додайте платформи, на яких ви інвестуєте.</p>
                )}
            </div>
             <AddPlatformModal 
                isOpen={isPlatformModalOpen}
                onClose={() => setIsPlatformModalOpen(false)}
                onSave={onAddOrUpdatePlatform}
                platformToEdit={editingPlatform}
            />
            {platformToUpdate && (
                 <UpdatePlatformValueModal
                    isOpen={isUpdateValueModalOpen}
                    onClose={() => setIsUpdateValueModalOpen(false)}
                    onSave={onAddOrUpdatePlatform}
                    platform={platformToUpdate}
                 />
            )}
            {platformToDelete && (
                 <ConfirmationModal
                    isOpen={!!platformToDelete}
                    onClose={() => setPlatformToDelete(null)}
                    onConfirm={() => { onRemovePlatform(platformToDelete.id); setPlatformToDelete(null); }}
                    title={`Видалити платформу "${platformToDelete.name}"?`}
                    message="Транзакції, пов'язані з цією платформою, не буде видалено."
                />
            )}
        </>
    );
};

export default InvestmentPlatformsSection;
