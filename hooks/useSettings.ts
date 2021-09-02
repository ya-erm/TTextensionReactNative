import { useEffect, useState } from 'react';
import { useStorage } from './useStorage';
import { UserAccount } from '/api/client';

export type ISettings = {
  token?: string;
  account?: UserAccount;
};

const defaultSettings: ISettings = {};

export const settingsStorageKey = '@TTE_Settings';

export function useSettings() {
  const [settings, setSettings] = useState<ISettings>(defaultSettings);

  const { getData, storeData } = useStorage();

  useEffect(() => {
    getData(settingsStorageKey).then((data) => {
      if (data != null) {
        setSettings(data);
      }
    });
  }, []);

  return {
    settings,
    setSettings: (data: Partial<ISettings>) => {
      const merged = { ...settings, ...data };
      setSettings(merged);
      storeData(settingsStorageKey, merged);
    },
    resetSettings: () => {
      setSettings(defaultSettings);
      storeData(settingsStorageKey, defaultSettings);
    },
  };
}
