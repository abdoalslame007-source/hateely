import { TrackClient } from "./TrackClient";

export default async function TrackPage({
  params,
  }: {
    params: Promise<{ code: string }>;
    }) {
      const { code } = await params;
        return <TrackClient code={code} />;
        }