
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
'use-client';
import { useLocation } from 'react-router-dom';
import { CachedRates, ExchangeRates, Currency, CurrencySettings } from '../types';

interface CurrencyContextType {
  currency: Currency;
  rates: ExchangeRates | null;
  lastUpdated: string | null;
  isRatesLoading: boolean;
  refreshRates: () => Promise<void>;
  settings: CurrencySettings;
  updateSettings: (settings: CurrencySettings) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const useLocalStorageRates = (): [CachedRates | null, React.Dispatch<React.SetStateAction<CachedRates | null>>] => {
  const [storedValue, setStoredValue] = useState<CachedRates | null>(() => {
    try {
      const item = window.localStorage.getItem('exchangeRatesCache');
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  });

  useEffect(() => {
    try {
      if (storedValue) {
        window.localStorage.setItem('exchangeRatesCache', JSON.stringify(storedValue));
      } else {
        window.localStorage.removeItem('exchangeRatesCache');
      }
    } catch (error) {
      console.error(error);
    }
  }, [storedValue]);

  return [storedValue, setStoredValue];
};


export const CurrencyProvider: React.FC<{ children: React.ReactNode, settings: CurrencySettings, onSettingsUpdate: (s: CurrencySettings) => void }> = ({ children, settings, onSettingsUpdate }) => {
  const [cachedRates, setCachedRates] = useLocalStorageRates();
  const [isRatesLoading, setIsRatesLoading] = useState(false);
  const location = useLocation();

  const currency = useMemo(() => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('/reports')) {
      return settings.reports;
    } else if (path.startsWith('/investment')) {
      return settings.investments;
    }
    return settings.default;
  }, [location.pathname, settings]);

  const fetchAndCacheRates = useCallback(async () => {
    setIsRatesLoading(true);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/UAH');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const relevantRates = { 'USD': data.rates.USD, 'PLN': data.rates.PLN, 'EUR': data.rates.EUR, 'UAH': 1 };
      setCachedRates({ rates: relevantRates, lastUpdated: new Date().toISOString() });
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);
    } finally {
      setIsRatesLoading(false);
    }
  }, [setCachedRates]);

  useEffect(() => {
    const shouldUpdateRates = () => {
      if (!cachedRates || !cachedRates.lastUpdated) return true;
      const lastUpdateDate = new Date(cachedRates.lastUpdated).toDateString();
      const today = new Date().toDateString();
      return lastUpdateDate !== today;
    };
    if (shouldUpdateRates()) {
      fetchAndCacheRates();
    }
  }, [fetchAndCacheRates, cachedRates]);

  return (
    <CurrencyContext.Provider value={{ 
        currency, 
        rates: cachedRates?.rates ?? null,
        lastUpdated: cachedRates?.lastUpdated ?? null,
        isRatesLoading,
        refreshRates: fetchAndCacheRates,
        settings,
        updateSettings: onSettingsUpdate,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
