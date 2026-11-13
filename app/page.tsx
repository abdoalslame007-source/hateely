"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { SiteHeader, SiteFooter, ShieldIcon, inputClass } from "../components/ui";

type Rate = {
  rate_id: string;
  broker_id: string;
  broker_name: string;
  label: string;
  multiplier: number;
  delivery_time: string;
};

export default function Home() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");

  useEffect(() => {
    async function fetchRates() {
      const { data, error } = await supabase.rpc("get_active_rates");
      if (error) setError("تعذر تحميل العروض، حاول لاحقاً");
      else setRates((data as Rate[]) ?? []);
      setLoading(false);
    }
    fetchRates();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(originalPrice);
    if (isNaN(p) || p <= 0) return;
    setPrice(p);
    setSelectedId(rates[0]?.rate_id ?? null);
    setSaved(false);
    setError("");
    setTimeout(
      () => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  }

  async function handleConfirmOrder() {
    const rate = rates.find((r) => r.rate_id === selectedId);
    if (!rate || price === null) return;
    setSaving(true);
    setError("");

    const { data, error } = await supabase.rpc("create_order", {
      p_rate_id: rate.rate_id,
      p_product_url: productUrl,
      p_original_price: price,
      p_customer_phone: customerPhone,
    });

    if (error || !data || data.length === 0) {
      setError("تعذر حفظ الطلب، تأكد من رقم الموبايل وحاول مرة أخرى");
    } else {
      setTrackingCode(data[0].tracking_code);
      setSaved(true);
    }
    setSaving(false);
  }

  function resetAll() {
    setProductUrl("");
    setOriginalPrice("");
    setCustomerPhone("");
    setPrice(null);
    setSelectedId(null);
    setSaved(false);
    setTrackingCode("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <section className="bg-gradient-to-b from-pink-50 to-gray-50 pt-10 pb-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-snug">
            اشترِ من شي إن بأفضل سعر
            <span className="block text-pink-600">عبر وسطاء موثقين في مصر</span>
          </h1>
          <p className="text-gray-600 mt-3 max-w-md mx-auto">
            أدخل رابط المنتج وسعره، وقارن عروض الوسطاء بوضوح قبل أن تختار.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5 text-sm">
            {["وسطاء موثقون بالهوية", "سعر واضح قبل التأكيد", "بدون أي دفع مقدماً على الموقع"].map((t) => (
              <span key={t}
                className="inline-flex items-center gap-1.5 bg-white border border-pink-100 text-gray-700 rounded-full px-3 py-1.5 shadow-sm">
                <ShieldIcon className="w-4 h-4 text-pink-600" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-md mx-auto px-4 -mt-16 space-y-8 pb-16">
        {saved ? (
          <div className="bg-white rounded-3xl shadow-xl shadow-pink-100/50 p-8 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl">
              ✓
            </div>
            <h2 className="text-xl font-bold text-gray-900">تم استلام طلبك</h2>
            <p className="text-gray-600 text-sm">
              سيتواصل معك الوسيط على رقمك. احتفظ برابط التتبع:
            </p>
            <a href={`/track/${trackingCode}`}
              className="block bg-pink-50 text-pink-700 font-bold rounded-xl p-3 text-sm">
              تتبع طلبك
            </a>
            <button onClick={resetAll}
              className="text-pink-600 font-semibold text-sm underline">
              طلب جديد
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-xl shadow-pink-100/50 p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                رابط المنتج
              </label>
              <input type="url" required dir="ltr" value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://www.shein.com/..." className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                السعر الأصلي (بالدولار)
              </label>
              <input type="number" required min="0" step="0.01" value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="مثال: 25" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                رقم موبايلك (للتواصل مع الوسيط)
              </label>
              <input required dir="ltr" inputMode="numeric" pattern="01[0-9]{9}"
                title="رقم موبايل مصري من 11 رقم" placeholder="01xxxxxxxxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)} className={inputClass} />
            </div>
            <button type="submit" disabled={loading || rates.length === 0}
              className="w-full bg-gradient-to-l from-pink-600 to-rose-500 text-white font-bold rounded-xl p-3.5 shadow-lg shadow-pink-200 hover:opacity-95 disabled:opacity-50 transition">
              {loading ? "جاري التحميل..." : "قارن العروض"}
            </button>
            {!loading && rates.length === 0 && !error && (
              <p className="text-gray-500 text-sm text-center">
                لا توجد عروض متاحة حالياً
              </p>
            )}
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          </form>
        )}

        <div id="results">
          {!saved && price !== null && rates.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-extrabold text-lg text-gray-900">
                العروض المتاحة ({rates.length})
              </h2>

              {rates.map((r, i) => {
                const total = price * r.multiplier;
                const selected = selectedId === r.rate_id;
                return (
                  <button key={r.rate_id} type="button"
                    onClick={() => setSelectedId(r.rate_id)}
                    className={`w-full text-right bg-white rounded-2xl p-4 border-2 transition ${
                      selected
                        ? "border-pink-600 shadow-lg shadow-pink-100"
                        : "border-transparent shadow-sm"
                    }`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-bold text-gray-900">{r.broker_name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {r.label} · التوصيل {r.delivery_time}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 text-xs bg-pink-50 text-pink-700 rounded-full px-2 py-0.5">
                          <ShieldIcon className="w-3.5 h-3.5" /> موثق
                        </span>
                        {i === 0 && rates.length > 1 && (
                          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                            الأرخص
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-3xl font-extrabold text-gray-900 mt-3">
                      {total.toLocaleString("ar-EG", { maximumFractionDigits: 0 })}{" "}
                      <span className="text-base font-semibold text-gray-500">ج.م</span>
                    </p>
                  </button>
                );
              })}

              <button onClick={handleConfirmOrder} disabled={saving || !selectedId}
                className="w-full bg-gray-900 text-white font-bold rounded-xl p-3.5 hover:bg-black disabled:opacity-50 transition">
                {saving ? "جاري الحفظ..." : "تأكيد الطلب"}
              </button>
              <p className="text-xs text-gray-500 text-center">
                لن يُطلب منك أي دفع هنا. تتفق مع الوسيط على التفاصيل بعد التأكيد.
              </p>
            </div>
          )}
        </div>

        {price === null && !saved && (
          <section className="space-y-4">
            <h2 className="text-center font-extrabold text-xl text-gray-900">
              كيف يعمل هاتلي؟
            </h2>
            {[
              ["1", "أدخل المنتج", "انسخ رابط المنتج من شي إن واكتب سعره بالدولار."],
              ["2", "قارن العروض", "شاهد السعر النهائي بالجنيه عند كل وسيط وخيارات الشحن."],
              ["3", "أكّد طلبك", "اختر الأنسب ليتواصل معك الوسيط ويكمل الشراء والتوصيل."],
            ].map(([n, title, text]) => (
              <div key={n} className="flex gap-3 bg-white rounded-2xl p-4 shadow-sm">
                <div className="shrink-0 w-9 h-9 rounded-full bg-pink-100 text-pink-700 font-bold flex items-center justify-center">
                  {n}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{title}</p>
                  <p className="text-sm text-gray-600">{text}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="bg-white rounded-3xl p-5 shadow-sm space-y-3">
          <h2 className="font-extrabold text-lg text-gray-900">لماذا تثق في هاتلي؟</h2>
          {[
            "كل وسيط يقدّم بطاقته الشخصية وصورته، ونراجعها يدوياً قبل قبوله.",
            "لا يظهر لك إلا الوسطاء أصحاب الاشتراك الساري والحساب المقبول.",
            "ترى السعر النهائي بالجنيه واضحاً قبل أن تؤكد أي شيء.",
          ].map((t) => (
            <div key={t} className="flex gap-2 text-sm text-gray-700">
              <ShieldIcon className="w-5 h-5 shrink-0 text-pink-600 mt-0.5" />
              <p>{t}</p>
            </div>
          ))}
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}