export default function AboutDataPage() {
  return (
    <main className="container">
      <section className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          Franchise Pulse Korea
        </p>
        <h1>데이터 출처 및 기준</h1>

        <h2>소스 우선순위</h2>
        <ul>
          <li>data.go.kr (기본 소스)</li>
          <li>KFTC (브랜드/가맹 메타데이터 보강)</li>
          <li>legacy/local backup (전환기 보조)</li>
        </ul>

        <h2>지표 산정</h2>
        <ul>
          <li>월 버킷: Asia/Seoul 기준 YYYY-MM</li>
          <li>순증: net_change = open_count - close_count</li>
          <li>랭킹 정렬: count DESC -&gt; latest_event_date DESC -&gt; brand_name ASC</li>
        </ul>

        <h2>운영 정책</h2>
        <ul>
          <li>일 단위 갱신 목표: 95% 이상</li>
          <li>파이프라인 실행 성공률 목표: 99% 이상</li>
          <li>단일 소스 장애 시 마지막 정상 집계 유지(degraded)</li>
        </ul>
      </section>
    </main>
  );
}
