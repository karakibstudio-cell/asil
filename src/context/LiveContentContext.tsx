import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { subscribeToLiveContent, saveContentToDb, migrateInitialTextsToDatabase } from '../services/firebase';
import { fetchLiveContentFromSupabase } from '../services/supabase';
import { DICTIONARY } from './LanguageContext';
import { ContentItem } from '../types';

interface LiveContentContextType {
  contentMap: Record<string, ContentItem>;
  getContent: (key: string, fallback: string) => ContentItem;
  getContentText: (key: string, fallback: string, lang?: 'ar' | 'en') => string;
  updateContent: (key: string, newContent: string | Partial<ContentItem>, lang?: 'ar' | 'en') => Promise<void>;
  isEditMode: boolean;
  setIsEditMode: (enabled: boolean) => void;
  isAdminLoggedIn: boolean;
  refreshContent: () => Promise<void>;
}

const LiveContentContext = createContext<LiveContentContextType | undefined>(undefined);

interface LiveContentProviderProps {
  children: React.ReactNode;
  isAdminLoggedIn: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LiveContentProvider: React.FC<LiveContentProviderProps> = ({
  children,
  isAdminLoggedIn,
  onShowToast
}) => {
  const [contentMap, setContentMap] = useState<Record<string, ContentItem>>(() => {
    try {
      const cached = localStorage.getItem('diy_live_content');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const [isEditMode, setIsEditModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('diy_edit_mode') === 'true';
    } catch {
      return false;
    }
  });

  const initialFetchAttempted = useRef(false);
  const initialMigrationAttempted = useRef(false);

  // Keep Edit Mode turned off if user is not logged in as Admin
  useEffect(() => {
    if (!isAdminLoggedIn && isEditMode) {
      setIsEditModeState(false);
      try {
        localStorage.setItem('diy_edit_mode', 'false');
      } catch {}
    }
  }, [isAdminLoggedIn, isEditMode]);

  const setIsEditMode = useCallback((enabled: boolean) => {
    if (!isAdminLoggedIn && enabled) {
      return;
    }
    setIsEditModeState(enabled);
    try {
      localStorage.setItem('diy_edit_mode', enabled ? 'true' : 'false');
    } catch {}
    if (enabled && onShowToast) {
      onShowToast('تم تفعيل وضع التحرير المباشر. انقر على أيقونة القلم ✏️ لتعديل أي نص وتنسيقه مباشرة في اللغة المعروضة.', 'info');
    }
  }, [isAdminLoggedIn, onShowToast]);

  // Subscribe to real-time updates from database only in admin or edit mode
  // Public visitors use fast IndexedDB/localStorage cache + version sync to save reads
  useEffect(() => {
    let isMounted = true;

    if (!isAdminLoggedIn && !isEditMode) {
      // Non-admin: fetch once if local cache is empty, without open listeners
      if (!initialFetchAttempted.current) {
        initialFetchAttempted.current = true;
        fetchLiveContentFromSupabase().then(fresh => {
          if (isMounted && fresh && Object.keys(fresh).length > 0) {
            setContentMap(prev => ({ ...prev, ...fresh }));
          }
        }).catch(() => {});
      }
      return () => {
        isMounted = false;
      };
    }

    const unsubscribe = subscribeToLiveContent((updatedMap) => {
      if (!isMounted) return;
      setContentMap(prev => {
        let hasChanges = false;
        for (const [k, v] of Object.entries(updatedMap)) {
          const p = prev[k];
          if (!p || p.text !== v.text || p.ar !== v.ar || p.en !== v.en || p.color !== v.color) {
            hasChanges = true;
            break;
          }
        }
        return hasChanges ? { ...prev, ...updatedMap } : prev;
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isAdminLoggedIn, isEditMode]);

  // Migrate initial hard-coded dictionary texts into the database so nothing disappears - ADMIN ONLY
  useEffect(() => {
    if (isAdminLoggedIn && !initialMigrationAttempted.current) {
      initialMigrationAttempted.current = true;
      migrateInitialTextsToDatabase(DICTIONARY).catch(() => {});
    }
  }, [isAdminLoggedIn]);

  // Manual refresh helper
  const refreshContent = useCallback(async () => {
    try {
      const fresh = await fetchLiveContentFromSupabase();
      if (fresh && Object.keys(fresh).length > 0) {
        setContentMap(prev => ({ ...prev, ...fresh }));
      }
    } catch (e) {
      console.warn('Failed to refresh content from Supabase:', e);
    }
  }, []);

  // Retrieve full content item by key with fallback default text
  const getContent = useCallback((key: string, fallback: string): ContentItem => {
    if (contentMap && contentMap[key]) {
      const item = contentMap[key];
      return {
        key,
        text: item.text ?? fallback,
        ar: item.ar ?? item.text ?? fallback,
        en: item.en,
        color: item.color,
        fontSize: item.fontSize,
        fontWeight: item.fontWeight,
        updatedAt: item.updatedAt
      };
    }
    return { key, text: fallback, ar: fallback };
  }, [contentMap]);

  // Convenience helper implementing strict display order:
  // 1. Saved text for current language
  // 2. Default text from translation files (DICTIONARY or props)
  // 3. Fallback language (saved text -> translation file)
  const getContentText = useCallback((key: string, fallback: string, lang: 'ar' | 'en' = 'ar'): string => {
    const otherLang: 'ar' | 'en' = lang === 'ar' ? 'en' : 'ar';
    const item = contentMap?.[key];

    // 1. Saved text for current language
    const savedCurrent = item?.[lang] || (lang === 'ar' ? item?.text : undefined);
    if (savedCurrent && savedCurrent.trim()) {
      return savedCurrent;
    }

    // 2. Default text from translation files for current language
    const dictCurrent = DICTIONARY[key]?.[lang];
    if (dictCurrent && dictCurrent.trim()) {
      return dictCurrent;
    }
    if (lang === 'ar' && fallback && fallback.trim()) {
      return fallback;
    }

    // 3. Fallback language: saved text -> default dictionary text -> fallback prop
    const savedFallback = item?.[otherLang] || (otherLang === 'ar' ? item?.text : undefined);
    if (savedFallback && savedFallback.trim()) {
      return savedFallback;
    }

    const dictFallback = DICTIONARY[key]?.[otherLang];
    if (dictFallback && dictFallback.trim()) {
      return dictFallback;
    }

    return fallback || key;
  }, [contentMap]);

  // Update content in database and emit toast
  const updateContent = useCallback(async (
    key: string, 
    newContent: string | Partial<ContentItem>,
    lang: 'ar' | 'en' = 'ar'
  ) => {
    const existing = contentMap[key] || { key, text: '' };
    const textVal = typeof newContent === 'string' ? newContent : (newContent.text ?? (newContent[lang] || ''));
    
    const merged: ContentItem = typeof newContent === 'string'
      ? {
          ...existing,
          key,
          [lang]: textVal,
          text: lang === 'ar' ? textVal : (existing.ar || existing.text || textVal),
          updatedAt: Date.now()
        }
      : {
          ...existing,
          key,
          ...newContent,
          [lang]: textVal,
          text: lang === 'ar' ? textVal : (existing.ar || existing.text || textVal),
          updatedAt: Date.now()
        };

    // Optimistic local state update
    setContentMap((prev) => ({ ...prev, [key]: merged }));

    try {
      await saveContentToDb(key, merged, lang);
      if (onShowToast) {
        onShowToast(`تم حفظ وتحديث النص باللغة ${lang === 'ar' ? 'العربية' : 'الإنجليزية'} في قاعدة البيانات بنجاح`, 'success');
      }
    } catch (err) {
      console.error('Failed to save content to database:', err);
      if (onShowToast) {
        onShowToast('حدث خطأ أثناء حفظ التعديل في قاعدة البيانات', 'error');
      }
      throw err;
    }
  }, [contentMap, onShowToast]);

  return (
    <LiveContentContext.Provider
      value={{
        contentMap,
        getContent,
        getContentText,
        updateContent,
        isEditMode: isAdminLoggedIn && isEditMode,
        setIsEditMode,
        isAdminLoggedIn,
        refreshContent
      }}
    >
      {children}
    </LiveContentContext.Provider>
  );
};

export function useLiveContent(): LiveContentContextType {
  const context = useContext(LiveContentContext);
  if (!context) {
    return {
      contentMap: {},
      getContent: (key: string, fallback: string) => ({ key, text: fallback, ar: fallback }),
      getContentText: (_key: string, fallback: string) => fallback,
      updateContent: async () => {},
      isEditMode: false,
      setIsEditMode: () => {},
      isAdminLoggedIn: false,
      refreshContent: async () => {}
    };
  }
  return context;
}
