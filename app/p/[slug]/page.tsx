import { Suspense } from "react";
import { PageClient } from "./PageClient";

async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PageClient slug={slug} />;
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={null}>
      <Content params={params} />
    </Suspense>
  );
}