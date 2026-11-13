"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { PageShell, Card, Notice, Loading } from "../../../components/ui";

type Info = {
  status: string;
  created_at: string;
  original_price: number;
  final_price: number;
  rate_label: string | null;
  broker_name: string;
};

const STEPS = ["قيد المراجعة", "تم الشراء", "تم الشحن", "تم التسليم"];

export default function TrackOrder() {
  const { code } = useParams<{ code: string }>();
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc("get_order_status", { p_code: code }).then(({ data }) => {
      setInfo(data && data.length > 0 ? (data[0] as Info) : null);
      setLoading(false);
    });
  }, [code]);

  if (loading) return <Loading />;

  if (!info) {
    return (
      <PageShell links={[{ href: "/", label: "الرئيسية" }]}>
        <Notice type="warning">لم نجد طلباً بهذا الرمز. تأكد من الرابط.</Notice>
      </PageShell>
    );
  }

  const current = STEPS.indexOf(info.status);
  const cancelled = info.status === "ملغي";

  return (
    <PageShell links={[{ href: "/", label: "الرئيسية" }]}
      title="تتبع طلبك" subtitle={`الوسيط: ${info.broker_name}`}>
      {cancelled && <Notice>تم إلغاء هذا الطلب. تواصل مع الوسيط لمعرفة السبب.</Notice>}

      <Card className="space-y-4">
        {STEPS.map((s, i) => {
          const done = !cancelled && i <= current;
          return (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                done ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={done ? "font-bold text-gray-900" : "text-gray-400"}>{s}</span>
            </div>
          );
        })}
      </Card>

      <Card className="space-y-1 text-sm text-gray-700">
        <p>تاريخ الطلب: {new Date(info.created_at).toLocaleDateString("ar-EG")}</p>
        {info.rate_label && <p>الخيار: {info.rate_label}</p>}
        <p>السعر الأصلي: ${info.original_price}</p>
        <p className="text-lg font-extrabold text-gray-900 pt-1">
          الإجمالي: {Number(info.final_price).toLocaleString("ar-EG", { maximumFractionDigits: 0 })} ج.م
        </p>
      </Card>
    </PageShell>
  );
}