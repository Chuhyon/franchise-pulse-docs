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
  listMonths(): string[];
  listSidos(): string[];
  listIndustries(): string[];
  getSourceMeta(): SourceMeta;
  findRankings(query: RankingQuery): RankingItem[];
  findBrandTrends(brandId: number, from?: string, to?: string): TrendPoint[];
  getBrandName(brandId: number): string;
  requestRebuild(input: RebuildRequest): RebuildJob;
}

class InMemoryFranchiseRepository implements FranchiseRepository {
  listMonths(): string[] {
    return getAvailableMonths();
  }

  listSidos(): string[] {
    return getSidoOptions();
  }

  listIndustries(): string[] {
    return getIndustryOptions();
  }

  getSourceMeta(): SourceMeta {
    return getSourceMeta();
  }

  findRankings(query: RankingQuery): RankingItem[] {
    return queryRankings(query);
  }

  findBrandTrends(brandId: number, from?: string, to?: string): TrendPoint[] {
    return getBrandTrends(brandId, from, to);
  }

  getBrandName(brandId: number): string {
    return findBrandName(brandId);
  }

  requestRebuild(input: RebuildRequest): RebuildJob {
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

export function getFranchiseRepository(): FranchiseRepository {
  return inMemoryRepository;
}
