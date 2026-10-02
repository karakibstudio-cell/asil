import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscribeToLiveContent, saveContentToDb } from '../services/firebase';
import { ContentItem } from '../types';

interface LiveContentContextType {
  contentMap: Record<string, ContentItem>;
  getContent: (key: string, fallback: string) => ContentItem;
  getContentText: (key: string, fallback: string) => string;
  updateContent: (key: string, newContent: string | Partial<ContentItem>) => Promise<void>;
  isEditMode: boolean;
  setIsEditMode: (enabled: boolean) => void;
  isAdminLoggedIn: boolean;
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
      onShowToast('تم تفعيل وضع التحرير المباشر. انقر على أيقونة القلم ✏️ لتعديل أي نص وتنسيقه مباشرة.', 'info');
    }
  }, [isAdminLoggedIn, onShowToast]);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToLiveContent((updatedMap) => {
      setContentMap(updatedMap);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Retrieve content item by key with fallback default text
  const getContent = useCallback((key: string, fallback: string): ContentItem => {
    if (contentMap && contentMap[key]) {
      const item = contentMap[key];
      return {
        key,
        text: item.text ?? fallback,
        color: item.color,
        fontSize: item.fontSize,
        fontWeight: item.fontWeight
      };
    }
    return { key, text: fallback };
  }, [contentMap]);

  // Convenience helper to get just text
  const getContentText = useCallback((key: string, fallback: string): string => {
    return getContent(key, fallback).text;
  }, [getContent]);

  // Update content in Firestore and emit toast
  const updateContent = useCallback(async (key: string, newContent: string | Partial<ContentItem>) => {
    const existing = contentMap[key] || { key, text: '' };
    const merged: ContentItem = typeof newContent === 'string'
      ? { ...existing, key, text: newContent }
      : { ...existing, key, ...newContent, text: newContent.text ?? existing.text };

    // Optimistic local state update
    setContentMap((prev) => ({ ...prev, [key]: merged }));

    try {
      await saveContentToDb(key, merged);
      if (onShowToast) {
        onShowToast('تم حفظ النص والتنسيق بنجاح', 'success');
      }
    } catch (err) {
      console.error('Failed to save content to Firestore:', err);
      if (onShowToast) {
        onShowToast('حدث خطأ أثناء حفظ التعديل، يرجى المحاولة مرة أخرى', 'error');
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
        isAdminLoggedIn
      }}
    >
      {children}
    </LiveContentContext.Provider>
  );
};

export function useLiveContent(): LiveContentContextType {
  const context = useContext(LiveContentContext);
  if (!context) {
    // Safe fallback if used outside provider
    return {
      contentMap: {},
      getContent: (key: string, fallback: string) => ({ key, text: fallback }),
      getContentText: (_key: string, fallback: string) => fallback,
      updateContent: async () => {},
      isEditMode: false,
      setIsEditMode: () => {},
      isAdminLoggedIn: false
    };
  }
  return context;
}
