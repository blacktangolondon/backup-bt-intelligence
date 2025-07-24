/* Base resets */
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Body styling */
body {
  background: #111;
  color: #ddd;
  font-family: sans-serif;
}

/* Layout grid */
#container {
  display: grid;
  grid-template-areas:
    "module1 module3"
    "module2 module4";
  grid-template-columns: 2fr 3fr;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
  height: 100vh;
}

/* Module placements */
#module1 { grid-area: module1; }
#module2 { grid-area: module2; }
#module3 {
  grid-area: module3;
  display: grid;
  /* 3 rows: heading / big chart / small chart */
  grid-template-rows: auto 2fr 1fr;
  gap: 16px;
  height: 100%;
  min-height: 0;
}
/* Pin each child into its row */
#module3 > h2 {
  grid-row: 1;
  padding: 0 16px;
}
#equityChart {
  grid-row: 2;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.bottom-charts {
  grid-row: 3;
  display: flex;
  align-items: stretch;
  overflow: auto;
  min-height: 0;
}
.bottom-charts canvas {
  flex: 1;
  width: 100%;
  height: 100%;
}

/* Module 4: New Strategies Alert */
#module4 {
  grid-area: module4;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
}

/* Modules 1 & 2 scroll internally */
#module1,
#module2 {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
}

/* Card styling */
.card {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  padding: 16px;
}

/* Module 1: KPI grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, auto);
  gap: 12px;
}
.kpi-card {
  background: #222;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 12px;
  text-align: center;
}
.kpi-value {
  font-size: 24px;
  color: #FFA500;
  font-weight: bold;
}
.kpi-label {
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
}

/* Module 2: table */
.table-card h2 {
  margin-bottom: 8px;
  color: #FFA500;
}
.table-wrapper {
  flex: 1;
  overflow-y: auto;
}
.table-wrapper table {
  width: 100%;
  border-collapse: collapse;
}
.table-wrapper th,
.table-wrapper td {
  padding: 6px 8px;
  text-align: right;
  font-size: 12px;
  border-bottom: 1px solid #333;
}
.table-wrapper th:first-child,
.table-wrapper td:first-child {
  text-align: left;
}
.table-wrapper tr:nth-child(even) {
  background: #1a1a1a;
}
.table-wrapper tr:hover {
  background: #2a2a2a;
}
