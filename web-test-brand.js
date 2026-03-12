(function brandPage() {
  const data = window.FRANCHISE_PULSE_DATA;
  if (!data) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const brandId = params.get("brandId");
  const body = document.querySelector("#brandTrendBody");
  const title = document.querySelector("#brandTitle");

  const rowForName = data.rankings.find(function byId(item) {
    return String(item.brandId) === String(brandId);
  });
  const brandName = rowForName ? rowForName.brandName : "알 수 없는 브랜드";

  title.textContent = brandName + " 상세";

  const trend = data.trends[brandId] || [];
  body.innerHTML = "";
  if (trend.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td colspan=\"4\">데이터가 없습니다.</td>";
    body.appendChild(tr);
    return;
  }

  trend.forEach(function append(item) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + item.month + "</td>" +
      "<td>" + item.openCount + "</td>" +
      "<td>" + item.closeCount + "</td>" +
      "<td>" + item.netChange + "</td>";
    body.appendChild(tr);
  });
})();
