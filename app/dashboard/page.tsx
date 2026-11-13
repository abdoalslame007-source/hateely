"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/useSession";
import { PageShell, Card, LoginCard, Loading, Notice, BROKER_LINKS } from "../../components/ui";

type Order = {
  id: string;
  created_at: string;
  product_url: string;
  original_price: number;
  final_price: number;
  status: string;
  rate_label: string | null;
  customer_phone: string | null;
};

const STATUSES = ["قيد المراجعة", "تم الشراء", "تم الشحن", "تم التسليم", "ملغي"];

const STATUS_STYLE: Record<string, string> = {
  "قيد المراجعة": "bg-yellow-100 text-yellow-800",
  "تم الشراء": "bg-blue-100 text-blue-800",
  "تم الشحن": "bg-indigo-100 text-indigo-800",
  "تم التسليم": "bg-green-100 text-green-800",
  "ملغي": "bg-red-100 text-red-700",
};

export default function Dashboard() {
  const { session, checking } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) loadOrders();
    else setOrders([]);
  }, [session]);

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError("تعذر تحميل الطلبات");
    else setOrders(data as Order[]);
  }

  async function updateStatus(id: string, status: string) {
    setError("");
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select();
    if (error || !data || data.length === 0) {
      setError("تعذر تحديث الحالة");
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  if (checking) return <Loading />;

  if (!session) {
    return (
      <PageShell size="sm">
        <LoginCard title="دخول الوسيط" subtitle="أدر طلبات عملائك من مكان واحد" />
      </PageShell>
    );
  }

  const newCount = orders.filter((o) => o.status === "قيد المراجعة").length;

  return (
    <PageShell links={BROKER_LINKS} onSignOut={() => supabase.auth.signOut()}
      title="طلباتي" subtitle="الطلبات الواردة من العملاء">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-gray-500">إجمالي الطلبات</p>
          <p className="text-2xl font-extrabold text-gray-900">{orders.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">تحتاج مراجعة</p>
          <p className="text-2xl font-extrabold text-pink-600">{newCount}</p>
        </Card>
      </div>

      {error && <Notice>{error}</Notice>}

      {orders.length === 0 && (
        <Card className="text-center py-10 text-gray-500">لا توجد طلبات بعد</Card>
      )}

      {orders.map((order) => (
        <Card key={order.id} className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {new Date(order.created_at).toLocaleString("ar-EG")}
            </span>
            <span className={`text-xs font-semibold rounded-full px-3 py-1 ${STATUS_STYLE[order.status] ?? "bg-gray-100 text-gray-700"}`}>
              {order.status}
            </span>
          </div>

          <a href={order.product_url} target="_blank" rel="noopener noreferrer"
            dir="ltr"
            className="block text-sm text-blue-600 underline truncate">
            {order.product_url}
          </a>

          <div className="flex justify-between items-end">
            <div className="text-sm text-gray-600">
              <p>السعر الأصلي: ${order.original_price}</p>
              {order.rate_label && <p>الخيار: {order.rate_label}</p>}
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {Number(order.final_price).toLocaleString("ar-EG", { maximumFractionDigits: 0 })}{" "}
              <span className="text-sm font-semibold text-gray-500">ج.م</span>
            </p>
          </div>

          {order.customer_phone && (
            <a href={`https://wa.me/20${order.customer_phone.slice(1)}`}
              target="_blank" rel="noopener noreferrer"
              className="block text-center bg-green-50 text-green-700 font-bold rounded-xl p-2.5 text-sm">
              واتساب العميل: <span dir="ltr">{order.customer_phone}</span>
            </a>
          )}

          <select value={order.status}
            onChange={(e) => updateStatus(order.id, e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-2.5 text-gray-900 bg-gray-50 text-sm">
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Card>
      ))}
    </PageShell>
  );
}