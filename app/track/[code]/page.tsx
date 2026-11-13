import { Suspense } from "react";
import { TrackClient } from "./TrackClient";

async function TrackContent({
  params,
  }: {
    params: Promise<{ code: string }>;
    }) {
      const { code } = await params;
        return <TrackClient code={code} />;
        }

        export default function TrackPage({
          params,
          }: {
            params: Promise<{ code: string }>;
            }) {
              return (
                  <Suspense fallback={null}>
                        <TrackContent params={params} />
                            </Suspense>
                              );
                              }