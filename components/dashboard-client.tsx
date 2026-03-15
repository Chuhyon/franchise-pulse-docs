"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Metric } from "@/lib/domain";

type SourceMeta = {
  sourceSystem: string;
  quality: "healthy" | "degraded";
  lastSuccessfulSyncAt: string;
  dataBackend: "postgres" | "supabase" | "in-memory";
  backendHealth: {
    ok: boolean;
    message: string;
  };
};

type RankingRow = {
  rank: number;
  brandId: number;
  brandName: string;
  openCount: number;
  closeCount: number;
  netChange: number;
  latestEventDate: string;
};

type OptionsResponse = {
  months: string[];
  sidos: string[];
  industries: string[];
};

export function DashboardClient() {
  const [months, setMonths] = useState<string[]>([]);
  const [sidos, setSidos] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [source, setSource] = useState<SourceMeta | null>(null);
  const [rows, setRows] = useState<RankingRow[]>([]);

  const [month, setMonth] = useState<string>("");
  const [metric, setMetric] = useState<Metric>("open");
  const [sido, setSido] = useState<string>("");
  const [industryMajor, setIndustryMajor] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");

  useEffect(() => {
    async function loadInitialData() {
      const [optionsRes, sourceRes] = await Promise.all([
        fetch("/api/v1/meta/options", { cache: "no-store" }),
        fetch("/api/v1/meta/sources", { cache: "no-store" })
      ]);

      if (!optionsRes.ok || !sourceRes.ok) {
        setErrorText("초기 메타데이터를 불러오지 못했다.");
        return;
      }

      const optionsJson = (await optionsRes.json()) as OptionsResponse;
      const sourceJson = (await sourceRes.json()) as SourceMeta;

      setMonths(optionsJson.months);
      setSidos(optionsJson.sidos);
      setIndustries(optionsJson.industries);
      setSource(sourceJson);
      setMonth((current) => current || optionsJson.months[0] || "");
    }

    void loadInitialData();
  }, []);

  useEffect(() => {
    async function loadRankings() {
      if (!month) {
        return;
      }

      setLoading(true);
      setErrorText("");
      const search = new URLSearchParams({ month, metric });
      if (sido) {
        search.set("sido", sido);
      }
      if (industryMajor) {
        search.set("industryMajor", industryMajor);
      }
      if (query.trim()) {
        search.set("q", query.trim());
      }

      const response = await fetch(`/api/v1/rankings?${search.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        setErrorText("랭킹 데이터를 불러오지 못했다.");
        setRows([]);
        setLoading(false);
        return;
      }

      const json = (await response.json()) as { items: RankingRow[] };
      setRows(json.items);
      setLoading(false);
    }

    void loadRankings();
  }, [month, metric, sido, industryMajor, query]);

  const topBrand = useMemo(() => rows[0], [rows]);

  function downloadCsv() {
    const header = ["rank", "brandName", "openCount", "closeCount", "netChange", "latestEventDate"];
    const lines = rows.map((item) =>
      [item.rank, item.brandName, item.openCount, item.closeCount, item.netChange, item.latestEventDate].join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const element = document.createElement("a");
    element.href = href;
    element.download = `franchise-rankings-${month}-${metric}.csv`;
    element.click();
    URL.revokeObjectURL(href);
  }

  return (
    <main className="container">
      <section className="card" style={{ marginBottom: 16 }}>
        <div className="hero">
          <div>
            <p className="muted" style={{ margin: 0 }}>
              Franchise Pulse Korea
            </p>
            <h1 style={{ margin: "8px 0" }}>월별 개업/폐업 Top 100</h1>
            <p className="muted" style={{ margin: 0 }}>
              API 연동형 대시보드 개발 베이스
            </p>
          </div>
          <div>
            <p className="muted" style={{ margin: "4px 0" }}>
              Freshness: {source?.lastSuccessfulSyncAt ?? "-"}
            </p>
            <p className="muted" style={{ margin: "4px 0" }}>
              Source: {source?.sourceSystem ?? "-"}
            </p>
            <p className="muted" style={{ margin: "4px 0" }}>
              Quality: {source?.quality ?? "-"}
            </p>
            <p className="muted" style={{ margin: "4px 0" }}>
              Backend: {source?.dataBackend ?? "-"}
            </p>
            <p className="muted" style={{ margin: "4px 0" }}>
              Health: {source?.backendHealth.ok ? "ok" : "error"}
            </p>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="row">
          <select value={month} onChange={(event) => setMonth(event.target.value)}>
            {months.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select value={metric} onChange={(event) => setMetric(event.target.value as Metric)}>
            <option value="open">개업 Top 100</option>
            <option value="close">폐업 Top 100</option>
          </select>

          <select value={sido} onChange={(event) => setSido(event.target.value)}>
            <option value="">전체 지역</option>
            {sidos.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select value={industryMajor} onChange={(event) => setIndustryMajor(event.target.value)}>
            <option value="">전체 업종</option>
            {industries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            value={query}
            placeholder="브랜드 검색"
            onChange={(event) => setQuery(event.target.value)}
          />

          <button type="button" onClick={downloadCsv} disabled={rows.length === 0}>
            CSV 다운로드
          </button>

          <Link href="/about-data" style={{ alignSelf: "center" }}>
            데이터 기준 보기
          </Link>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>랭킹 테이블</h2>
        {loading ? <p className="muted">불러오는 중...</p> : null}
        {errorText ? <p className="muted">{errorText}</p> : null}
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Brand</th>
              <th>Open</th>
              <th>Close</th>
              <th>Net</th>
              <th>Latest Event</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>조건에 맞는 데이터가 없습니다.</td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr key={`${item.brandId}-${item.rank}`}>
                  <td>{item.rank}</td>
                  <td>
                    <Link href={`/brand/${item.brandId}`}>{item.brandName}</Link>
                  </td>
                  <td>{item.openCount}</td>
                  <td>{item.closeCount}</td>
                  <td>{item.netChange}</td>
                  <td>{item.latestEventDate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>선택 요약</h2>
        {topBrand ? (
          <p className="muted" style={{ margin: 0 }}>
            현재 조건 최상위 브랜드는 <strong>{topBrand.brandName}</strong>이고, 순증은 {topBrand.netChange}이다.
          </p>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            현재 조건에서는 요약 가능한 결과가 없다.
          </p>
        )}
      </section>
    </main>
  );
}
