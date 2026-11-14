"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useSession } from "../../../lib/useSession";
import {
  PageShell, Card, Field, Notice, LoginCard, Loading,
  inputClass, primaryBtn, ADMIN_LINKS,
} from "../../../components/ui";

type Row = {
  slug: string;
  title: string;
  content: string;
  sort_order: number;
  is_published: boolean;
};

const EMPTY: Row = { slug: "", title: "", content: "", sort_order: 10, is_published: true };

export default function AdminPages() {
  const { session, checking } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  async function load() {
    const { data, error } = await supabase
      .from("pages").select("*").order("sort_order");
    if (error) setError("تعذر تحميل الصفحات");
    else setRows(data as Row[]);
  }

  function edit(r: Row) {
    setForm({ ...r });
    setIsNew(false);
    setError("");
    setMessage("");
  }

  function create() {
    setForm({ ...EMPTY });
    setIsNew(true);
    setError("");
    setMessage("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError("");
    setMessage("");
    if (isNew && !/^[a-z0-9-]{2,40}$/.test(form.slug)) {
      return setError("المعرّف: حروف إنجليزية صغيرة وأرقام وشرطة فقط (2 إلى 40)");
    }
    if (!form.title.trim()) return setError("العنوان مطلوب");

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      content: form.content,
      sort_order: form.sort_order,
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = isNew
      ? await supabase.from("pages").insert({ slug: form.slug, ...payload }).select()
      : await supabase.from("pages").update(payload).eq("slug", form.slug).select();
    if (error || !data || data.length === 0) {
      setError(isNew ? "تعذر الإنشاء، ربما المعرّف مستخدم" : "تعذر الحفظ");
    } else {
      setMessage("تم الحفظ");
      setIsNew(false);
      await load();
    }
    setSaving(false);
  }

  async function remove() {
    if (!form || isNew) return;
    if (!window.confirm("حذف هذه الصفحة نهائياً؟")) return;
    const { error } = await supabase.from("pages").delete().eq("slug", form.slug);
    if (error) return setError("تعذر الحذف");
    setForm(null);
    await load();
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
      title="الصفحات" subtitle="السياسات والأسئلة الشائعة">
      {!form && (
        <>
          <button onClick={create} className={primaryBtn}>+ صفحة جديدة</button>
          {error && <Notice>{error}</Notice>}
          {rows.map((r) => (
            <Card key={r.slug}>
              <button onClick={() => edit(r)} className="w-full text-right">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-gray-900">{r.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    r.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {r.is_published ? "منشورة" : "مخفية"}
                  </span>
                </div>
                <p dir="ltr" className="mt-1 text-right text-xs text-gray-400">/p/{r.slug}</p>
              </button>
            </Card>
          ))}
        </>
      )}

      {form && (
        <form onSubmit={save} className="space-y-4">
          <Card className="space-y-4">
            {isNew ? (
              <Field label="المعرّف في الرابط (إنجليزي صغير)">
                <input dir="ltr" required value={form.slug} placeholder="refund"
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className={inputClass} />
              </Field>
            ) : (
              <p dir="ltr" className="text-right text-xs text-gray-400">/p/{form.slug}</p>
            )}
            <Field label="العنوان">
              <input required value={form.title} maxLength={80}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass} />
            </Field>
            <Field label="المحتوى (سطر فارغ بين الفقرات، وابدأ العنوان الفرعي بـ ## )">
              <textarea rows={14} value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className={inputClass} />
            </Field>
            <Field label="الترتيب في الفوتر (الأصغر أولاً)">
              <input type="number" value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className={inputClass} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              منشورة (تظهر للزوار وفي الفوتر)
            </label>
          </Card>

          {error && <Notice>{error}</Notice>}
          {message && <Notice type="success">{message}</Notice>}

          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
          <div className="flex gap-2 text-sm">
            <button type="button" onClick={() => setForm(null)}
              className="flex-1 rounded-xl border border-gray-200 bg-white p-2.5 text-gray-700">
              رجوع للقائمة
            </button>
            {!isNew && (
              <button type="button" onClick={remove}
                className="flex-1 rounded-xl border border-red-200 bg-white p-2.5 text-red-600">
                حذف
              </button>
            )}
          </div>
        </form>
      )}
    </PageShell>
  );
}