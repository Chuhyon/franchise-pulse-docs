import { NextResponse } from "next/server";
import { getFranchiseRepository } from "@/lib/repositories/franchise-repository";

const repository = getFranchiseRepository();

export async function GET() {
  const source = repository.getSourceMeta();
  return NextResponse.json(
    {
      sourceSystem: source.source,
      quality: source.quality,
      lastSuccessfulSyncAt: source.generatedAt,
      dataDelay: "PT0M"
    },
    {
      headers: {
        "cache-control": "s-maxage=300, stale-while-revalidate=600"
      }
    }
  );
}
