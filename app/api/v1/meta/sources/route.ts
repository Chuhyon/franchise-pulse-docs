import { NextResponse } from "next/server";
import { getFranchiseRepository } from "@/lib/repositories/franchise-repository";

const repository = getFranchiseRepository();

export async function GET() {
  const [source, health] = await Promise.all([
    repository.getSourceMeta(),
    repository.checkHealth()
  ]);

  return NextResponse.json(
    {
      sourceSystem: source.source,
      quality: source.quality,
      lastSuccessfulSyncAt: source.generatedAt,
      dataDelay: "PT0M",
      dataBackend: repository.getBackendName(),
      backendHealth: health
    },
    {
      headers: {
        "cache-control": "s-maxage=300, stale-while-revalidate=600"
      }
    }
  );
}
