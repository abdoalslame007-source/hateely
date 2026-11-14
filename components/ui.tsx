"use client";

import { useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useSettings } from "../lib/SettingsProvider";

export const inputClass =
  "focus-ring w-full border border-gray-200 bg-gray-50 rounded-xl p-3.5 text-gray-900 placeholder:text-gray-400 focus:bg-white transition";

export const primaryBtn =
  "glow-btn grad-bg w-full text-white font-bold rounded-xl p-3.5 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition";

export const fileClass =
  "block w-full text-sm text-gray-600 file:me-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-semibold file:text-gray-700";

export type NavLink = { href: string; label: string; cta?: boolean };

export const BROKER_LINKS: NavLink[] = [
  { href: "/dashboard", label: "الطلبات" },
  { href: "/broker/rates", label: "الأسعار" },
  { href: "/broker/subscribe", label: "الاشتراك" },
];

export const ADMIN_LINKS: NavLink[] = [
  { href: "/admin", label: "الوسطاء" },
  { href: "/admin/subscriptions", label: "الاشتراكات" },
  { href: "/admin/settings", label: "الإعدادات" },
];

const PUBLIC_LINKS: NavLink[] = [
  { href: "/dashboard", label: "دخول الوسيط" },
  { href: "/broker/register", label: "انضم كوسيط", cta: true },
];

export function ShieldIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3l8 3v6c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function SiteHeader({
  links = PUBLIC_LINKS,
  onSignOut,
}: {
  links?: NavLink[];
  onSignOut?: () => void;
}) {
  const { settings } = useSettings();
  return (
    <header className="sticky top-0 z-30 bg-[#0b0614]/85 backdrop-blur-xl border-b border-white/10">
      {settings.announcement && (
        <div className="grad-bg text-white text-xs font-semibold text-center py-1.5 px-3">
          {settings.announcement}
        </div>
      )}
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 px-4 h-16">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <div className="grad-bg-br glow-btn w-9 h-9 rounded-xl text-white font-extrabold flex items-center justify-center">
            {settings.logo_letter}
          </div>
          <span className="font-extrabold text-xl text-white">{settings.site_name}</span>
        </a>
        <nav className="flex items-center gap-3 text-sm overflow-x-auto">
          {links.map((l) =>
            l.cta ? (
              <a key={l.href} href={l.href}
                className="grad-bg font-bold text-white rounded-full px-4 py-2 hover:brightness-110 active:scale-95 transition whitespace-nowrap">
                {l.label}
              </a>
            ) : (
              <a key={l.href} href={l.href}
                className="text-gray-300 hover:text-white whitespace-nowrap transition">
                {l.label}
              </a>
            )
          )}
          {onSignOut && (
            <button onClick={onSignOut}
              className="text-gray-400 hover:text-rose-400 whitespace-nowrap transition">
              خروج
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { settings } = useSettings();
  return (
    <footer className="bg-[#0b0614] border-t border-white/10 py-8 text-center text-xs text-gray-400 px-4">
      <p className="font-extrabold text-white text-base mb-1">{settings.site_name}</p>
      <p>{settings.footer_text}</p>
    </footer>
  );
}

export function PageShell({
  children, links, onSignOut, title, subtitle, size = "md",
}: {
  children: ReactNode;
  links?: NavLink[];
  onSignOut?: () => void;
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}) {
  const width = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-3xl" : "max-w-md";
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader links={links} onSignOut={onSignOut} />

      <div className="relative overflow-hidden bg-[#0b0614] px-4 pt-8 pb-20">
        <div className="blob absolute -top-24 -start-16 w-72 h-72 rounded-full blur-3xl" />
        <div className="blob-alt absolute -top-16 -end-20 w-64 h-64 rounded-full blur-3xl" />
        {title && (
          <div className={`relative mx-auto fade-up ${width}`}>
            <h1 className="text-2xl font-extrabold text-white">{title}</h1>
            {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          </div>
        )}
      </div>

      <main className="flex-1 px-4 pb-10 -mt-12 relative z-10">
        <div className={`mx-auto space-y-4 ${width}`}>{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg shadow-gray-900/5 border border-gray-100 p-4 ${className}`}>
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function Notice({
  type = "error", children,
}: {
  type?: "error" | "success" | "warning";
  children: ReactNode;
}) {
  const styles = {
    error: "bg-red-50 text-red-700 border-red-100",
    success: "bg-green-50 text-green-700 border-green-100",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
  };
  return (
    <p className={`text-sm rounded-xl border p-3 ${styles[type]}`}>{children}</p>
  );
}

export function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0614]">
      <div className="w-10 h-10 border-4 border-white/10 rounded-full animate-spin"
        style={{ borderTopColor: "var(--c2)" }} />
    </div>
  );
}

export function LoginCard({ title, subtitle }: { title: string; subtitle?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("البريد أو كلمة المرور غير صحيحة");
    setBusy(false);
  }

  return (
    <form onSubmit={handleLogin}
      className="bg-white rounded-3xl shadow-2xl shadow-gray-900/20 p-6 space-y-4">
      <div className="text-center space-y-1">
        <div className="grad-bg-br glow-btn w-14 h-14 mx-auto rounded-2xl text-white flex items-center justify-center">
          <ShieldIcon className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 pt-2">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <input type="email" required dir="ltr" value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="البريد الإلكتروني" className={inputClass} />
      <input type="password" required dir="ltr" value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="كلمة المرور" className={inputClass} />
      <button type="submit" disabled={busy} className={primaryBtn}>
        {busy ? "جاري الدخول..." : "دخول"}
      </button>
      {error && <Notice>{error}</Notice>}
    </form>
  );
}