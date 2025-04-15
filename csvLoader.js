/**
 * csvLoader.js
 * Loads CSV data from Google Sheets using fetch and PapaParse.
 */
export async function loadCSVData() {
  const etfFullData = {};
  const etfPrices = {};
  const futuresFullData = {};
  const futuresPrices = {};
  const fxFullData = {};
  const fxPrices = {};
  const stocksFullData = {};
  const stockPrices = {};

  let futuresCorrelationDataLoaded = false;
  let fxCorrelationDataLoaded = false;
  let stocksCorrelationDataLoaded = false;

  // Load ETF CSV data
  const etfFullDataCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRDNzpc6NaFGIb2r86Y4gc77XjqF9JBu6uVR6FILtNQsm756JkGpDS8Jt0ESb2q3i_XAqgf38huFWPl/pub?gid=1661223660&single=true&output=csv";
  await fetch(etfFullDataCSVUrl)
    .then(resp => resp.text())
    .then(csvText => {
      const lines = csvText.trim().split('\n').map(r => r.split(','));
      const totalCols = lines[0].length;
      for (let col = 0; col < totalCols; col++) {
        const etfName = lines[0][col].trim();
        if (!etfName) continue;
        let prices = [];
        for (let r = 1; r <= 100; r++){
          const val = parseFloat(lines[r][col]);
          if (!isNaN(val)) prices.push(val);
        }
        const summaryLeft = [];
        for (let r = 101; r <= 108; r++){
          const val = lines[r] && lines[r][col] ? lines[r][col].trim() : "";
          summaryLeft.push(val);
        }
        const summaryRight = [];
        for (let r = 109; r <= 116; r++){
          const val = lines[r] && lines[r][col] ? lines[r][col].trim() : "";
          summaryRight.push(val);
        }
        const tvSymbol = (lines[117] && lines[117][col]) ? lines[117][col].trim() : "";
        etfFullData[etfName] = { tvSymbol, summaryLeft, summaryRight };
        etfPrices[etfName] = prices;
      }
    })
    .catch(err => { console.error("Error loading ETF CSV:", err); });

  // Load FUTURES CSV data
  const futuresFullDataCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSB-5fS6uIw_KpcadopUGId0MaH55AS8SOaau4V0GGQ9TNI6nKibTOy_e9UmZWXj4L7aXbxVd7Awd3I/pub?gid=1387684053&single=true&output=csv";
  await fetch(futuresFullDataCSVUrl)
    .then(resp => resp.text())
    .then(csvText => {
      const parsed = Papa.parse(csvText, { skipEmptyLines: true });
      const lines = parsed.data;
      const totalCols = lines[0].length;
      for (let col = 0; col < totalCols; col++) {
        let futName = lines[0][col].trim();
        if (!futName) continue;
        if (futName.replace(/\s/g, "").toUpperCase() === "FTSE100") { futName = "FTSE 100"; }
        else if (futName.replace(/\s/g, "").toUpperCase() === "CAC40") { futName = "CAC 40"; }
        let prices = [];
        for (let r = 1; r <= 100; r++) {
          if (lines[r] && lines[r][col]) {
            const cellVal = lines[r][col].replace(/,/g, '.');
            const num = parseFloat(cellVal);
            if (!isNaN(num)) prices.push(num);
          }
        }
        let summaryLeft = [];
        for (let r = 101; r <= 107; r++){
          const val = lines[r] && lines[r][col] ? lines[r][col].trim() : "";
          summaryLeft.push(val);
        }
        let summaryRight = [];
        for (let r = 108; r <= 114; r++){
          const val = lines[r] && lines[r][col] ? lines[r][col].trim() : "";
          summaryRight.push(val);
        }
        const tvSymbol = (lines[115] && lines[115][col]) ? lines[115][col].trim() : "";
        futuresFullData[futName] = { tvSymbol, summaryLeft, summaryRight };
        futuresPrices[futName] = prices;
      }
      futuresCorrelationDataLoaded = true;
    })
    .catch(err => { console.error("Error loading FUTURES CSV:", err); });

  // Load FX CSV data
  const fxFullDataCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTEnbbjI0LycvT_Z0pdwpnhYGGzqZ8jIUiKiekX_2l2OrzIyTWpmy8cDd44PwY1pzehLDH08-9EKiu7/pub?gid=1689646190&single=true&output=csv";
  await fetch(fxFullDataCSVUrl)
    .then(resp => resp.text())
    .then(csvText => {
      const parsed = Papa.parse(csvText, { skipEmptyLines: true });
      const lines = parsed.data;
      const totalCols = lines[0].length;
      for (let col = 0; col < totalCols; col++) {
        const fxName = lines[0][col].trim();
        if (!fxName) continue;
        let prices = [];
        for (let r = 1; r <= 99; r++) {
          const num = parseFloat(lines[r] && lines[r][col]);
          if (!isNaN(num)) prices.push(num);
        }
        let summaryLeft = [];
        for (let r = 100; r <= 106; r++){
          const val = lines[r] && lines[r][col] ? lines[r][col].trim() : "";
          summaryLeft.push(val);
        }
        let summaryRight = [];
        for (let r = 107; r <= 113; r++){
          const val = lines[r] && lines[r][col] ? lines[r][col].trim() : "";
          summaryRight.push(val);
        }
        const tvSymbol = (lines[114] && lines[114][col]) ? lines[114][col].trim() : "";
        fxFullData[fxName] = { tvSymbol, summaryLeft, summaryRight };
        fxPrices[fxName] = prices;
      }
      fxCorrelationDataLoaded = true;
    })
    .catch(err => { console.error("Error loading FX CSV:", err); });

  // Load STOCKS CSV data
  const stocksFullDataCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSx30p9-V05ZEnvt4CYA1K4Xv1XmuR2Yi1rjH3yHEbaxtRPdMXfp8TNjSYYBXQQkIOu8WSaQVxmqodY/pub?gid=1481817692&single=true&output=csv";
  await fetch(stocksFullDataCSVUrl)
    .then(response => response.text())
    .then(csvText => {
      const lines = csvText.trim().split('\n').map(r => r.split(','));
      const totalCols = lines[0].length;
      for (let col = 0; col < totalCols; col++) {
        const instrumentName = lines[0][col].trim();
        if (!instrumentName) continue;
        let prices = [];
        for (let r = 1; r <= 100; r++) {
          const val = parseFloat(lines[r][col]);
          if (!isNaN(val)) prices.push(val);
        }
        let summaryLeft = [];
        for (let r = 101; r <= 109; r++) {
          const val = lines[r] && lines[r][col] ? lines[r][col].trim() : "";
          summaryLeft.push(val);
        }
        let summaryRight = [];
        for (let r = 110; r <= 118; r++) {
          const val = lines[r] && lines[r][col] ? lines[r][col].trim() : "";
          summaryRight.push(val);
        }
        const tvSymbol = (lines[119] && lines[119][col]) ? lines[119][col].trim() : "";
        const region = (lines[120] && lines[120][col]) ? lines[120][col].trim() : "Unknown";
        stocksFullData[instrumentName] = { tvSymbol, summaryLeft, summaryRight, region };
        stockPrices[instrumentName] = prices;
      }
      stocksCorrelationDataLoaded = true;
    })
    .catch(err => { console.error("Error loading STOCKS CSV:", err); });

  return {
    etfFullData,
    etfPrices,
    futuresFullData,
    futuresPrices,
    fxFullData,
    fxPrices,
    stocksFullData,
    stockPrices,
    correlationsLoaded: {
      futures: futuresCorrelationDataLoaded,
      fx: fxCorrelationDataLoaded,
      stocks: stocksCorrelationDataLoaded
    }
  };
}
