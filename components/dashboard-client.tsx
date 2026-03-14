"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Metric } from "@/lib/domain";
import { getFranchiseRepository } from "@/lib/repositories/franchise-repository";

export function DashboardClient() {
  const repository = getFranchiseRepository();
  const months = repository.listMonths();
  const sidos = repository.listSidos();
  const industries = repository.listIndustries();
  const source = repository.getSourceMeta();

  const [month, setMonth] = useState<string>(months[0] ?? "");
  const [metric, setMetric] = useState<Metric>("open");
  const [sido, setSido] = useState<string>("");
  const [industryMajor, setIndustryMajor] = useState<string>("");
  const [query, setQuery] = useState<string>("");

  const rows = useMemo(
    () =>
      repository.findRankings({
        month,
        metric,
        sido: sido || undefined,
        industryMajor: industryMajor || undefined,
        q: query || undefined
      }),
    [repository, month, metric, sido, industryMajor, query]
  );

  const topBrand = rows[0];

  function downloadCsv() {
    const header = ["rank", "brandName", "openCount", "closeCount", "netChange", "latestEventDate"];
    const lines = rows.map((item, index) =>
      [index + 1, item.brandName, item.openCount, item.closeCount, item.netChange, item.latestEventDate].join(",")
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
              개발 베이스 v0: 문서 스펙을 UI + API 구조로 연결한 구현 시작점
            </p>
          </div>
          <div>
            <p className="muted" style={{ margin: "4px 0" }}>
              Freshness: {source.generatedAt}
            </p>
            <p className="muted" style={{ margin: "4px 0" }}>
              Source: {source.source}
            </p>
            <p className="muted" style={{ margin: "4px 0" }}>
              Quality: {source.quality}
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

          <button type="button" onClick={downloadCsv}>
            CSV 다운로드
          </button>

          <Link href="/about-data" style={{ alignSelf: "center" }}>
            데이터 기준 보기
          </Link>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>랭킹 테이블</h2>
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
              rows.map((item, index) => (
                <tr key={`${item.brandId}-${index}`}>
                  <td>{index + 1}</td>
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
