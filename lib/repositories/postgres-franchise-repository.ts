import { Pool } from "pg";
import type { RankingItem, SourceMeta, TrendPoint } from "@/lib/domain";
import type {
  FranchiseRepository,
  RankingQuery,
  RebuildJob,
  RebuildRequest
} from "@/lib/repositories/franchise-repository";

const globalForPool = globalThis as unknown as {
  franchisePulsePool?: Pool;
};

function getPool(connectionString: string): Pool {
  if (!globalForPool.franchisePulsePool) {
    globalForPool.franchisePulsePool = new Pool({ connectionString });
  }
  return globalForPool.franchisePulsePool;
}

export class PostgresFranchiseRepository implements FranchiseRepository {
  private readonly pool: Pool;

  public constructor(connectionString: string) {
    this.pool = getPool(connectionString);
  }

  public getBackendName(): "postgres" {
    return "postgres";
  }

  public async checkHealth(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.pool.query("select 1");
      return { ok: true, message: "postgres connection is healthy" };
    } catch (error) {
      console.error("postgres health check failed", error);
      return { ok: false, message: "postgres connection failed" };
    }
  }

  public async listMonths(): Promise<string[]> {
    try {
      const result = await this.pool.query<{ month: string }>(
        "select distinct event_month as month from fact_establishment_event order by month desc"
      );
      return result.rows.map((row) => row.month);
    } catch (error) {
      console.error("listMonths query failed", error);
      return [];
    }
  }

  public async listSidos(): Promise<string[]> {
    try {
      const result = await this.pool.query<{ sido: string }>(
        "select distinct sido from fact_establishment_event where sido is not null and sido <> '' order by sido asc"
      );
      return result.rows.map((row) => row.sido);
    } catch (error) {
      console.error("listSidos query failed", error);
      return [];
    }
  }

  public async listIndustries(): Promise<string[]> {
    try {
      const result = await this.pool.query<{ industry_major: string }>(
        "select distinct industry_major from fact_establishment_event where industry_major is not null and industry_major <> '' order by industry_major asc"
      );
      return result.rows.map((row) => row.industry_major);
    } catch (error) {
      console.error("listIndustries query failed", error);
      return [];
    }
  }

  public async getSourceMeta(): Promise<SourceMeta> {
    try {
      const result = await this.pool.query<{
        source_system: string;
        finished_at: string | null;
        status: string;
      }>(
        "select source_system, finished_at, status from ops_ingestion_run order by started_at desc limit 1"
      );
      const row = result.rows[0];
      if (!row) {
        return {
          generatedAt: new Date().toISOString(),
          source: "data.go.kr",
          quality: "healthy"
        };
      }
      return {
        generatedAt: row.finished_at ?? new Date().toISOString(),
        source: row.source_system || "data.go.kr",
        quality: row.status === "success" ? "healthy" : "degraded"
      };
    } catch (error) {
      console.error("getSourceMeta query failed", error);
      return {
        generatedAt: new Date().toISOString(),
        source: "data.go.kr",
        quality: "degraded"
      };
    }
  }

  public async findRankings(query: RankingQuery): Promise<RankingItem[]> {
    const values: Array<string | number> = [query.month, query.metric.toUpperCase()];

    const filterSql: string[] = ["f.event_month = $1"]; 
    if (query.sido) {
      values.push(query.sido);
      filterSql.push(`f.sido = $${values.length}`);
    }
    if (query.sigungu) {
      values.push(query.sigungu);
      filterSql.push(`f.sigungu = $${values.length}`);
    }
    if (query.industryMajor) {
      values.push(query.industryMajor);
      filterSql.push(`f.industry_major = $${values.length}`);
    }
    if (query.q) {
      values.push(`%${query.q}%`);
      filterSql.push(`b.brand_name ilike $${values.length}`);
    }

    const limit = Math.max(1, Math.min(query.limit ?? 100, 100));
    values.push(limit);

    const sql = `
      with filtered as (
        select
          f.brand_id,
          b.brand_name,
          f.event_date,
          f.event_type,
          f.sido,
          f.sigungu,
          f.industry_major
        from fact_establishment_event f
        left join dim_brand b on b.brand_id = f.brand_id
        where ${filterSql.join(" and ")}
      ), aggregated as (
        select
          brand_id,
          coalesce(max(brand_name), 'Unknown') as brand_name,
          count(*) filter (where event_type = 'OPEN') as open_count,
          count(*) filter (where event_type = 'CLOSE') as close_count,
          max(event_date) as latest_event_date,
          coalesce(max(sido), '') as sido,
          coalesce(max(sigungu), '') as sigungu,
          coalesce(max(industry_major), '') as industry_major,
          count(*) filter (where event_type = $2) as metric_count
        from filtered
        group by brand_id
      )
      select
        brand_id,
        brand_name,
        open_count,
        close_count,
        (open_count - close_count) as net_change,
        latest_event_date,
        sido,
        sigungu,
        industry_major
      from aggregated
      order by metric_count desc, latest_event_date desc, brand_name asc
      limit $${values.length}
    `;

    try {
      const result = await this.pool.query<{
        brand_id: number;
        brand_name: string;
        open_count: string;
        close_count: string;
        net_change: string;
        latest_event_date: string | null;
        sido: string;
        sigungu: string;
        industry_major: string;
      }>(sql, values);

      return result.rows.map((row) => ({
        brandId: row.brand_id,
        brandName: row.brand_name,
        openCount: Number(row.open_count),
        closeCount: Number(row.close_count),
        netChange: Number(row.net_change),
        latestEventDate: row.latest_event_date ?? "",
        sido: row.sido,
        sigungu: row.sigungu,
        industryMajor: row.industry_major
      }));
    } catch (error) {
      console.error("findRankings query failed", error);
      return [];
    }
  }

  public async findBrandTrends(brandId: number, from?: string, to?: string): Promise<TrendPoint[]> {
    const values: Array<string | number> = [brandId];
    const filterSql = ["brand_id = $1"];

    if (from) {
      values.push(from);
      filterSql.push(`event_month >= $${values.length}`);
    }
    if (to) {
      values.push(to);
      filterSql.push(`event_month <= $${values.length}`);
    }

    const sql = `
      select
        event_month as month,
        count(*) filter (where event_type = 'OPEN') as open_count,
        count(*) filter (where event_type = 'CLOSE') as close_count
      from fact_establishment_event
      where ${filterSql.join(" and ")}
      group by event_month
      order by event_month asc
    `;

    try {
      const result = await this.pool.query<{ month: string; open_count: string; close_count: string }>(sql, values);
      return result.rows.map((row) => {
        const openCount = Number(row.open_count);
        const closeCount = Number(row.close_count);
        return {
          month: row.month,
          openCount,
          closeCount,
          netChange: openCount - closeCount
        };
      });
    } catch (error) {
      console.error("findBrandTrends query failed", error);
      return [];
    }
  }

  public async getBrandName(brandId: number): Promise<string> {
    try {
      const result = await this.pool.query<{ brand_name: string }>(
        "select brand_name from dim_brand where brand_id = $1 limit 1",
        [brandId]
      );
      return result.rows[0]?.brand_name ?? `Brand ${brandId}`;
    } catch (error) {
      console.error("getBrandName query failed", error);
      return `Brand ${brandId}`;
    }
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

}
