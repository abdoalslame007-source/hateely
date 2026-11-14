"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useSession } from "../../../lib/useSession";
import {
  useSettings, THEMES, applyTheme, type Settings,
} from "../../../lib/SettingsProvider";
import {
  PageShell, Card, Field, Notice, LoginCard, Loading,
  inputClass, primaryBtn, ADMIN_LINKS,
} from "../../../components/ui";

export default function AdminSettings() {
  const { session, checking } = useSession();
  const { settings, refresh } = useSettings();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      setAdminChecked(false);
      return;
    }
    supabase.rpc("is_admin").then(({ data }) => {
      setIsAdmin(data === true);
      setAdminChecked(true);
    });
  }, [session]);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function pickTheme(key: string) {
    set("theme", key);
    applyTheme(key); // معاينة فورية
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (form.whatsapp_number && !/^01[0-9]{9}$/.test(form.whatsapp_number)) {
      return setError("رقم الواتساب يجب أن يكون رقم موبايل مصري من 11 رقم، أو اتركه فارغاً");
    }
    if (!form.site_name.trim() || !form.logo_letter.trim()) {
      return setError("اسم الموقع وحرف الشعار مطلوبان");
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("site_settings")
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .select();
    if (error || !data || data.length === 0) {
      setError("تعذر الحفظ، تأكد أنك مسجّل كأدمن");
    } else {
      await refresh();
      setMessage("تم الحفظ، والتغييرات ظاهرة الآن في الموقع");
    }
    setSaving(false);
  }

  if (checking || (session && !adminChecked)) return <Loading />;

  if (!session) {
    return (
      <PageShell size="sm">
        <LoginCard title="دخول الأدمن" subtitle="لوحة إدارة الموقع" />
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell onSignOut={() => supabase.auth.signOut()}>
        <Notice type="warning">هذا الحساب ليس أدمن.</Notice>
      </PageShell>
    );
  }

  return (
    <PageShell links={ADMIN_LINKS} onSignOut={() => supabase.auth.signOut()}
      title="إعدادات الموقع" subtitle="كل تغيير هنا يظهر مباشرة للزوار">
      <form onSubmit={save} className="space-y-4">
        <Card className="space-y-4">
          <h2 className="font-bold text-gray-900">المظهر</h2>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(THEMES).map(([key, t]) => (
              <button key={key} type="button" onClick={() => pickTheme(key)}
                className={`rounded-xl border-2 p-2 text-xs font-semibold text-gray-700 transition ${
                  form.theme === key ? "border-gray-900" : "border-gray-200"
                }`}>
                <div className="h-8 rounded-lg mb-1.5"
                  style={{ backgroundImage: `linear-gradient(to left, ${t.c[0]}, ${t.c[1]}, ${t.c[2]})` }} />
                {t.name}
              </button>
            ))}
          </div>
          <Field label="اسم الموقع">
            <input required value={form.site_name} maxLength={30}
              onChange={(e) => set("site_name", e.target.value)} className={inputClass} />
          </Field>
          <Field label="حرف الشعار (حرف واحد)">
            <input required value={form.logo_letter} maxLength={2}
              onChange={(e) => set("logo_letter", e.target.value)} className={inputClass} />
          </Field>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-bold text-gray-900">نصوص الصفحة الرئيسية</h2>
          <Field label="الشارة الصغيرة (اتركها فارغة لإخفائها)">
            <input value={form.hero_badge} maxLength={60}
              onChange={(e) => set("hero_badge", e.target.value)} className={inputClass} />
          </Field>
          <Field label="العنوان">
            <input value={form.hero_title} maxLength={80}
              onChange={(e) => set("hero_title", e.target.value)} className={inputClass} />
          </Field>
          <Field label="العنوان الملوّن (السطر الثاني)">
            <input value={form.hero_highlight} maxLength={80}
              onChange={(e) => set("hero_highlight", e.target.value)} className={inputClass} />
          </Field>
          <Field label="الوصف">
            <textarea rows={3} value={form.hero_subtitle} maxLength={240}
              onChange={(e) => set("hero_subtitle", e.target.value)} className={inputClass} />
          </Field>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-bold text-gray-900">التواصل والإعلان</h2>
          <Field label="رقم واتساب الدعم (يظهر زر عائم، اتركه فارغاً لإخفائه)">
            <input dir="ltr" inputMode="numeric" placeholder="01xxxxxxxxx"
              value={form.whatsapp_number}
              onChange={(e) => set("whatsapp_number", e.target.value)} className={inputClass} />
          </Field>
          <Field label="شريط إعلان أعلى الموقع (اتركه فارغاً لإخفائه)">
            <input value={form.announcement} maxLength={120}
              placeholder="مثال: شحن مجاني لأول طلب"
              onChange={(e) => set("announcement", e.target.value)} className={inputClass} />
          </Field>
          <Field label="نص الفوتر">
            <textarea rows={2} value={form.footer_text} maxLength={200}
              onChange={(e) => set("footer_text", e.target.value)} className={inputClass} />
          </Field>
        </Card>

        {error && <Notice>{error}</Notice>}
        {message && <Notice type="success">{message}</Notice>}

        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </form>
    </PageShell>
  );
}