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
  async listMonths(): Promise<string[]> {
    return getAvailableMonths();
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

export function getFranchiseRepository(): FranchiseRepository {
  if (process.env.DATABASE_URL) {
    if (!postgresRepository) {
      postgresRepository = new PostgresFranchiseRepository(process.env.DATABASE_URL);
    }
    return postgresRepository;
  }
  return inMemoryRepository;
}
