"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  PageShell, Card, Field, Notice, ShieldIcon,
  inputClass, primaryBtn, fileClass,
} from "../../../components/ui";

export default function BrokerRegister() {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "", multiplier: "", delivery_time: "",
  });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadDoc(userId: string, file: File, prefix: string) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("broker-docs").upload(path, file);
    if (error) throw new Error("فشل رفع الملف");
    return path;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!idFile || !selfieFile) {
      setError("ارفع صورة البطاقة والصورة الشخصية");
      return;
    }
    if (idFile.size > 5 * 1024 * 1024 || selfieFile.size > 5 * 1024 * 1024) {
      setError("حجم كل صورة يجب ألا يزيد عن 5 ميجا");
      return;
    }
    if (!/^01[0-9]{9}$/.test(form.phone)) {
      setError("اكتب رقم موبايل مصري صحيح (11 رقم)");
      return;
    }

    setLoading(true);
    try {
      let userId: string | undefined;
      const { data: current } = await supabase.auth.getSession();
      if (current.session) {
        userId = current.session.user.id;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });
        if (error) throw new Error(error.message);
        if (!data.session) {
          throw new Error("تأكيد البريد مفعّل، عطّله من إعدادات Supabase للتجربة");
        }
        userId = data.user?.id;
      }
      if (!userId) throw new Error("تعذر إنشاء الحساب");

      const idPath = await uploadDoc(userId, idFile, "national-id");
      const selfiePath = await uploadDoc(userId, selfieFile, "selfie");

      const { error: insertError } = await supabase.from("brokers").insert({
        user_id: userId,
        name: form.name,
        phone: form.phone,
        multiplier: parseFloat(form.multiplier),
        delivery_time: form.delivery_time,
        national_id_path: idPath,
        selfie_path: selfiePath,
        status: "pending",
      });
      if (insertError) throw new Error("تعذر حفظ الطلب، ربما قدّمت من قبل");

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <PageShell links={[{ href: "/", label: "الرئيسية" }]}>
        <div className="bg-white rounded-3xl shadow-xl shadow-pink-100/50 p-8 text-center space-y-3 mt-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl">
            ✓
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">تم استلام طلبك</h1>
          <p className="text-sm text-gray-600">
            سنراجع بياناتك ومستنداتك يدوياً، وستتمكن من الدخول للوحة بعد القبول.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell links={[{ href: "/", label: "الرئيسية" }]}
      title="انضم كوسيط في هاتلي"
      subtitle="اعرض أسعارك على عملاء يبحثون عن وسيط موثوق">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-2 bg-pink-50 border border-pink-100 rounded-2xl p-3 text-sm text-pink-900">
          <ShieldIcon className="w-5 h-5 shrink-0 mt-0.5 text-pink-600" />
          <p>التوثيق يبني ثقة العملاء فيك. مستنداتك محفوظة في مخزن خاص، ولا يراها إلا فريق المراجعة.</p>
        </div>

        <Card className="space-y-4">
          <h2 className="font-bold text-gray-900">بياناتك</h2>
          <Field label="الاسم بالكامل">
            <input required value={form.name}
              onChange={(e) => setField("name", e.target.value)} className={inputClass} />
          </Field>
          <Field label="رقم الموبايل">
            <input required placeholder="01xxxxxxxxx" value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              dir="ltr" inputMode="numeric" className={inputClass} />
          </Field>
          <Field label="البريد الإلكتروني">
            <input required type="email" value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              dir="ltr" className={inputClass} />
          </Field>
          <Field label="كلمة المرور">
            <input required type="password" minLength={6} placeholder="6 أحرف على الأقل"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              dir="ltr" className={inputClass} />
          </Field>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-bold text-gray-900">عرضك الأول</h2>
          <Field label="معامل الضرب">
            <input required type="number" min="1" step="0.01" placeholder="مثال: 14.5"
              value={form.multiplier}
              onChange={(e) => setField("multiplier", e.target.value)} className={inputClass} />
          </Field>
          <Field label="مدة التوصيل">
            <input required placeholder="مثال: 10 إلى 14 يوم" value={form.delivery_time}
              onChange={(e) => setField("delivery_time", e.target.value)} className={inputClass} />
          </Field>
          <p className="text-xs text-gray-500">
            يمكنك إضافة خيارات أسعار أخرى (شحن اقتصادي مثلاً) بعد القبول.
          </p>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-bold text-gray-900">مستندات التوثيق</h2>
          <Field label="صورة البطاقة الشخصية">
            <input required type="file" accept="image/*" className={fileClass}
              onChange={(e) => setIdFile(e.target.files?.[0] ?? null)} />
          </Field>
          <Field label="صورة شخصية واضحة (سيلفي)">
            <input required type="file" accept="image/*" capture="user" className={fileClass}
              onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)} />
          </Field>
        </Card>

        {error && <Notice>{error}</Notice>}

        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? "جاري الإرسال..." : "إرسال طلب الانضمام"}
        </button>
      </form>
    </PageShell>
  );
}