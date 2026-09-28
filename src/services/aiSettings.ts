export type AIProviderId = 'auto' | 'gemini' | 'groq' | 'openai' | 'openrouter' | 'deepseek';

export interface AISettings {
  selectedProvider: AIProviderId;
  keys: {
    gemini?: string;
    groq?: string;
    openai?: string;
    openrouter?: string;
    deepseek?: string;
  };
}

export const AI_SETTINGS_STORAGE_KEY = 'primary_exam_ai_settings';

export const DEFAULT_AI_SETTINGS: AISettings = {
  selectedProvider: 'auto',
  keys: {},
};

export function loadAISettings(): AISettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;
  try {
    const raw = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        selectedProvider: parsed.selectedProvider || 'auto',
        keys: parsed.keys || {},
      };
    }
  } catch (e) {
    console.error('Failed to load AI settings:', e);
  }
  return DEFAULT_AI_SETTINGS;
}

export function saveAISettings(settings: AISettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('ai_settings_updated', { detail: settings }));
  } catch (e) {
    console.error('Failed to save AI settings:', e);
  }
}
