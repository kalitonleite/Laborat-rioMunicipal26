
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/apiService';

interface Settings {
  appLogo: string | null;
}

interface SettingsContextType extends Settings {
  updateLogo: (newLogoBase64: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const settings = await dbService.from('lab_settings').select({ key: 'app_logo' });
      if (settings && settings.length > 0 && settings[0].value && settings[0].value.url) {
        setAppLogo(settings[0].value.url);
      } else {
        setAppLogo('/assets/logo-uarini.png'); // Default fallback
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setAppLogo('/assets/logo-uarini.png'); // Default fallback on error
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLogo = async (newLogoBase64: string) => {
    try {
      const existing = await dbService.from('lab_settings').select({ key: 'app_logo' });
      
      if (existing && existing.length > 0) {
        await dbService.from('lab_settings').update(
          { value: { url: newLogoBase64 }, updated_at: new Date().toISOString() },
          { key: 'app_logo' }
        );
      } else {
        await dbService.from('lab_settings').insert({
          key: 'app_logo',
          value: { url: newLogoBase64 },
          updated_at: new Date().toISOString()
        });
      }
      setAppLogo(newLogoBase64);
    } catch (error) {
      console.error('Error updating logo:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ appLogo, updateLogo, refreshSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

