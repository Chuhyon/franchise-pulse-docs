(function main() {
  const data = window.FRANCHISE_PULSE_DATA;
  if (!data) {
    return;
  }

  const monthSelect = document.querySelector("#monthSelect");
  const metricSelect = document.querySelector("#metricSelect");
  const sidoSelect = document.querySelector("#sidoSelect");
  const industrySelect = document.querySelector("#industrySelect");
  const searchInput = document.querySelector("#searchInput");
  const csvButton = document.querySelector("#csvButton");
  const tableBody = document.querySelector("#tableBody");
  const emptyState = document.querySelector("#emptyState");
  const trendBrand = document.querySelector("#trendBrand");
  const trendList = document.querySelector("#trendList");
  const freshnessValue = document.querySelector("#freshnessValue");
  const sourceValue = document.querySelector("#sourceValue");
  const qualityValue = document.querySelector("#qualityValue");

  const months = uniq(data.rankings.map(function pickMonth(item) { return item.month; })).sort().reverse();
  const sidos = uniq(data.rankings.map(function pickSido(item) { return item.sido; })).sort();
  const industries = uniq(data.rankings.map(function pickIndustry(item) { return item.industryMajor; })).sort();

  fillSelect(monthSelect, months, months[0]);
  fillSelect(sidoSelect, ["전체"].concat(sidos), "전체");
  fillSelect(industrySelect, ["전체"].concat(industries), "전체");

  freshnessValue.textContent = data.sources.generatedAt;
  sourceValue.textContent = data.sources.source;
  qualityValue.textContent = data.sources.quality;

  metricSelect.addEventListener("change", render);
  monthSelect.addEventListener("change", render);
  sidoSelect.addEventListener("change", render);
  industrySelect.addEventListener("change", render);
  searchInput.addEventListener("input", render);
  csvButton.addEventListener("click", downloadCsv);

  render();

  function render() {
    const month = monthSelect.value;
    const metric = metricSelect.value;
    const sido = sidoSelect.value;
    const industry = industrySelect.value;
    const query = searchInput.value.trim().toLowerCase();

    let rows = data.rankings.filter(function byMonthMetric(item) {
      return item.month === month && item.metric === metric;
    });

    if (sido !== "전체") {
      rows = rows.filter(function bySido(item) { return item.sido === sido; });
    }

    if (industry !== "전체") {
      rows = rows.filter(function byIndustry(item) { return item.industryMajor === industry; });
    }

    if (query) {
      rows = rows.filter(function byBrand(item) {
        return item.brandName.toLowerCase().indexOf(query) >= 0;
      });
    }

    rows.sort(function byRank(a, b) {
      if (metric === "open") {
        return b.openCount - a.openCount;
      }
      return b.closeCount - a.closeCount;
    });

    const rankedRows = rows.map(function withRank(item, index) {
      return Object.assign({}, item, { rank: index + 1 });
    });

    tableBody.innerHTML = "";
    if (rankedRows.length === 0) {
      emptyState.hidden = false;
      trendBrand.textContent = "브랜드를 선택하세요";
      trendList.innerHTML = "";
      return;
    }

    emptyState.hidden = true;
    rankedRows.forEach(function appendRow(item) {
      const row = document.createElement("tr");
      row.innerHTML =
        "<td>" + item.rank + "</td>" +
        "<td><a class=\"brand-link\" data-brand-id=\"" + item.brandId + "\" href=\"/brand?brandId=" + item.brandId + "\">" + escapeHtml(item.brandName) + "</a></td>" +
        "<td>" + item.openCount + "</td>" +
        "<td>" + item.closeCount + "</td>" +
        "<td>" + item.netChange + "</td>" +
        "<td>" + item.latestEventDate + "</td>";

      const brandLink = row.querySelector(".brand-link");
      brandLink.addEventListener("click", function onClick(event) {
        event.preventDefault();
        renderTrend(item.brandId, item.brandName);
      });
      tableBody.appendChild(row);
    });
  }

  function renderTrend(brandId, brandName) {
    const trend = data.trends[brandId] || [];
    trendBrand.textContent = brandName + " - 최근 " + trend.length + "개월";
    trendList.innerHTML = "";
    trend.forEach(function appendTrend(t) {
      const li = document.createElement("li");
      li.textContent = t.month + " | open " + t.openCount + " | close " + t.closeCount + " | net " + t.netChange;
      trendList.appendChild(li);
    });
  }

  function downloadCsv() {
    const rows = Array.from(tableBody.querySelectorAll("tr")).map(function mapRow(tr) {
      const cells = Array.from(tr.querySelectorAll("td")).map(function mapCell(td) {
        return td.textContent;
      });
      return cells;
    });

    const header = ["rank", "brandName", "openCount", "closeCount", "netChange", "latestEventDate"];
    const lines = [header.join(",")].concat(rows.map(function makeLine(cells) { return cells.join(","); }));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const month = monthSelect.value;
    const metric = metricSelect.value;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "franchise-rankings-" + month + "-" + metric + ".csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  function fillSelect(selectElement, values, selectedValue) {
    selectElement.innerHTML = "";
    values.forEach(function appendOption(value) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      if (value === selectedValue) {
        option.selected = true;
      }
      selectElement.appendChild(option);
    });
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
