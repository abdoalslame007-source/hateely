"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useSession } from "../../../lib/useSession";
import { PageShell, Card, Notice, LoginCard, Loading, ADMIN_LINKS } from "../../../components/ui";

type Sub = {
  id: string;
  created_at: string;
  status: "pending" | "active" | "rejected";
  payment_method: string | null;
  payment_reference: string | null;
  receipt_path: string | null;
  ends_at: string | null;
  brokers: { name: string; phone: string | null } | null;
  plans: { name: string; price_egp: number; duration_days: number } | null;
};

const TABS = [
  { key: "pending", label: "قيد المراجعة" },
  { key: "active", label: "نشط" },
  { key: "rejected", label: "مرفوض" },
] as const;

export default function AdminSubscriptions() {
  const { session, checking } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [tab, setTab] = useState<string>("pending");
  const [subs, setSubs] = useState<Sub[]>([]);
  const [receipts, setReceipts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
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
    if (isAdmin) loadSubs();
  }, [isAdmin, tab]);

  async function loadSubs() {
    setError("");
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, brokers(name,phone), plans(name,price_egp,duration_days)")
      .eq("status", tab)
      .order("created_at", { ascending: false });
    if (error) setError("تعذر تحميل الاشتراكات");
    else setSubs(data as unknown as Sub[]);
  }

  async function showReceipt(s: Sub) {
    if (!s.receipt_path) return;
    const { data, error } = await supabase.storage
      .from("broker-docs").createSignedUrl(s.receipt_path, 300);
    if (error || !data) return setError("تعذر فتح الإيصال");
    setReceipts((r) => ({ ...r, [s.id]: data.signedUrl }));
  }

  async function activate(s: Sub) {
    if (!window.confirm("هل تأكدت من وصول المبلغ؟ سيتم تفعيل الاشتراك.")) return;
    setBusyId(s.id);
    setError("");
    const { error } = await supabase.rpc("activate_subscription", { sub_id: s.id });
    if (error) setError("تعذر التفعيل: " + error.message);
    else setSubs((prev) => prev.filter((x) => x.id !== s.id));
    setBusyId(null);
  }

  async function reject(s: Sub) {
    if (!window.confirm("هل تريد رفض هذا الطلب؟")) return;
    setBusyId(s.id);
    setError("");
    const { data, error } = await supabase
      .from("subscriptions")
      .update({ status: "rejected" })
      .eq("id", s.id)
      .eq("status", "pending")
      .select();
    if (error || !data || data.length === 0) setError("تعذر الرفض");
    else setSubs((prev) => prev.filter((x) => x.id !== s.id));
    setBusyId(null);
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
      title="مراجعة الاشتراكات" subtitle="قارن الإيصال بالمبلغ المطلوب قبل التفعيل">
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
      {subs.length === 0 && (
        <Card className="text-center py-10 text-gray-500">لا توجد اشتراكات هنا</Card>
      )}

      {subs.map((s) => (
        <Card key={s.id} className="space-y-3">
          <div className="flex justify-between items-start">
            <h2 className="font-bold text-gray-900">{s.brokers?.name ?? "—"}</h2>
            <span className="text-xs text-gray-400">
              {new Date(s.created_at).toLocaleDateString("ar-EG")}
            </span>
          </div>

          <div className="text-sm text-gray-700 space-y-1">
            <p dir="ltr" className="text-right">📱 {s.brokers?.phone}</p>
            <p>
              الخطة: {s.plans?.name} · المطلوب:{" "}
              <span className="font-extrabold text-gray-900">{s.plans?.price_egp} ج.م</span>
            </p>
            <p>طريقة الدفع: {s.payment_method}</p>
            {s.payment_reference && <p>المرجع: {s.payment_reference}</p>}
            {s.status === "active" && s.ends_at && (
              <p className="text-green-700 font-semibold">
                ينتهي في {new Date(s.ends_at).toLocaleDateString("ar-EG")}
              </p>
            )}
          </div>

          {receipts[s.id] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={receipts[s.id]} alt="الإيصال" className="rounded-xl border w-full" />
          ) : (
            s.receipt_path && (
              <button onClick={() => showReceipt(s)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-700 hover:bg-gray-50">
                عرض الإيصال
              </button>
            )
          )}

          {s.status === "pending" && (
            <div className="flex gap-2">
              <button onClick={() => activate(s)} disabled={busyId === s.id}
                className="flex-1 bg-green-600 text-white rounded-xl p-2.5 text-sm font-bold hover:bg-green-700 disabled:opacity-50">
                تفعيل
              </button>
              <button onClick={() => reject(s)} disabled={busyId === s.id}
                className="flex-1 bg-red-600 text-white rounded-xl p-2.5 text-sm font-bold hover:bg-red-700 disabled:opacity-50">
                رفض
              </button>
            </div>
          )}
        </Card>
      ))}
    </PageShell>
  );
}