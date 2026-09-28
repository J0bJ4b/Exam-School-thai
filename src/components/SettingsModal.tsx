import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Cpu,
  Check,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Info,
  Trash2,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';
import {
  AIProviderId,
  AISettings,
  loadAISettings,
  saveAISettings,
} from '../services/aiSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

interface ProviderMeta {
  id: AIProviderId;
  name: string;
  badge: string;
  badgeColor: string;
  desc: string;
  recommendedModel: string;
  apiKeyName: keyof AISettings['keys'];
  keyPlaceholder: string;
  getKeyUrl: string;
  getKeyLabel: string;
  pricingTip: string;
}

export const PROVIDERS_META: ProviderMeta[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'ทางการ / แนะนำ',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    desc: 'โมเดล Gemini 3.8 / 3.1 Flash ภาษาไทยถูกต้อง สอดคล้องตามหลักสูตรแกนกลาง สพฐ.',
    recommendedModel: 'gemini-3.8-flash',
    apiKeyName: 'gemini',
    keyPlaceholder: 'AIzaSy...',
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    getKeyLabel: 'รับ API Key ฟรีที่ Google AI Studio',
    pricingTip: 'มีโควตาใช้งานฟรี เหมาะสำหรับโรงเรียนและครูไทย',
  },
  {
    id: 'groq',
    name: 'Groq (Llama 3.3)',
    badge: 'เร็วที่สุด ⚡',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    desc: 'ชิป LPU เร็วสุดขีด ออกข้อสอบ 20-30 ข้อใน 1-3 วินาที แทบไม่เคยติดคิว 503',
    recommendedModel: 'llama-3.3-70b-versatile',
    apiKeyName: 'groq',
    keyPlaceholder: 'gsk_...',
    getKeyUrl: 'https://console.groq.com/keys',
    getKeyLabel: 'รับ API Key ฟรีที่ Groq Console',
    pricingTip: 'มี Free Tier ฟรี รวดเร็วมาก แนะนำอย่างยิ่งสำหรับแก้ปัญหา Timeout',
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    badge: 'แม่นยำสูง',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    desc: 'โมเดล GPT-4o Mini เสถียรภาพสูงมาก ไวยากรณ์ข้อสอบและตัวเลือก ก ข ค ง คุณภาพเยี่ยม',
    recommendedModel: 'gpt-4o-mini',
    apiKeyName: 'openai',
    keyPlaceholder: 'sk-proj-...',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    getKeyLabel: 'รับ API Key ที่ OpenAI Platform',
    pricingTip: 'ราคาถูกมาก (เฉลี่ยไม่ถึง 0.10 บาทต่อชุดข้อสอบ 20 ข้อ)',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'รวมทุกค่าย',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    desc: 'เชื่อมต่อได้ทุกโมเดลในโลก (Claude 3.5, Llama 3, Gemini, Mistral) ผ่านบัญชีเดียว',
    recommendedModel: 'meta-llama/llama-3.3-70b-instruct',
    apiKeyName: 'openrouter',
    keyPlaceholder: 'sk-or-...',
    getKeyUrl: 'https://openrouter.ai/keys',
    getKeyLabel: 'รับ API Key ที่ OpenRouter',
    pricingTip: 'เหมาะสำหรับผู้ที่ต้องการความยืดหยุ่นสูง เติมเครดิตที่เดียวใช้ได้ทุกโมเดล',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    badge: 'เก่งวิทย์-คณิต',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    desc: 'โมเดล DeepSeek V3 ฉลาดและโดดเด่นมากในโจทย์การคำนวณและข้อสอบตรรกะประถม',
    recommendedModel: 'deepseek-chat',
    apiKeyName: 'deepseek',
    keyPlaceholder: 'sk-...',
    getKeyUrl: 'https://platform.deepseek.com/api_keys',
    getKeyLabel: 'รับ API Key ที่ DeepSeek Platform',
    pricingTip: 'ราคาประหยัดมาก คุ้มค่าและตอบโจทย์วิชาคณิตศาสตร์และวิทยาศาสตร์',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<AISettings>(loadAISettings());
  const [serverStatus, setServerStatus] = useState<Record<string, boolean>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadAISettings());
      fetch('/api/ai/providers')
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data === 'object') {
            setServerStatus(data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyChange = (providerKey: keyof AISettings['keys'], value: string) => {
    setSettings((prev) => ({
      ...prev,
      keys: {
        ...prev.keys,
        [providerKey]: value,
      },
    }));
  };

  const handleClearKey = (providerKey: keyof AISettings['keys']) => {
    setSettings((prev) => {
      const nextKeys = { ...prev.keys };
      delete nextKeys[providerKey];
      return {
        ...prev,
        keys: nextKeys,
      };
    });
  };

  const toggleShowKey = (providerId: string) => {
    setShowKeys((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }));
  };

  const handleSave = () => {
    saveAISettings(settings);
    setSavedSuccess(true);
    if (onSettingsSaved) onSettingsSaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 md:px-8 py-5 bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <span>ตั้งค่าโมเดล AI & API Keys</span>
              </h3>
              <p className="text-xs text-slate-400">
                กำหนดค่า API Key ของผู้ให้บริการแต่ละค่ายเพื่อใช้งานในระบบออกข้อสอบ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[72vh] overflow-y-auto">
          {/* Security Notice */}
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs flex items-start gap-3">
            <Info className="w-4 h-4 flex-shrink-0 text-indigo-400 mt-0.5" />
            <div className="leading-relaxed">
              <strong>ความปลอดภัยของข้อมูล:</strong> API Keys ที่คุณกรอกจะถูกบันทึกไว้ใน{' '}
              <span className="font-mono text-indigo-300">LocalStorage</span>{' '}
              ของเบราว์เซอร์เครื่องนี้เท่านั้น ไม่มีการเปิดเผยหรือส่งออกไปยังเซิร์ฟเวอร์ภายนอกอื่นใด นอกจากนี้หากตั้งค่าใน Vercel Environment Variables ไว้แล้วก็สามารถใช้งานร่วมกันได้ทันที
            </div>
          </div>

          {/* Default AI Provider Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>โมเดลเริ่มต้นที่ต้องการใช้งาน (Default AI Provider):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, selectedProvider: 'auto' }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.selectedProvider === 'auto'
                    ? 'bg-indigo-600/30 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                    : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Auto Smart</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    แนะนำ
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  สลับโมเดลอัตโนมัติเมื่อคิวเต็ม
                </p>
              </button>

              {PROVIDERS_META.map((meta) => {
                const isSelected = settings.selectedProvider === meta.id;
                return (
                  <button
                    key={meta.id}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, selectedProvider: meta.id }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                        : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate">{meta.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${meta.badgeColor}`}>
                        {meta.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate font-mono">
                      {meta.recommendedModel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Individual Provider API Keys */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>ระบุ API Key ของแต่ละผู้ให้บริการ:</span>
            </h4>

            {PROVIDERS_META.map((meta) => {
              const currentVal = settings.keys[meta.apiKeyName] || '';
              const isServerSet = Boolean(serverStatus[meta.apiKeyName]);
              const isShown = Boolean(showKeys[meta.id]);

              return (
                <div
                  key={meta.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-2.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{meta.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${meta.badgeColor}`}>
                        {meta.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isServerSet && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>ตั้งค่าบน Server แล้ว</span>
                        </span>
                      )}
                      <a
                        href={meta.getKeyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <span>{meta.getKeyLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{meta.desc}</p>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={isShown ? 'text' : 'password'}
                        value={currentVal}
                        onChange={(e) => handleKeyChange(meta.apiKeyName, e.target.value)}
                        placeholder={
                          isServerSet
                            ? `(มี Key บน Server แล้ว แต่สามารถใส่ Key เฉพาะเครื่องนี้ทับได้: ${meta.keyPlaceholder})`
                            : `ใส่ API Key ของ ${meta.name} เช่น ${meta.keyPlaceholder}`
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-indigo-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey(meta.id)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                        title={isShown ? 'ซ่อน' : 'แสดง'}
                      >
                        {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {currentVal && (
                      <button
                        type="button"
                        onClick={() => handleClearKey(meta.apiKeyName)}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                        title="ล้างคีย์นี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400/80" />
                    <span>{meta.pricingTip}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {savedSuccess ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> บันทึกการตั้งค่าสำเร็จ!
              </span>
            ) : (
              <span>การตั้งค่าจะมีผลทันทีในทุกชุดข้อสอบ</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs md:text-sm font-semibold transition-colors"
            >
              ปิด
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
