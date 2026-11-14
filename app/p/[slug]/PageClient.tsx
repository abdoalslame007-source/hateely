"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { PageShell, Card, Notice, Loading } from "../../../components/ui";

type Row = { title: string; content: string; updated_at: string };

function Body({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <div className="space-y-3">
      {blocks.map((b, i) =>
        b.startsWith("## ") ? (
          <h2 key={i} className="pt-2 text-lg font-extrabold text-gray-900">
            {b.slice(3)}
          </h2>
        ) : (
          <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
            {b}
          </p>
        )
      )}
    </div>
  );
}

export function PageClient({ slug }: { slug: string }) {
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("pages")
      .select("title,content,updated_at")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setRow((data as Row) ?? null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <Loading />;

  const links = [{ href: "/", label: "الرئيسية" }];

  if (!row) {
    return (
      <PageShell links={links}>
        <Notice type="warning">هذه الصفحة غير موجودة.</Notice>
      </PageShell>
    );
  }

  return (
    <PageShell links={links} title={row.title}
      subtitle={`آخر تحديث: ${new Date(row.updated_at).toLocaleDateString("ar-EG")}`}>
      <Card>
        <Body text={row.content} />
      </Card>
    </PageShell>
  );
}