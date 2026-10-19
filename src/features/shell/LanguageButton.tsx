import React, { useState } from 'react';
import { Languages } from 'lucide-react';

/**
 * Google Translate (free widget), loaded only when the user asks for it —
 * no third-party script on first paint and no floating widget over the UI.
 */
export function LanguageButton() {
  const [loaded, setLoaded] = useState(false);
  const load = () => {
    if (loaded) return;
    setLoaded(true);
    (window as any).googleTranslateElementInit = () => {
      const g = (window as any).google;
      if (g?.translate) new g.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: 'en,te,hi,ur,ta,kn,mr', layout: g.translate.TranslateElement.InlineLayout.SIMPLE }, 'gt-slot');
    };
    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    s.onerror = () => setLoaded(false);
    document.body.appendChild(s);
  };
  return (
    <div className="flex items-center">
      {!loaded && (
        <button onClick={load} aria-label="Translate this page (Telugu, Hindi, Urdu…)" title="Translate"
          className="grid h-9 w-9 place-items-center rounded-full text-fg-muted hover:bg-surface-muted hover:text-fg">
          <Languages size={18} />
        </button>
      )}
      <div id="gt-slot" className="text-xs" />
    </div>
  );
}
