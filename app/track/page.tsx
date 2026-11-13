"use client";

import { useState } from "react";
import { PageShell, Card, Field, inputClass, primaryBtn } from "../../components/ui";

export default function TrackLookup() {
  const [code, setCode] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = `/track/${encodeURIComponent(code.trim())}`;
  }

  return (
    <PageShell links={[{ href: "/", label: "الرئيسية" }]}
      title="تتبع طلبك" subtitle="اكتب رمز التتبع الذي ظهر لك بعد تأكيد الطلب">
      <form onSubmit={go}>
        <Card className="space-y-4">
          <Field label="رمز التتبع">
            <input required dir="ltr" value={code}
              onChange={(e) => setCode(e.target.value)} className={inputClass} />
          </Field>
          <button type="submit" className={primaryBtn}>تتبع</button>
        </Card>
      </form>
    </PageShell>
  );
}