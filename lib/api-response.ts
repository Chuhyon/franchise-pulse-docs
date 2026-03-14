import { NextResponse } from "next/server";

export function apiError(message: string, code: string, status: number) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        requestId: crypto.randomUUID(),
        retryable: status >= 500
      }
    },
    { status }
  );
}
