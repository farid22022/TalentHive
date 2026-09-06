import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';
const LocaleContext = createContext(null);
const defaults = { language: 'en', locale: 'en-US', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', currency: 'USD', region: 'US' };
export function LocaleProvider({ children }) { const [preferences, setPreferences] = useState(() => { try { return { ...defaults, ...JSON.parse(localStorage.getItem('localePreferences') || '{}') }; } catch { return defaults; } }); useEffect(() => { localStorage.setItem('localePreferences', JSON.stringify(preferences)); }, [preferences]); const update = async (patch) => { const next = { ...preferences, ...patch }; setPreferences(next); try { const response = await api.patch('/locale/preferences', patch); setPreferences(response.data.data.preferences); } catch { /* guests still retain local preferences */ } }; return <LocaleContext.Provider value={{ preferences, update }}>{children}</LocaleContext.Provider>; }
export const useLocale = () => useContext(LocaleContext);
