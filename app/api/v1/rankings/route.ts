import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { getFranchiseRepository } from "@/lib/repositories/franchise-repository";
import { rankingsQuerySchema } from "@/lib/schemas";

const repository = getFranchiseRepository();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = rankingsQuerySchema.safeParse({
    month: searchParams.get("month"),
    metric: searchParams.get("metric"),
    sido: searchParams.get("sido") ?? undefined,
    sigungu: searchParams.get("sigungu") ?? undefined,
    industryMajor: searchParams.get("industryMajor") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    limit: searchParams.get("limit") ?? undefined
  });

  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid query parameters", "VALIDATION_ERROR", 400);
  }

  const input = parsed.data;
  const rows = repository.findRankings(input);
  const source = repository.getSourceMeta();

  const body = {
    month: input.month,
    metric: input.metric,
    generatedAt: source.generatedAt,
    items: rows.map((row, index) => ({
      rank: index + 1,
      brandId: row.brandId,
      brandName: row.brandName,
      openCount: row.openCount,
      closeCount: row.closeCount,
      netChange: row.netChange,
      latestEventDate: row.latestEventDate
    }))
  };

  return NextResponse.json(body, {
    headers: {
      "cache-control": "s-maxage=300, stale-while-revalidate=600"
    }
  });
}
