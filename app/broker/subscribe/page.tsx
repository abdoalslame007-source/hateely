"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useSession } from "../../../lib/useSession";
import {
  PageShell, Card, Field, Notice, LoginCard, Loading,
  inputClass, primaryBtn, fileClass, BROKER_LINKS,
} from "../../../components/ui";

type Plan = { id: string; name: string; price_egp: number; duration_days: number };
type Sub = {
  id: string;
  created_at: string;
  status: "pending" | "active" | "rejected";
  ends_at: string | null;
  plans: { name: string } | null;
};

const STATUS_LABEL = { pending: "قيد المراجعة", active: "نشط", rejected: "مرفوض" };
const STATUS_STYLE = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

// غيّر هذه الأرقام ببيانات الدفع الحقيقية الخاصة بك
const PAYMENT_INFO = "فودافون كاش: 01xxxxxxxxx — إنستاباي: yourname@instapay";

export default function BrokerSubscribe() {
  const { session, checking } = useSession();
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [brokerStatus, setBrokerStatus] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [planId, setPlanId] = useState("");
  const [method, setMethod] = useState("فودافون كاش");
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session) loadAll(session.user.id);
  }, [session]);

  async function loadAll(userId: string) {
    const { data: broker } = await supabase
      .from("brokers").select("id,status").eq("user_id", userId).maybeSingle();
    setBrokerId(broker?.id ?? null);
    setBrokerStatus(broker?.status ?? null);

    const { data: planRows } = await supabase
      .from("plans").select("*").order("price_egp");
    setPlans((planRows as Plan[]) ?? []);
    if (planRows && planRows.length > 0) setPlanId((p) => p || planRows[0].id);

    if (broker) {
      const { data: subRows } = await supabase
        .from("subscriptions")
        .select("id,created_at,status,ends_at,plans(name)")
        .eq("broker_id", broker.id)
        .order("created_at", { ascending: false });
      setSubs((subRows as unknown as Sub[]) ?? []);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!session || !brokerId) return;
    if (!receipt) return setError("ارفع صورة إيصال الدفع");
    if (receipt.size > 5 * 1024 * 1024)
      return setError("حجم الصورة يجب ألا يزيد عن 5 ميجا");

    setLoading(true);
    const ext = receipt.name.split(".").pop() || "jpg";
    const path = `${session.user.id}/receipt-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("broker-docs").upload(path, receipt);
    if (uploadError) {
      setError("فشل رفع الإيصال");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("subscriptions").insert({
      broker_id: brokerId,
      plan_id: planId,
      payment_method: method,
      payment_reference: reference || null,
      receipt_path: path,
      status: "pending",
    });
    if (insertError) setError("تعذر إرسال الطلب، حاول مرة أخرى");
    else {
      setMessage("تم إرسال طلب الاشتراك، وسيتم تفعيله بعد مراجعة الإيصال");
      setReference("");
      setReceipt(null);
      await loadAll(session.user.id);
    }
    setLoading(false);
  }

  if (checking) return <Loading />;

  if (!session) {
    return (
      <PageShell size="sm">
        <LoginCard title="دخول الوسيط" subtitle="سجّل دخولك لإدارة اشتراكك" />
      </PageShell>
    );
  }

  if (!brokerId) {
    return (
      <PageShell links={BROKER_LINKS} onSignOut={() => supabase.auth.signOut()}>
        <Notice type="warning">
          هذا الحساب غير مسجّل كوسيط. <a href="/broker/register" className="underline font-semibold">سجّل من هنا</a>
        </Notice>
      </PageShell>
    );
  }

  if (brokerStatus !== "approved") {
    return (
      <PageShell links={BROKER_LINKS} onSignOut={() => supabase.auth.signOut()}>
        <Notice type="warning">
          حسابك قيد المراجعة أو غير مقبول. يمكنك الاشتراك بعد قبوله.
        </Notice>
      </PageShell>
    );
  }

  const activeSub = subs.find(
    (s) => s.status === "active" && s.ends_at && new Date(s.ends_at) > new Date()
  );
  const hasPending = subs.some((s) => s.status === "pending");

  return (
    <PageShell links={BROKER_LINKS} onSignOut={() => supabase.auth.signOut()}
      title="اشتراكي" subtitle="اشتراكك الساري يُظهر عروضك للعملاء">
      {activeSub ? (
        <Notice type="success">
          اشتراكك ساري حتى {new Date(activeSub.ends_at!).toLocaleDateString("ar-EG")}
        </Notice>
      ) : (
        <Notice>لا يوجد اشتراك ساري، ولن يظهر عرضك للعملاء.</Notice>
      )}

      {hasPending ? (
        <Notice type="warning">
          لديك طلب اشتراك قيد المراجعة، وسيُفعّل بعد التأكد من الإيصال.
        </Notice>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card className="space-y-4">
            <h2 className="font-bold text-gray-900">
              {activeSub ? "تجديد الاشتراك" : "اختر خطتك"}
            </h2>

            <div className="space-y-2">
              {plans.map((p) => (
                <label key={p.id}
                  className={`flex justify-between items-center border-2 rounded-xl p-3 cursor-pointer transition ${
                    planId === p.id ? "border-pink-600 bg-pink-50" : "border-gray-200"
                  }`}>
                  <span className="flex items-center gap-2 text-gray-900 text-sm">
                    <input type="radio" name="plan" checked={planId === p.id}
                      onChange={() => setPlanId(p.id)} className="accent-pink-600" />
                    {p.name} ({p.duration_days} يوم)
                  </span>
                  <span className="font-extrabold text-gray-900">{p.price_egp} ج.م</span>
                </label>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">
              حوّل المبلغ على:
              <p dir="ltr" className="font-semibold mt-1 text-right">{PAYMENT_INFO}</p>
            </div>

            <Field label="طريقة الدفع">
              <select value={method} onChange={(e) => setMethod(e.target.value)}
                className={inputClass}>
                <option>فودافون كاش</option>
                <option>إنستاباي</option>
              </select>
            </Field>

            <Field label="رقم العملية (اختياري)">
              <input value={reference} onChange={(e) => setReference(e.target.value)}
                placeholder="رقم العملية أو آخر 4 أرقام من رقم المحوِّل"
                className={inputClass} />
            </Field>

            <Field label="صورة إيصال الدفع">
              <input required type="file" accept="image/*" className={fileClass}
                onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
            </Field>

            <button type="submit" disabled={loading} className={primaryBtn}>
              {loading ? "جاري الإرسال..." : "إرسال طلب الاشتراك"}
            </button>
            {message && <Notice type="success">{message}</Notice>}
            {error && <Notice>{error}</Notice>}
          </Card>
        </form>
      )}

      {subs.length > 0 && (
        <Card className="space-y-2">
          <h2 className="font-bold text-gray-900">سجل الاشتراكات</h2>
          {subs.map((s) => (
            <div key={s.id}
              className="flex justify-between items-center text-sm text-gray-700 border-t border-gray-100 pt-2">
              <span>
                {s.plans?.name ?? "خطة"} · {new Date(s.created_at).toLocaleDateString("ar-EG")}
              </span>
              <span className={`text-xs font-semibold rounded-full px-3 py-1 ${STATUS_STYLE[s.status]}`}>
                {STATUS_LABEL[s.status]}
              </span>
            </div>
          ))}
        </Card>
      )}
    </PageShell>
  );
}