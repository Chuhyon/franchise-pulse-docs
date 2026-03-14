import { z } from "zod";

const monthPattern = /^\d{4}-\d{2}$/;

export const rankingsQuerySchema = z.object({
  month: z.string().regex(monthPattern, "month must be YYYY-MM"),
  metric: z.enum(["open", "close"]),
  sido: z.string().min(1).optional(),
  sigungu: z.string().min(1).optional(),
  industryMajor: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export const trendsPathSchema = z.object({
  brandId: z.coerce.number().int().positive()
});

export const trendsQuerySchema = z.object({
  from: z.string().regex(monthPattern, "from must be YYYY-MM").optional(),
  to: z.string().regex(monthPattern, "to must be YYYY-MM").optional()
});

export const rebuildBodySchema = z.object({
  fromMonth: z.string().regex(monthPattern, "fromMonth must be YYYY-MM").optional(),
  toMonth: z.string().regex(monthPattern, "toMonth must be YYYY-MM").optional()
});
