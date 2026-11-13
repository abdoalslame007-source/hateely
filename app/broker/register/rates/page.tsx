"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useSession } from "../../../lib/useSession";
import {
  PageShell, Card, Field, Notice, LoginCard, Loading,
  inputClass, primaryBtn, BROKER_LINKS,
} from "../../../components/ui";

type Rate = {
  id: string;
  label: string;
  multiplier: number;
  delivery_time: string;
  is_active: boolean;
};

export default function BrokerRates() {
  const { session, checking } = useSession();
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [label, setLabel] = useState("");
  const [multiplier, setMultiplier] = useState("");
  const [delivery, setDelivery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) load(session.user.id);
  }, [session]);

  async function load(userId: string) {
    const { data: broker } = await supabase
      .from("brokers").select("id").eq("user_id", userId).maybeSingle();
    setBrokerId(broker?.id ?? null);
    if (!broker) return;
    const { data } = await supabase
      .from("broker_rates")
      .select("id,label,multiplier,delivery_time,is_active")
      .eq("broker_id", broker.id)
      .order("multiplier");
    setRates((data as Rate[]) ?? []);
  }

  async function addRate(e: React.FormEvent) {
    e.preventDefault();
    if (!brokerId || !session) return;
    setError("");
    const m = parseFloat(multiplier);
    if (isNaN(m) || m <= 0) return setError("اكتب معامل ضرب صحيح");
    const { error } = await supabase.from("broker_rates").insert({
      broker_id: brokerId, label, multiplier: m, delivery_time: delivery,
    });
    if (error) return setError("تعذر إضافة الخيار");
    setLabel("");
    setMultiplier("");
    setDelivery("");
    await load(session.user.id);
  }

  async function toggle(r: Rate) {
    setError("");
    const { data, error } = await supabase
      .from("broker_rates")
      .update({ is_active: !r.is_active })
      .eq("id", r.id)
      .select();
    if (error || !data || data.length === 0) return setError("تعذر التحديث");
    setRates((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, is_active: !r.is_active } : x))
    );
  }

  async function remove(r: Rate) {
    if (!window.confirm("حذف هذا الخيار؟")) return;
    setError("");
    const { error } = await supabase.from("broker_rates").delete().eq("id", r.id);
    if (error) setError("تعذر الحذف");
    else setRates((prev) => prev.filter((x) => x.id !== r.id));
  }

  if (checking) return <Loading />;

  if (!session) {
    return (
      <PageShell size="sm">
        <LoginCard title="دخول الوسيط" subtitle="أدر خيارات أسعارك" />
      </PageShell>
    );
  }

  if (!brokerId) {
    return (
      <PageShell links={BROKER_LINKS} onSignOut={() => supabase.auth.signOut()}>
        <Notice type="warning">هذا الحساب غير مسجّل كوسيط.</Notice>
      </PageShell>
    );
  }

  return (
    <PageShell links={BROKER_LINKS} onSignOut={() => supabase.auth.signOut()}
      title="خيارات أسعاري" subtitle="العميل يرى هذه الخيارات ويختار منها">
      <form onSubmit={addRate}>
        <Card className="space-y-4">
          <h2 className="font-bold text-gray-900">إضافة خيار جديد</h2>
          <Field label="اسم الخيار">
            <input required placeholder="مثال: شحن اقتصادي" value={label}
              onChange={(e) => setLabel(e.target.value)} className={inputClass} />
          </Field>
          <Field label="معامل الضرب">
            <input required type="number" step="0.01" min="0.01" placeholder="مثال: 12.5"
              value={multiplier} onChange={(e) => setMultiplier(e.target.value)}
              className={inputClass} />
          </Field>
          <Field label="مدة التوصيل">
            <input required placeholder="مثال: 20 إلى 25 يوم" value={delivery}
              onChange={(e) => setDelivery(e.target.value)} className={inputClass} />
          </Field>
          <button type="submit" className={primaryBtn}>إضافة الخيار</button>
          {error && <Notice>{error}</Notice>}
        </Card>
      </form>

      {rates.map((r) => (
        <Card key={r.id} className={`space-y-3 ${r.is_active ? "" : "opacity-60"}`}>
          <div className="flex justify-between items-center">
            <p className="font-bold text-gray-900">{r.label}</p>
            <p className="text-xl font-extrabold text-pink-600">× {r.multiplier}</p>
          </div>
          <p className="text-sm text-gray-500">التوصيل: {r.delivery_time}</p>
          {!r.is_active && <p className="text-xs text-gray-400">موقوف: لا يراه العملاء</p>}
          <div className="flex gap-2 text-sm">
            <button onClick={() => toggle(r)}
              className="flex-1 border border-gray-200 rounded-xl p-2.5 text-gray-700 hover:bg-gray-50">
              {r.is_active ? "إيقاف مؤقت" : "تفعيل"}
            </button>
            <button onClick={() => remove(r)}
              className="flex-1 border border-red-200 rounded-xl p-2.5 text-red-600 hover:bg-red-50">
              حذف
            </button>
          </div>
        </Card>
      ))}
    </PageShell>
  );
}