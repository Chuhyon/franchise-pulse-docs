import Link from "next/link";
import { getFranchiseRepository } from "@/lib/repositories/franchise-repository";

type Props = {
  params: Promise<{ brandId: string }>;
};

export default async function BrandDetailPage({ params }: Props) {
  const repository = getFranchiseRepository();
  const resolved = await params;
  const brandId = Number.parseInt(resolved.brandId, 10);
  const trends = Number.isNaN(brandId) ? [] : repository.findBrandTrends(brandId);
  const brandName = Number.isNaN(brandId) ? "Unknown Brand" : repository.getBrandName(brandId);

  const values = trends.map((item) => item.netChange);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const range = Math.max(1, max - min);
  const chartWidth = 720;
  const chartHeight = 220;
  const stepX = trends.length > 1 ? chartWidth / (trends.length - 1) : chartWidth;

  const linePoints = trends
    .map((item, index) => {
      const x = index * stepX;
      const normalized = (item.netChange - min) / range;
      const y = chartHeight - normalized * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <main className="container">
      <section className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          <Link href="/">대시보드로 돌아가기</Link>
        </p>
        <h1>{brandName}</h1>
        <p className="muted">월별 개업/폐업/순증 추이</p>

        {trends.length > 1 ? (
          <div style={{ marginBottom: 16 }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="220" role="img" aria-label="net change trend">
              <polyline fill="none" stroke="#0f766e" strokeWidth="3" points={linePoints} />
            </svg>
          </div>
        ) : null}

        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Open</th>
              <th>Close</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {trends.length === 0 ? (
              <tr>
                <td colSpan={4}>데이터가 없습니다.</td>
              </tr>
            ) : (
              trends.map((item) => (
                <tr key={item.month}>
                  <td>{item.month}</td>
                  <td>{item.openCount}</td>
                  <td>{item.closeCount}</td>
                  <td>{item.netChange}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
