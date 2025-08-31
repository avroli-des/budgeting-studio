
import React, { useState, useEffect, useRef, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { PiggyBankIcon, GoogleIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, CloudArrowUpIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon } from './icons';
import { AuthContext } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '../constants';

interface HeaderProps {
  appName: string;
  onAppNameChange: (name: string) => void;
  onOpenImportModal: () => void;
  onExportAllData: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSaveChanges: () => void;
}

const UserMenu: React.FC<{ onOpenImportModal: () => void; onExportAllData: () => void }> = ({ onOpenImportModal, onExportAllData }) => {
    const { user, signOut, isLoading } = useContext(AuthContext);
    const { settings, updateSettings } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 transition-colors">
                <img src={user.picture} alt={user.name} className="h-8 w-8 rounded-full" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-30">
                    <div className="py-1">
                        <div className="px-4 py-2 border-b border-slate-200">
                            <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <button
                            onClick={() => {
                                onOpenImportModal();
                                setIsOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            <ArrowUpTrayIcon className="w-5 h-5 text-slate-500" />
                            <span>Імпорт даних</span>
                        </button>
                         <button
                            onClick={() => {
                                onExportAllData();
                                setIsOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5 text-slate-500" />
                            <span>Експорт даних</span>
                        </button>
                        <div className="py-1">
                          <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="px-4 py-3">
                            <label htmlFor="currency-select" className="block text-xs font-medium text-slate-500 mb-1">Валюта звітів</label>
                            <select
                                id="currency-select"
                                value={settings.reports}
                                onChange={(e) => updateSettings({ ...settings, reports: e.target.value as any })}
                                className="block w-full text-sm rounded-md border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-slate-900"
                            >
                                {SUPPORTED_CURRENCIES.map(c => (
                                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="py-1">
                          <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <button
                            onClick={signOut}
                            disabled={isLoading}
                            className="w-full text-left block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                            Вийти
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const Header: React.FC<HeaderProps> = ({ appName, onAppNameChange, onOpenImportModal, onExportAllData, hasUnsavedChanges, isSaving, onSaveChanges }) => {
  const { user, signIn, isLoading } = useContext(AuthContext);
  const activeLinkClass = 'bg-slate-100 text-blue-600';
  const inactiveLinkClass = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(appName);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setTempName(appName);
  }, [appName]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);
  
  const handleSave = () => {
    if (tempName.trim() && tempName.trim() !== appName) {
      onAppNameChange(tempName.trim());
    } else {
      setTempName(appName);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') {
      setTempName(appName);
      setIsEditing(false);
    }
  };

  const getSaveButtonText = () => {
    if (isSaving) return 'Збереження...';
    if (hasUnsavedChanges) return 'Зберегти зміни';
    return 'Збережено';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center min-w-0">
            <PiggyBankIcon className="h-8 w-8 text-blue-600 flex-shrink-0" />
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="text-lg sm:text-xl font-bold text-slate-800 ml-3 bg-white border border-blue-500 rounded-md px-2 py-1.5 outline-none truncate"
                disabled={!user}
              />
            ) : (
              <h1 
                className={`text-lg sm:text-xl font-bold text-slate-800 ml-3 px-2 py-1.5 rounded-md truncate ${user ? 'cursor-pointer hover:bg-slate-100' : 'cursor-default'}`} 
                onClick={() => user && setIsEditing(true)}
                title={user ? "Натисніть, щоб змінити назву" : "Назва бюджету"}
              >
                {appName}
              </h1>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Desktop Menu */}
            <div className="hidden sm:flex items-center space-x-2 sm:space-x-4">
                {user && (
                    <button
                        onClick={onSaveChanges}
                        disabled={!hasUnsavedChanges || isSaving}
                        className={`inline-flex items-center justify-center px-3 py-2 border text-sm font-medium rounded-md shadow-sm transition-all duration-150 disabled:cursor-not-allowed
                            ${
                                hasUnsavedChanges
                                ? 'bg-blue-600 text-white hover:bg-blue-700 border-transparent'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }
                        `}
                    >
                        <CloudArrowUpIcon className={`w-5 h-5 mr-2 -ml-1 ${isSaving ? 'animate-spin' : ''}`} />
                        <span>{getSaveButtonText()}</span>
                    </button>
                )}

                <nav className="flex items-center space-x-1 sm:space-x-2">
                    <NavLink to="/" end className={({ isActive }) => `px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                    Звіти
                    </NavLink>
                    <NavLink to="/transactions" className={({ isActive }) => `px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                    Транзакції
                    </NavLink>
                    <NavLink to="/income" className={({ isActive }) => `px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                    Доходи
                    </NavLink>
                    <NavLink to="/investment" className={({ isActive }) => `px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                    Інвестиції
                    </NavLink>
                    <NavLink to="/accounts" className={({ isActive }) => `px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                    Рахунки
                    </NavLink>
                </nav>
                <div className="w-px h-6 bg-slate-200" />
            </div>

            <NavLink
                to="/settings"
                className={({ isActive }) => `p-2 rounded-full transition-colors ${isActive ? 'bg-slate-200 text-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                title="Налаштування"
            >
                <Cog6ToothIcon className="w-6 h-6" />
            </NavLink>
            {user ? (
                <UserMenu onOpenImportModal={onOpenImportModal} onExportAllData={onExportAllData} />
            ) : (
                <button
                    onClick={signIn}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    <GoogleIcon className="w-5 h-5 mr-2 -ml-1" />
                    Увійти
                </button>
            )}
             {/* Mobile Menu Button */}
            <div className="flex items-center sm:hidden">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    type="button"
                    className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
                    aria-controls="mobile-menu"
                    aria-expanded={isMobileMenuOpen}
                >
                    <span className="sr-only">Відкрити головне меню</span>
                    {isMobileMenuOpen ? (
                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                </button>
            </div>
          </div>
        </div>
      </div>
       {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden border-t border-slate-200`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1">
            <NavLink to="/" end onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>
            Звіти
            </NavLink>
            <NavLink to="/transactions" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>
            Транзакції
            </NavLink>
            <NavLink to="/income" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>
            Доходи
            </NavLink>
            <NavLink to="/investment" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>
            Інвестиції
            </NavLink>
            <NavLink to="/accounts" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>
            Рахунки
            </NavLink>
        </div>
        {user && (
            <div className="pt-4 pb-3 border-t border-slate-200 px-4">
            <button
                onClick={() => { onSaveChanges(); setIsMobileMenuOpen(false); }}
                disabled={!hasUnsavedChanges || isSaving}
                className={`w-full inline-flex items-center justify-center px-3 py-2 border text-sm font-medium rounded-md shadow-sm transition-all duration-150 disabled:cursor-not-allowed
                    ${
                        hasUnsavedChanges
                        ? 'bg-blue-600 text-white hover:bg-blue-700 border-transparent'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }
                `}
            >
                <CloudArrowUpIcon className={`w-5 h-5 mr-2 -ml-1 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{getSaveButtonText()}</span>
            </button>
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;
