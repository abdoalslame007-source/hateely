"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { PageShell, Card, Notice, LoginCard, Loading, ADMIN_LINKS } from "../../components/ui";

type Broker = {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
  multiplier: number;
  delivery_time: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  national_id_path: string | null;
  selfie_path: string | null;
  rejection_reason: string | null;
};

const TABS = [
  { key: "pending", label: "قيد المراجعة" },
  { key: "approved", label: "مقبول" },
  { key: "rejected", label: "مرفوض" },
  { key: "suspended", label: "موقوف" },
] as const;

export default function AdminPage() {
  const { session, checking } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [tab, setTab] = useState<string>("pending");
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [docs, setDocs] = useState<Record<string, { id: string; selfie: string }>>({});
  const [error, setError] = useState("");

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
    if (isAdmin) loadBrokers();
  }, [isAdmin, tab]);

  async function loadBrokers() {
    setError("");
    const { data, error } = await supabase
      .from("brokers").select("*").eq("status", tab)
      .order("created_at", { ascending: false });
    if (error) setError("تعذر تحميل الوسطاء");
    else setBrokers(data as Broker[]);
  }

  async function showDocs(b: Broker) {
    if (!b.national_id_path || !b.selfie_path) return;
    const { data, error } = await supabase.storage
      .from("broker-docs")
      .createSignedUrls([b.national_id_path, b.selfie_path], 300);
    if (error || !data) return setError("تعذر فتح المستندات");
    setDocs((d) => ({
      ...d,
      [b.id]: { id: data[0].signedUrl ?? "", selfie: data[1].signedUrl ?? "" },
    }));
  }

  async function setStatus(b: Broker, status: Broker["status"]) {
    let reason: string | null = null;
    if (status === "rejected" || status === "suspended") {
      reason = window.prompt("اكتب السبب:");
      if (!reason) return;
    }
    setError("");
    const { data, error } = await supabase
      .from("brokers")
      .update({
        status,
        rejection_reason: reason,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", b.id)
      .select();
    if (error || !data || data.length === 0) return setError("تعذر تحديث الحالة");
    setBrokers((prev) => prev.filter((x) => x.id !== b.id));
  }

  if (checking || (session && !adminChecked)) return <Loading />;

  if (!session) {
    return (
      <PageShell size="sm">
        <LoginCard title="دخول الأدمن" subtitle="لوحة إدارة هاتلي" />
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
    <PageShell size="lg" links={ADMIN_LINKS} onSignOut={() => supabase.auth.signOut()}
      title="مراجعة الوسطاء" subtitle="راجع المستندات ثم اقبل أو ارفض">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              tab === t.key
                ? "bg-pink-600 text-white shadow"
                : "bg-white text-gray-700 border border-gray-200"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <Notice>{error}</Notice>}
      {brokers.length === 0 && (
        <Card className="text-center py-10 text-gray-500">لا يوجد وسطاء هنا</Card>
      )}

      {brokers.map((b) => (
        <Card key={b.id} className="space-y-3">
          <div className="flex justify-between items-start">
            <h2 className="font-bold text-gray-900">{b.name}</h2>
            <span className="text-xs text-gray-400">
              {new Date(b.created_at).toLocaleDateString("ar-EG")}
            </span>
          </div>

          <div className="text-sm text-gray-700 space-y-1">
            <p dir="ltr" className="text-right">📱 {b.phone}</p>
            <p>معامل الضرب: {b.multiplier}</p>
            <p>مدة التوصيل: {b.delivery_time}</p>
            {b.rejection_reason && (
              <p className="text-red-600">السبب: {b.rejection_reason}</p>
            )}
          </div>

          {docs[b.id] ? (
            <div className="grid grid-cols-2 gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={docs[b.id].id} alt="البطاقة" className="rounded-xl border w-full" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={docs[b.id].selfie} alt="سيلفي" className="rounded-xl border w-full" />
            </div>
          ) : (
            <button onClick={() => showDocs(b)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-700 hover:bg-gray-50">
              عرض المستندات
            </button>
          )}

          <div className="flex gap-2">
            {b.status !== "approved" && (
              <button onClick={() => setStatus(b, "approved")}
                className="flex-1 bg-green-600 text-white rounded-xl p-2.5 text-sm font-bold hover:bg-green-700">
                قبول
              </button>
            )}
            {b.status === "pending" && (
              <button onClick={() => setStatus(b, "rejected")}
                className="flex-1 bg-red-600 text-white rounded-xl p-2.5 text-sm font-bold hover:bg-red-700">
                رفض
              </button>
            )}
            {b.status === "approved" && (
              <button onClick={() => setStatus(b, "suspended")}
                className="flex-1 bg-gray-800 text-white rounded-xl p-2.5 text-sm font-bold hover:bg-black">
                إيقاف
              </button>
            )}
          </div>
        </Card>
      ))}
    </PageShell>
  );
}