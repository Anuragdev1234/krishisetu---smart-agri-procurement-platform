import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, 
  Check, 
  Volume2, 
  ChevronDown, 
  Sparkles,
  Languages
} from 'lucide-react';
import { useLanguage, LanguageCode } from '../../context/LanguageContext';
import { speechVoice } from '../../utils/speechVoice';

interface LanguageToggleProps {
  compact?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ compact = false }) => {
  const { currentLanguage, languageInfo, setLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code, true);
    setIsOpen(false);
  };

  const handlePlayGreeting = (e: React.MouseEvent, langCode: LanguageCode) => {
    e.stopPropagation();
    const lang = supportedLanguages.find(l => l.code === langCode);
    if (lang) {
      speechVoice.speak(lang.greeting, lang.speechLocale);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 text-xs font-semibold text-neutral-800 transition-all shadow-2xs active:scale-95"
        title="Switch Platform Language / भाषा बदलें"
        aria-expanded={isOpen}
      >
        <Languages className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        <span className="font-bold text-neutral-900 tracking-tight">
          {languageInfo.nativeName}
        </span>
        <span className="hidden xl:inline text-[10px] text-neutral-500 font-mono">
          ({languageInfo.code.toUpperCase()})
        </span>
        <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-neutral-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="p-3 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">Select UI Language (भाषा)</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              6 REGIONAL
            </span>
          </div>

          {/* Quick-Select Pills Bar */}
          <div className="p-2 bg-neutral-50 border-b border-neutral-200 flex flex-wrap gap-1">
            {supportedLanguages.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                    isSelected 
                      ? 'bg-emerald-800 text-white shadow-2xs' 
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {lang.nativeName}
                </button>
              );
            })}
          </div>

          {/* Detailed Language List */}
          <div className="p-1.5 max-h-72 overflow-y-auto divide-y divide-neutral-100">
            {supportedLanguages.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <div
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isSelected ? 'bg-emerald-50 text-emerald-950' : 'hover:bg-neutral-50 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">{lang.flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-neutral-900">
                          {lang.nativeName}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-medium">
                          ({lang.name})
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {lang.region}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Audio Preview Greeting Button */}
                    <button
                      type="button"
                      onClick={(e) => handlePlayGreeting(e, lang.code)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-emerald-700 hover:bg-emerald-100/60 transition-colors"
                      title={`Listen to greeting in ${lang.name}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Notice */}
          <div className="p-2.5 bg-neutral-50 border-t border-neutral-200 text-center text-[10px] text-neutral-500">
            Spoken announcements and screen text sync instantly.
          </div>

        </div>
      )}

    </div>
  );
};
