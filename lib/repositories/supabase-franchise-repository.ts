import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { RankingItem, SourceMeta, TrendPoint } from "@/lib/domain";
import type {
  FranchiseRepository,
  RankingQuery,
  RebuildJob,
  RebuildRequest
} from "@/lib/repositories/franchise-repository";

export class SupabaseFranchiseRepository implements FranchiseRepository {
  private readonly client: SupabaseClient;

  public constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false }
    });
  }

  public getBackendName(): "supabase" {
    return "supabase";
  }

  public async checkHealth(): Promise<{ ok: boolean; message: string }> {
    const { error } = await this.client.from("fact_establishment_event").select("event_id").limit(1);
    if (error) {
      return { ok: false, message: `supabase query failed: ${error.message}` };
    }
    return { ok: true, message: "supabase query is healthy" };
  }

  public async listMonths(): Promise<string[]> {
    const { data, error } = await this.client
      .from("fact_establishment_event")
      .select("event_month")
      .order("event_month", { ascending: false })
      .limit(1000);

    if (error || !data) {
      return [];
    }

    return Array.from(new Set(data.map((row) => row.event_month).filter(Boolean)));
  }

  public async listSidos(): Promise<string[]> {
    const { data, error } = await this.client
      .from("fact_establishment_event")
      .select("sido")
      .order("sido", { ascending: true })
      .limit(2000);

    if (error || !data) {
      return [];
    }

    return Array.from(new Set(data.map((row) => row.sido).filter((value): value is string => Boolean(value))));
  }

  public async listIndustries(): Promise<string[]> {
    const { data, error } = await this.client
      .from("fact_establishment_event")
      .select("industry_major")
      .order("industry_major", { ascending: true })
      .limit(2000);

    if (error || !data) {
      return [];
    }

    return Array.from(
      new Set(data.map((row) => row.industry_major).filter((value): value is string => Boolean(value)))
    );
  }

  public async getSourceMeta(): Promise<SourceMeta> {
    const { data, error } = await this.client
      .from("ops_ingestion_run")
      .select("source_system,finished_at,status")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        generatedAt: new Date().toISOString(),
        source: "data.go.kr",
        quality: "degraded"
      };
    }

    return {
      generatedAt: data.finished_at ?? new Date().toISOString(),
      source: data.source_system ?? "data.go.kr",
      quality: data.status === "success" ? "healthy" : "degraded"
    };
  }

  public async findRankings(query: RankingQuery): Promise<RankingItem[]> {
    let builder = this.client
      .from("fact_establishment_event")
      .select("brand_id,event_date,event_type,sido,sigungu,industry_major,dim_brand(brand_name)")
      .eq("event_month", query.month);

    if (query.sido) {
      builder = builder.eq("sido", query.sido);
    }
    if (query.sigungu) {
      builder = builder.eq("sigungu", query.sigungu);
    }
    if (query.industryMajor) {
      builder = builder.eq("industry_major", query.industryMajor);
    }

    const { data, error } = await builder.limit(10000);
    if (error || !data) {
      return [];
    }

    const filtered = query.q
      ? data.filter((row) => {
          const brandName = this.extractBrandName(row.dim_brand);
          return brandName.toLowerCase().includes(query.q!.toLowerCase());
        })
      : data;

    const grouped = new Map<number, RankingItem & { metricCount: number }>();
    for (const row of filtered) {
      const brandId = row.brand_id as number | null;
      if (!brandId) {
        continue;
      }
      const current = grouped.get(brandId) ?? {
        brandId,
        brandName: this.extractBrandName(row.dim_brand) || `Brand ${brandId}`,
        openCount: 0,
        closeCount: 0,
        netChange: 0,
        latestEventDate: row.event_date ?? "",
        sido: row.sido ?? "",
        sigungu: row.sigungu ?? "",
        industryMajor: row.industry_major ?? "",
        metricCount: 0
      };

      if ((row.event_type as string) === "OPEN") {
        current.openCount += 1;
      }
      if ((row.event_type as string) === "CLOSE") {
        current.closeCount += 1;
      }
      if ((row.event_type as string) === query.metric.toUpperCase()) {
        current.metricCount += 1;
      }
      if ((row.event_date ?? "") > current.latestEventDate) {
        current.latestEventDate = row.event_date ?? current.latestEventDate;
      }

      grouped.set(brandId, current);
    }

    const rows = Array.from(grouped.values()).map((item) => ({
      brandId: item.brandId,
      brandName: item.brandName,
      openCount: item.openCount,
      closeCount: item.closeCount,
      netChange: item.openCount - item.closeCount,
      latestEventDate: item.latestEventDate,
      sido: item.sido,
      sigungu: item.sigungu,
      industryMajor: item.industryMajor,
      metricCount: item.metricCount
    }));

    rows.sort((a, b) => {
      const metricDelta = b.metricCount - a.metricCount;
      if (metricDelta !== 0) {
        return metricDelta;
      }
      const dateDelta = b.latestEventDate.localeCompare(a.latestEventDate);
      if (dateDelta !== 0) {
        return dateDelta;
      }
      return a.brandName.localeCompare(b.brandName);
    });

    return rows.slice(0, query.limit ?? 100).map(({ metricCount: _metricCount, ...rest }) => rest);
  }

  public async findBrandTrends(brandId: number, from?: string, to?: string): Promise<TrendPoint[]> {
    let builder = this.client
      .from("fact_establishment_event")
      .select("event_month,event_type")
      .eq("brand_id", brandId)
      .order("event_month", { ascending: true });

    if (from) {
      builder = builder.gte("event_month", from);
    }
    if (to) {
      builder = builder.lte("event_month", to);
    }

    const { data, error } = await builder.limit(10000);
    if (error || !data) {
      return [];
    }

    const byMonth = new Map<string, { openCount: number; closeCount: number }>();
    for (const row of data) {
      const month = row.event_month as string;
      const current = byMonth.get(month) ?? { openCount: 0, closeCount: 0 };
      if ((row.event_type as string) === "OPEN") {
        current.openCount += 1;
      }
      if ((row.event_type as string) === "CLOSE") {
        current.closeCount += 1;
      }
      byMonth.set(month, current);
    }

    return Array.from(byMonth.entries()).map(([month, value]) => ({
      month,
      openCount: value.openCount,
      closeCount: value.closeCount,
      netChange: value.openCount - value.closeCount
    }));
  }

  public async getBrandName(brandId: number): Promise<string> {
    const { data, error } = await this.client
      .from("dim_brand")
      .select("brand_name")
      .eq("brand_id", brandId)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return `Brand ${brandId}`;
    }

    return data.brand_name ?? `Brand ${brandId}`;
  }

  public async requestRebuild(input: RebuildRequest): Promise<RebuildJob> {
    return {
      runId: `rebuild_${Date.now()}`,
      status: "queued",
      fromMonth: input.fromMonth ?? null,
      toMonth: input.toMonth ?? null,
      requestedAt: new Date().toISOString()
    };
  }

  private extractBrandName(value: unknown): string {
    if (Array.isArray(value)) {
      const first = value[0] as { brand_name?: unknown } | undefined;
      return typeof first?.brand_name === "string" ? first.brand_name : "";
    }
    if (value && typeof value === "object") {
      const row = value as { brand_name?: unknown };
      return typeof row.brand_name === "string" ? row.brand_name : "";
    }
    return "";
  }
}
