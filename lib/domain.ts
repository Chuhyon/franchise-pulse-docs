export type Metric = "open" | "close";

export type RankingItem = {
  brandId: number;
  brandName: string;
  openCount: number;
  closeCount: number;
  netChange: number;
  latestEventDate: string;
  sido: string;
  sigungu: string;
  industryMajor: string;
};

export type RankingRecord = RankingItem & {
  month: string;
  metric: Metric;
};

export type TrendPoint = {
  month: string;
  openCount: number;
  closeCount: number;
  netChange: number;
};

export type SourceMeta = {
  generatedAt: string;
  source: string;
  quality: "healthy" | "degraded";
};

const rankingRecords: RankingRecord[] = [
  { month: "2026-02", metric: "open", brandId: 101, brandName: "Cafe One", openCount: 42, closeCount: 8, netChange: 34, latestEventDate: "2026-02-28", sido: "서울", sigungu: "강남구", industryMajor: "카페" },
  { month: "2026-02", metric: "open", brandId: 102, brandName: "Chicken Zip", openCount: 31, closeCount: 14, netChange: 17, latestEventDate: "2026-02-26", sido: "경기", sigungu: "성남시", industryMajor: "치킨" },
  { month: "2026-02", metric: "open", brandId: 103, brandName: "Kimbap Lab", openCount: 26, closeCount: 9, netChange: 17, latestEventDate: "2026-02-23", sido: "부산", sigungu: "해운대구", industryMajor: "분식" },
  { month: "2026-02", metric: "open", brandId: 104, brandName: "Bowl House", openCount: 22, closeCount: 6, netChange: 16, latestEventDate: "2026-02-22", sido: "서울", sigungu: "서초구", industryMajor: "한식" },
  { month: "2026-02", metric: "close", brandId: 201, brandName: "Noodle 24", openCount: 11, closeCount: 33, netChange: -22, latestEventDate: "2026-02-27", sido: "대구", sigungu: "중구", industryMajor: "중식" },
  { month: "2026-02", metric: "close", brandId: 202, brandName: "Rice Hero", openCount: 12, closeCount: 30, netChange: -18, latestEventDate: "2026-02-25", sido: "경기", sigungu: "수원시", industryMajor: "한식" },
  { month: "2026-01", metric: "open", brandId: 101, brandName: "Cafe One", openCount: 38, closeCount: 10, netChange: 28, latestEventDate: "2026-01-30", sido: "서울", sigungu: "강남구", industryMajor: "카페" },
  { month: "2026-01", metric: "open", brandId: 102, brandName: "Chicken Zip", openCount: 29, closeCount: 12, netChange: 17, latestEventDate: "2026-01-29", sido: "경기", sigungu: "성남시", industryMajor: "치킨" },
  { month: "2026-01", metric: "close", brandId: 201, brandName: "Noodle 24", openCount: 13, closeCount: 28, netChange: -15, latestEventDate: "2026-01-28", sido: "대구", sigungu: "중구", industryMajor: "중식" }
];

const trendByBrandId: Record<number, TrendPoint[]> = {
  101: [
    { month: "2025-09", openCount: 19, closeCount: 7, netChange: 12 },
    { month: "2025-10", openCount: 22, closeCount: 8, netChange: 14 },
    { month: "2025-11", openCount: 25, closeCount: 8, netChange: 17 },
    { month: "2025-12", openCount: 27, closeCount: 9, netChange: 18 },
    { month: "2026-01", openCount: 38, closeCount: 10, netChange: 28 },
    { month: "2026-02", openCount: 42, closeCount: 8, netChange: 34 }
  ],
  102: [
    { month: "2025-09", openCount: 14, closeCount: 10, netChange: 4 },
    { month: "2025-10", openCount: 16, closeCount: 11, netChange: 5 },
    { month: "2025-11", openCount: 20, closeCount: 12, netChange: 8 },
    { month: "2025-12", openCount: 24, closeCount: 11, netChange: 13 },
    { month: "2026-01", openCount: 29, closeCount: 12, netChange: 17 },
    { month: "2026-02", openCount: 31, closeCount: 14, netChange: 17 }
  ],
  103: [
    { month: "2025-09", openCount: 9, closeCount: 4, netChange: 5 },
    { month: "2025-10", openCount: 11, closeCount: 5, netChange: 6 },
    { month: "2025-11", openCount: 14, closeCount: 7, netChange: 7 },
    { month: "2025-12", openCount: 16, closeCount: 7, netChange: 9 },
    { month: "2026-01", openCount: 18, closeCount: 8, netChange: 10 },
    { month: "2026-02", openCount: 26, closeCount: 9, netChange: 17 }
  ]
};

const sourceMeta: SourceMeta = {
  generatedAt: "2026-03-12T05:31:00+09:00",
  source: "data.go.kr",
  quality: "healthy"
};

const defaultLimit = 100;

export function getAvailableMonths(): string[] {
  const set = new Set(rankingRecords.map((row) => row.month));
  return Array.from(set).sort().reverse();
}

export function getSidoOptions(): string[] {
  return Array.from(new Set(rankingRecords.map((row) => row.sido))).sort();
}

export function getIndustryOptions(): string[] {
  return Array.from(new Set(rankingRecords.map((row) => row.industryMajor))).sort();
}

export function getSourceMeta(): SourceMeta {
  return sourceMeta;
}

export function queryRankings(args: {
  month: string;
  metric: Metric;
  sido?: string;
  sigungu?: string;
  industryMajor?: string;
  q?: string;
  limit?: number;
}): RankingItem[] {
  const q = args.q?.trim().toLowerCase() ?? "";
  const limit = Number.isFinite(args.limit) && args.limit ? Math.max(1, Math.min(args.limit, 100)) : defaultLimit;

  const filtered = rankingRecords
    .filter((row) => row.month === args.month && row.metric === args.metric)
    .filter((row) => (args.sido ? row.sido === args.sido : true))
    .filter((row) => (args.sigungu ? row.sigungu === args.sigungu : true))
    .filter((row) => (args.industryMajor ? row.industryMajor === args.industryMajor : true))
    .filter((row) => (q ? row.brandName.toLowerCase().includes(q) : true));

  const sorted = [...filtered].sort((a, b) => {
    const metricDelta = args.metric === "open" ? b.openCount - a.openCount : b.closeCount - a.closeCount;
    if (metricDelta !== 0) {
      return metricDelta;
    }
    const dateDelta = b.latestEventDate.localeCompare(a.latestEventDate);
    if (dateDelta !== 0) {
      return dateDelta;
    }
    return a.brandName.localeCompare(b.brandName);
  });

  return sorted.slice(0, limit);
}

export function getBrandTrends(brandId: number, from?: string, to?: string): TrendPoint[] {
  const rows = trendByBrandId[brandId] ?? [];
  return rows.filter((row) => {
    if (from && row.month < from) {
      return false;
    }
    if (to && row.month > to) {
      return false;
    }
    return true;
  });
}

export function findBrandName(brandId: number): string {
  return rankingRecords.find((row) => row.brandId === brandId)?.brandName ?? `Brand ${brandId}`;
}
