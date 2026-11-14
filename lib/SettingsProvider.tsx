"use client";

import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from "react";
import { supabase } from "./supabase";

export type Settings = {
  site_name: string;
  logo_letter: string;
  theme: string;
  hero_badge: string;
  hero_title: string;
  hero_highlight: string;
  hero_subtitle: string;
  whatsapp_number: string;
  footer_text: string;
  announcement: string;
};

export const DEFAULTS: Settings = {
  site_name: "هاتلي",
  logo_letter: "ه",
  theme: "pink",
  hero_badge: "وسطاء موثقون بالهوية",
  hero_title: "اشترِ من شي إن",
  hero_highlight: "بأفضل سعر في مصر",
  hero_subtitle:
    "أدخل رابط المنتج وسعره، وشاهد عروض الوسطاء جنباً إلى جنب، ثم اختر الأنسب لك.",
  whatsapp_number: "",
  footer_text: "منصة وسيطة تربطك بوسطاء موثقين. هاتلي ليست تابعة لشي إن.",
  announcement: "",
};

export const THEMES: Record<string, { name: string; c: [string, string, string] }> = {
  pink: { name: "وردي بنفسجي", c: ["#f43f5e", "#c026d3", "#7c3aed"] },
  blue: { name: "أزرق", c: ["#0ea5e9", "#2563eb", "#4f46e5"] },
  green: { name: "أخضر", c: ["#10b981", "#059669", "#0d9488"] },
  gold: { name: "ذهبي برتقالي", c: ["#f59e0b", "#ea580c", "#dc2626"] },
  purple: { name: "بنفسجي", c: ["#a855f7", "#7c3aed", "#4f46e5"] },
  red: { name: "أحمر", c: ["#ef4444", "#dc2626", "#9f1239"] },
};

export function applyTheme(key: string) {
  const t = THEMES[key] ?? THEMES.pink;
  const s = document.documentElement.style;
  s.setProperty("--c1", t.c[0]);
  s.setProperty("--c2", t.c[1]);
  s.setProperty("--c3", t.c[2]);
}

type Ctx = { settings: Settings; loaded: boolean; refresh: () => Promise<void> };

const SettingsContext = createContext<Ctx>({
  settings: DEFAULTS,
  loaded: false,
  refresh: async () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (data) {
      const merged = { ...DEFAULTS, ...data } as Settings;
      setSettings(merged);
      applyTheme(merged.theme);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const wa = settings.whatsapp_number;

  return (
    <SettingsContext.Provider value={{ settings, loaded, refresh }}>
      {children}
      {/^01[0-9]{9}$/.test(wa) && (
        <a
          href={`https://wa.me/20${wa.slice(1)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="واتساب"
          className="fixed bottom-5 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-2xl shadow-lg shadow-green-900/40 transition hover:scale-110 active:scale-95"
        >
          💬
        </a>
      )}
    </SettingsContext.Provider>
  );
}