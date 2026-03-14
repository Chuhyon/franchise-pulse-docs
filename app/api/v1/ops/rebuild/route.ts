import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { getFranchiseRepository } from "@/lib/repositories/franchise-repository";
import { rebuildBodySchema } from "@/lib/schemas";

const repository = getFranchiseRepository();

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return apiError("Missing or invalid authorization token", "UNAUTHORIZED", 401);
  }

  const providedToken = authHeader.slice("Bearer ".length);
  const expectedToken = process.env.OPS_TOKEN;
  if (!expectedToken) {
    return apiError("Operation is not allowed", "FORBIDDEN", 403);
  }
  if (providedToken !== expectedToken) {
    return apiError("Missing or invalid authorization token", "UNAUTHORIZED", 401);
  }

  const rawBody = await request.json().catch(() => ({}));
  const parsedBody = rebuildBodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return apiError(parsedBody.error.issues[0]?.message ?? "Invalid request body", "VALIDATION_ERROR", 400);
  }

  const job = repository.requestRebuild(parsedBody.data);

  return NextResponse.json(
    job,
    {
      status: 202,
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}
