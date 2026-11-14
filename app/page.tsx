"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { SiteHeader, SiteFooter, ShieldIcon } from "../components/ui";

type Rate = {
  rate_id: string;
  broker_id: string;
  broker_name: string;
  label: string;
  multiplier: number;
  delivery_time: string;
};

const darkInput =
  "w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:bg-white/10 transition";

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

  const gradBtn =
    "glow-btn w-full bg-gradient-to-l from-rose-500 via-fuchsia-600 to-violet-600 text-white font-extrabold rounded-xl p-4 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition";

  return (
    <div className="min-h-screen bg-[#0b0614] text-white">
      <SiteHeader />

      {/* الواجهة */}
      <section className="relative overflow-hidden px-4 pt-12 pb-10">
        <div className="absolute -top-32 -start-24 w-80 h-80 rounded-full bg-fuchsia-600/30 blur-3xl animate-float" />
        <div className="absolute top-40 -end-28 w-80 h-80 rounded-full bg-violet-600/30 blur-3xl animate-float" />
        <div className="absolute top-72 start-10 w-56 h-56 rounded-full bg-rose-500/20 blur-3xl" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="fade-up inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-semibold text-fuchsia-200">
            <ShieldIcon className="w-4 h-4" />
            وسطاء موثقون بالهوية
          </span>

          <h1 className="fade-up-2 mt-5 text-4xl sm:text-5xl font-extrabold leading-tight">
            اشترِ من شي إن
            <span className="block text-gradient pt-1">بأفضل سعر في مصر</span>
          </h1>

          <p className="fade-up-3 text-gray-400 mt-4 max-w-md mx-auto leading-relaxed">
            أدخل رابط المنتج وسعره، وشاهد عروض الوسطاء جنباً إلى جنب، ثم اختر الأنسب لك.
          </p>

          <div className="fade-up-3 flex flex-wrap justify-center gap-2 mt-6 text-xs">
            {["سعر واضح قبل التأكيد", "بدون دفع على الموقع", "تتبع الطلب برابط خاص"].map((t) => (
              <span key={t} className="glass rounded-full px-3 py-1.5 text-gray-300">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="relative max-w-md mx-auto px-4 space-y-8 pb-16">
        {/* النموذج */}
        {saved ? (
          <div className="glass rounded-3xl p-8 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-4xl shadow-lg shadow-green-900/40">
              ✓
            </div>
            <h2 className="text-2xl font-extrabold">تم استلام طلبك</h2>
            <p className="text-gray-400 text-sm">
              سيتواصل معك الوسيط على رقمك. احتفظ برابط التتبع:
            </p>
            <a href={`/track/${trackingCode}`}
              className="block bg-white/10 hover:bg-white/15 border border-white/10 text-fuchsia-200 font-bold rounded-xl p-3.5 text-sm transition">
              تتبع طلبك الآن
            </a>
            <button onClick={resetAll}
              className="text-gray-400 hover:text-white font-semibold text-sm underline">
              طلب جديد
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}
            className="glass rounded-3xl p-5 space-y-4 shadow-2xl shadow-fuchsia-950/40">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                رابط المنتج
              </label>
              <input type="url" required dir="ltr" value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://www.shein.com/..." className={darkInput} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                السعر الأصلي (بالدولار)
              </label>
              <input type="number" required min="0" step="0.01" value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="مثال: 25" className={darkInput} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                رقم موبايلك (للتواصل مع الوسيط)
              </label>
              <input required dir="ltr" inputMode="numeric" pattern="01[0-9]{9}"
                title="رقم موبايل مصري من 11 رقم" placeholder="01xxxxxxxxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)} className={darkInput} />
            </div>
            <button type="submit" disabled={loading || rates.length === 0} className={gradBtn}>
              {loading ? "جاري التحميل..." : "قارن العروض ←"}
            </button>
            {!loading && rates.length === 0 && !error && (
              <p className="text-gray-400 text-sm text-center">
                لا توجد عروض متاحة حالياً
              </p>
            )}
            {error && <p className="text-rose-400 text-sm text-center">{error}</p>}
          </form>
        )}

        {/* النتائج */}
        <div id="results">
          {!saved && price !== null && rates.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-extrabold text-xl">
                العروض المتاحة <span className="text-fuchsia-400">({rates.length})</span>
              </h2>

              {rates.map((r, i) => {
                const total = price * r.multiplier;
                const selected = selectedId === r.rate_id;
                return (
                  <button key={r.rate_id} type="button"
                    onClick={() => setSelectedId(r.rate_id)}
                    className={`w-full text-right rounded-2xl p-4 border-2 transition active:scale-[0.99] ${
                      selected
                        ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-900/40"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-bold text-lg">{r.broker_name}</p>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {r.label} · التوصيل {r.delivery_time}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 text-xs bg-fuchsia-500/20 text-fuchsia-200 rounded-full px-2 py-0.5">
                          <ShieldIcon className="w-3.5 h-3.5" /> موثق
                        </span>
                        {i === 0 && rates.length > 1 && (
                          <span className="text-xs bg-emerald-500/20 text-emerald-300 rounded-full px-2 py-0.5">
                            الأرخص
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-4xl font-extrabold mt-3">
                      {total.toLocaleString("ar-EG", { maximumFractionDigits: 0 })}{" "}
                      <span className="text-base font-semibold text-gray-400">ج.م</span>
                    </p>
                  </button>
                );
              })}

              <button onClick={handleConfirmOrder} disabled={saving || !selectedId}
                className={gradBtn}>
                {saving ? "جاري الحفظ..." : "تأكيد الطلب"}
              </button>
              <p className="text-xs text-gray-500 text-center">
                لن يُطلب منك أي دفع هنا. تتفق مع الوسيط على التفاصيل بعد التأكيد.
              </p>
            </div>
          )}
        </div>

        {/* كيف يعمل */}
        {price === null && !saved && (
          <section className="space-y-4">
            <h2 className="text-center font-extrabold text-2xl">
              كيف يعمل <span className="text-gradient">هاتلي</span>؟
            </h2>
            {[
              ["1", "أدخل المنتج", "انسخ رابط المنتج من شي إن واكتب سعره بالدولار."],
              ["2", "قارن العروض", "شاهد السعر النهائي بالجنيه عند كل وسيط وخيارات الشحن."],
              ["3", "أكّد طلبك", "اختر الأنسب ليتواصل معك الوسيط ويكمل الشراء والتوصيل."],
            ].map(([n, title, text]) => (
              <div key={n} className="glass flex gap-4 rounded-2xl p-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 via-fuchsia-600 to-violet-600 font-extrabold flex items-center justify-center glow-btn">
                  {n}
                </div>
                <div>
                  <p className="font-bold text-lg">{title}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{text}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* الثقة */}
        <section className="glass rounded-3xl p-5 space-y-4">
          <h2 className="font-extrabold text-xl">لماذا تثق في هاتلي؟</h2>
          {[
            "كل وسيط يقدّم بطاقته الشخصية وصورته، ونراجعها يدوياً قبل قبوله.",
            "لا يظهر لك إلا الوسطاء أصحاب الاشتراك الساري والحساب المقبول.",
            "ترى السعر النهائي بالجنيه واضحاً قبل أن تؤكد أي شيء.",
          ].map((t) => (
            <div key={t} className="flex gap-3 text-sm text-gray-300">
              <ShieldIcon className="w-5 h-5 shrink-0 text-fuchsia-400 mt-0.5" />
              <p>{t}</p>
            </div>
          ))}
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}