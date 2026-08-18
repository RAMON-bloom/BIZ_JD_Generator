import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppSettingsDocument, ExtractionConfig, MediaPreset, ScoutConfig } from '../types';
import { buildDefaultPreset } from '../constants/defaultPresets';

const STORAGE_KEY = 'jd-scout-handler-settings';

export type PresetTab = 'extract' | 'scout';

const genId = () => `preset_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

const loadFromStorage = (): AppSettingsDocument => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppSettingsDocument;
      if (parsed && Array.isArray(parsed.presets) && parsed.presets.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  const defaultPreset = buildDefaultPreset(genId(), 'デフォルト');
  return {
    schemaVersion: 1,
    presets: [defaultPreset],
    activePresetIdByTab: { extract: defaultPreset.id, scout: defaultPreset.id },
  };
};

interface PresetContextValue {
  document: AppSettingsDocument;
  presets: MediaPreset[];
  activePreset: (tab: PresetTab) => MediaPreset;
  setActivePresetId: (tab: PresetTab, presetId: string) => void;
  addPreset: (name: string) => MediaPreset;
  duplicatePreset: (presetId: string) => MediaPreset | null;
  renamePreset: (presetId: string, name: string) => void;
  deletePreset: (presetId: string) => void;
  updateExtractionConfig: (presetId: string, config: ExtractionConfig) => void;
  updateScoutConfig: (presetId: string, config: ScoutConfig) => void;
}

const PresetContext = createContext<PresetContextValue | null>(null);

export const PresetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [document, setDocument] = useState<AppSettingsDocument>(() => loadFromStorage());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [document]);

  const activePreset = useCallback((tab: PresetTab): MediaPreset => {
    const activeId = document.activePresetIdByTab[tab];
    return document.presets.find(p => p.id === activeId) ?? document.presets[0];
  }, [document]);

  const setActivePresetId = useCallback((tab: PresetTab, presetId: string) => {
    setDocument(prev => ({
      ...prev,
      activePresetIdByTab: { ...prev.activePresetIdByTab, [tab]: presetId },
    }));
  }, []);

  const addPreset = useCallback((name: string): MediaPreset => {
    const preset = buildDefaultPreset(genId(), name);
    setDocument(prev => ({ ...prev, presets: [...prev.presets, preset] }));
    return preset;
  }, []);

  const duplicatePreset = useCallback((presetId: string): MediaPreset | null => {
    let created: MediaPreset | null = null;
    setDocument(prev => {
      const source = prev.presets.find(p => p.id === presetId);
      if (!source) return prev;
      const now = new Date().toISOString();
      created = {
        ...source,
        id: genId(),
        name: `${source.name}のコピー`,
        createdAt: now,
        updatedAt: now,
      };
      return { ...prev, presets: [...prev.presets, created] };
    });
    return created;
  }, []);

  const renamePreset = useCallback((presetId: string, name: string) => {
    setDocument(prev => ({
      ...prev,
      presets: prev.presets.map(p => p.id === presetId ? { ...p, name, updatedAt: new Date().toISOString() } : p),
    }));
  }, []);

  const deletePreset = useCallback((presetId: string) => {
    setDocument(prev => {
      if (prev.presets.length <= 1) return prev;
      const remaining = prev.presets.filter(p => p.id !== presetId);
      const fallbackId = remaining[0].id;
      const nextActive = { ...prev.activePresetIdByTab };
      (Object.keys(nextActive) as PresetTab[]).forEach(tab => {
        if (nextActive[tab] === presetId) nextActive[tab] = fallbackId;
      });
      return { ...prev, presets: remaining, activePresetIdByTab: nextActive };
    });
  }, []);

  const updateExtractionConfig = useCallback((presetId: string, config: ExtractionConfig) => {
    setDocument(prev => ({
      ...prev,
      presets: prev.presets.map(p => p.id === presetId ? { ...p, extraction: config, updatedAt: new Date().toISOString() } : p),
    }));
  }, []);

  const updateScoutConfig = useCallback((presetId: string, config: ScoutConfig) => {
    setDocument(prev => ({
      ...prev,
      presets: prev.presets.map(p => p.id === presetId ? { ...p, scout: config, updatedAt: new Date().toISOString() } : p),
    }));
  }, []);

  const value = useMemo<PresetContextValue>(() => ({
    document,
    presets: document.presets,
    activePreset,
    setActivePresetId,
    addPreset,
    duplicatePreset,
    renamePreset,
    deletePreset,
    updateExtractionConfig,
    updateScoutConfig,
  }), [document, activePreset, setActivePresetId, addPreset, duplicatePreset, renamePreset, deletePreset, updateExtractionConfig, updateScoutConfig]);

  return <PresetContext.Provider value={value}>{children}</PresetContext.Provider>;
};

export const usePresets = (): PresetContextValue => {
  const ctx = useContext(PresetContext);
  if (!ctx) throw new Error('usePresets must be used within a PresetProvider');
  return ctx;
};
