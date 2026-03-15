import {
  findBrandName,
  getAvailableMonths,
  getBrandTrends,
  getIndustryOptions,
  getSidoOptions,
  getSourceMeta,
  queryRankings,
  type Metric,
  type RankingItem,
  type SourceMeta,
  type TrendPoint
} from "@/lib/domain";
import { PostgresFranchiseRepository } from "@/lib/repositories/postgres-franchise-repository";
import { SupabaseFranchiseRepository } from "@/lib/repositories/supabase-franchise-repository";

export type RankingQuery = {
  month: string;
  metric: Metric;
  sido?: string;
  sigungu?: string;
  industryMajor?: string;
  q?: string;
  limit?: number;
};

export type RebuildRequest = {
  fromMonth?: string;
  toMonth?: string;
};

export type RebuildJob = {
  runId: string;
  status: "queued";
  fromMonth: string | null;
  toMonth: string | null;
  requestedAt: string;
};

export interface FranchiseRepository {
  getBackendName(): "postgres" | "supabase" | "in-memory";
  checkHealth(): Promise<{ ok: boolean; message: string }>;
  listMonths(): Promise<string[]>;
  listSidos(): Promise<string[]>;
  listIndustries(): Promise<string[]>;
  getSourceMeta(): Promise<SourceMeta>;
  findRankings(query: RankingQuery): Promise<RankingItem[]>;
  findBrandTrends(brandId: number, from?: string, to?: string): Promise<TrendPoint[]>;
  getBrandName(brandId: number): Promise<string>;
  requestRebuild(input: RebuildRequest): Promise<RebuildJob>;
}

class InMemoryFranchiseRepository implements FranchiseRepository {
  getBackendName(): "in-memory" {
    return "in-memory";
  }

  async listMonths(): Promise<string[]> {
    return getAvailableMonths();
  }

  async checkHealth(): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: "in-memory repository is active" };
  }

  async listSidos(): Promise<string[]> {
    return getSidoOptions();
  }

  async listIndustries(): Promise<string[]> {
    return getIndustryOptions();
  }

  async getSourceMeta(): Promise<SourceMeta> {
    return getSourceMeta();
  }

  async findRankings(query: RankingQuery): Promise<RankingItem[]> {
    return queryRankings(query);
  }

  async findBrandTrends(brandId: number, from?: string, to?: string): Promise<TrendPoint[]> {
    return getBrandTrends(brandId, from, to);
  }

  async getBrandName(brandId: number): Promise<string> {
    return findBrandName(brandId);
  }

  async requestRebuild(input: RebuildRequest): Promise<RebuildJob> {
    return {
      runId: `rebuild_${Date.now()}`,
      status: "queued",
      fromMonth: input.fromMonth ?? null,
      toMonth: input.toMonth ?? null,
      requestedAt: new Date().toISOString()
    };
  }
}

const inMemoryRepository = new InMemoryFranchiseRepository();
let postgresRepository: PostgresFranchiseRepository | null = null;
let supabaseRepository: SupabaseFranchiseRepository | null = null;

export function getFranchiseRepository(): FranchiseRepository {
  if (process.env.DATABASE_URL) {
    if (!postgresRepository) {
      postgresRepository = new PostgresFranchiseRepository(process.env.DATABASE_URL);
    }
    return postgresRepository;
  }

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (!supabaseRepository) {
      supabaseRepository = new SupabaseFranchiseRepository(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }
    return supabaseRepository;
  }

  return inMemoryRepository;
}
