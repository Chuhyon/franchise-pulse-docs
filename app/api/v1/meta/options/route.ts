import { NextResponse } from "next/server";
import { getFranchiseRepository } from "@/lib/repositories/franchise-repository";

const repository = getFranchiseRepository();

export async function GET() {
  const [months, sidos, industries] = await Promise.all([
    repository.listMonths(),
    repository.listSidos(),
    repository.listIndustries()
  ]);

  return NextResponse.json(
    {
      months,
      sidos,
      industries
    },
    {
      headers: {
        "cache-control": "s-maxage=300, stale-while-revalidate=600"
      }
    }
  );
}
