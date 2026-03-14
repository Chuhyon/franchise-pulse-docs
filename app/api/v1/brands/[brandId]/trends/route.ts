import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { getFranchiseRepository } from "@/lib/repositories/franchise-repository";
import { trendsPathSchema, trendsQuerySchema } from "@/lib/schemas";

const repository = getFranchiseRepository();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const pathParsed = trendsPathSchema.safeParse(await params);
  if (!pathParsed.success) {
    return apiError("Invalid brandId", "VALIDATION_ERROR", 400);
  }

  const { searchParams } = new URL(request.url);
  const queryParsed = trendsQuerySchema.safeParse({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined
  });
  if (!queryParsed.success) {
    return apiError(queryParsed.error.issues[0]?.message ?? "Invalid query parameters", "VALIDATION_ERROR", 400);
  }

  const brandId = pathParsed.data.brandId;
  const from = queryParsed.data.from;
  const to = queryParsed.data.to;
  const items = repository.findBrandTrends(brandId, from, to);

  return NextResponse.json({ brandId, from, to, items }, {
    headers: {
      "cache-control": "s-maxage=300, stale-while-revalidate=600"
    }
  });
}
