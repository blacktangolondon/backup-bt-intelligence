/**
 * dashboard.js
 * Handles dashboard updates (Blocks 1–4), the fullscreen toggle, YouTube popup,
 * and portfolio steps—all in plain ES5 so the browser won’t choke on modules.
 */

/* ------------------- Helpers & Constants ------------------- */

// Parse “Gap” strings into numbers
function parseGap(val) {
  return (val === "-" || isNaN(parseFloat(val))) ? 0 : parseFloat(val);
}

// Labels for Block 3 tables
var leftLabels         = ["SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MICRO","MATH","STATS","TECH"];
var rightLabels        = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA","ALPHA STRENGHT","PE RATIO","EPS","1 YEAR HIGH","1 YEAR LOW"];
var etfLeftLabels      = ["SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","MATH","STATS","TECH"];
var etfRightLabels     = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","BULLISH ALPHA","BEARISH ALPHA","ALPHA STRENGHT","1 YEAR HIGH","1 YEAR LOW","ISSUER - TICKER"];
var futuresLeftLabels  = ["SCORE","TREND","APPROACH","GAP TO PEAK","KEY AREA","LIMIT","POTENTIAL EXTENSION"];
var futuresRightLabels = ["S&P500 CORRELATION","S&P500 VOLATILITY RATIO","ALPHA STRENGHT","30 DAYS PROJECTION","MATH","STATS","TECH"];
var fxLeftLabels       = ["SCORE","TREND","GAP TO PEAK / TO VALLEY","APPROACH","KEY AREA","LIMIT","POTENTIAL EXTENSION"];
var fxRightLabels      = ["AVERAGE DAILY VOLATILITY","FX VOLATILITY RATIO","30 DAYS PROJECTION","LONG TERM - MACRO","MEDIUM TERM - MATH","MEDIUM TERM - STATS","SHORT TERM - TECH"];


/* ------------------- Block 1: Advanced Chart ------------------- */

function updateBlock1(instrumentName, groupData) {
  var info = groupData[instrumentName] || {};
  var symbol = info.tvSymbol || "NASDAQ:AMZN";
  var container = document.querySelector("#block1 .tradingview-widget-container");
  container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src  = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.textContent = JSON.stringify({
    autosize: true,
    symbol: symbol,
    interval: "D",
    timezone: "Etc/UTC",
    theme: "dark",
    style: "1",
    locale: "en",
    withdateranges: true,
    hide_side_toolbar: false,
    allow_symbol_change: false,
    backgroundColor: "#001122",
    details: true,
    calendar: false,
    support_host: "https://www.tradingview.com"
  });
  container.appendChild(script);
}


/* ------------------- Block 2: Symbol Overview ------------------- */

function updateBlock2(instrumentName, groupData) {
  var info   = groupData[instrumentName] || {};
  var symbol = info.tvSymbol || "NASDAQ:AMZN";
  var block2 = document.getElementById("block2");
  var container = block2.querySelector(".tradingview-widget-container");
      container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src  = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
  script.async = true;
  script.textContent = JSON.stringify({
    symbols: [[symbol + "|1D"]],
    chartOnly: false,
    width: "100%",
    height: "100%",
    locale: "en",
    colorTheme: "dark",
    autosize: true,
    showVolume: false,
    showMA: false,
    hideDateRanges: false,
    hideMarketStatus: false,
    hideSymbolLogo: false,
    scalePosition: "right",
    scaleMode: "Normal",
    fontFamily: "-apple-system, BlinkMacSystemFont, Roboto, Ubuntu, sans-serif",
    fontSize: "10",
    noTimeScale: false,
    valuesTracking: "1",
    changeMode: "price-and-percent",
    chartType: "area",
    maLineColor: "#2962FF",
    maLineWidth: 1,
    maLength: 9,
    headerFontSize: "medium",
    backgroundColor: "rgba(19, 23, 34, 0)",
    widgetFontColor: "rgba(255, 152, 0, 1)",
    lineWidth: 2,
    lineType: 0,
    dateRanges: ["1d|1","1m|30","3m|60","12m|1D","60m|1W","all|1M"]
  });
  container.appendChild(script);
}


/* ------------------- Block 3: Trend Score & TA ------------------- */

function showBlock3Tab(tab) {
  var tabs = document.querySelectorAll("#block3-tabs button");
  var tsv  = document.getElementById("block3-trendscore");
  var tvw  = document.getElementById("block3-tradingview");
  tabs.forEach(function(b){ b.classList.remove("active-tab"); });
  tsv.style.display = "none";
  tvw.style.display = "none";
  if (tab==="trendscore") {
    document.querySelector('#block3-tabs button[data-tab="trendscore"]').classList.add("active-tab");
    tsv.style.display = "block";
  } else {
    document.querySelector('#block3-tabs button[data-tab="tradingview"]').classList.add("active-tab");
    tvw.style.display = "block";
  }
}

function updateBlock3(instrumentName, groupData, opts) {
  opts = opts||{};
  var rows, leftArr, rightArr;
  if (opts.isETF) {
    rows = 8; leftArr = etfLeftLabels; rightArr = etfRightLabels;
  } else if (opts.isFutures) {
    rows = 7; leftArr = futuresLeftLabels; rightArr = futuresRightLabels;
  } else if (opts.isFX) {
    rows = 7; leftArr = fxLeftLabels; rightArr = fxRightLabels;
  } else {
    rows = 9; leftArr = leftLabels; rightArr = rightLabels;
  }

  var trendscoreDiv = document.getElementById("block3-trendscore");
  trendscoreDiv.innerHTML = '<div class="loading-message"><span>CALCULATING...</span></div>';
  setTimeout(function(){
    var info = groupData[instrumentName] || null;
    trendscoreDiv.innerHTML = "";
    if (!info) {
      trendscoreDiv.textContent = "No data for " + instrumentName;
      showBlock3Tab("trendscore");
      return;
    }
    var table = document.createElement("table");
    for (var i=0; i<rows; i++){
      var tr = document.createElement("tr");
      [ leftArr[i]||"", info.summaryLeft[i]||"", rightArr[i]||"", info.summaryRight[i]||"" ]
        .forEach(function(txt){
          var td = document.createElement("td");
          td.textContent = (i===3 && txt==="0") ? "0%" : txt;
          tr.appendChild(td);
        });
      table.appendChild(tr);
    }
    trendscoreDiv.appendChild(table);

    // TradingView view
    var tradingDiv = document.getElementById("block3-tradingview");
    tradingDiv.innerHTML = '<div class="tradingview-widget-container"><div class="tradingview-widget-container__widget"></div></div>';
    var tvScript = document.createElement("script");
    tvScript.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    tvScript.async = true;
    tvScript.textContent = JSON.stringify({
      interval: "1D",
      width: "100%",
      isTransparent: true,
      height: "100%",
      symbol: (info.tvSymbol||"NASDAQ:AMZN"),
      showIntervalTabs: true,
      displayMode: "single",
      locale: "en",
      colorTheme: "dark"
    });
    tradingDiv.querySelector(".tradingview-widget-container").appendChild(tvScript);

    // Tabs
    if (opts.isFutures) {
      document.getElementById("block3-tabs").style.display = "none";
      trendscoreDiv.style.height = "100%";
      showBlock3Tab("trendscore");
    } else {
      document.getElementById("block3-tabs").style.display = "flex";
      showBlock3Tab("trendscore");
    }
  }, 300);
}

document.querySelectorAll("#block3-tabs button").forEach(function(btn){
  btn.addEventListener("click", function(){
    showBlock3Tab(this.getAttribute("data-tab"));
  });
});


/* ------------------- Block 4: Correlation ------------------- */

function pearson(x,y){
  var n=x.length;
  if(!n||y.length!==n) return 0;
  function mean(a){return a.reduce(function(s,v){return s+v},0)/a.length;}
  var mX=mean(x), mY=mean(y),
      num=0, dx2=0, dy2=0;
  for(var i=0;i<n;i++){
    var dx=x[i]-mX, dy=y[i]-mY;
    num+=dx*dy; dx2+=dx*dx; dy2+=dy*dy;
  }
  return num/Math.sqrt(dx2*dy2);
}

function drawCorrelationChart(list){
  var ctx = document.getElementById("correlationChart").getContext("2d");
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: list.map(function(i){return i[0];}),
      datasets:[{
        label:'CORRELATION',
        data: list.map(function(i){return i[1];}),
        backgroundColor:'rgba(255,165,0,0.7)',
        borderColor:'rgba(255,165,0,1)',
        borderWidth:1
      }]
    },
    options:{
      indexAxis:'y', responsive:true, maintainAspectRatio:false,
      scales:{
        x:{ticks:{color:'white'},grid:{color:'rgba(255,255,255,0.2)'}},
        y:{ticks:{color:'white'},grid:{color:'rgba(255,255,255,0.2)'}}
      },
      plugins:{
        legend:{display:false},
        title:{
          display:true,
          text:'10 MOST CORRELATED INSTRUMENTS',
          color:'white',font:{size:14}
        }
      }
    }
  });
}

function updateBlock4(instrumentName, pricesData) {
  var block4 = document.getElementById("block4");
  block4.innerHTML = '<div class="loading-message"><span>CALCULATING...</span></div>';
  setTimeout(function(){
    var ref = pricesData[instrumentName]||[];
    var list = [];
    for(var k in pricesData){
      if(k===instrumentName) continue;
      list.push([k, pearson(ref, pricesData[k])]);
    }
    list.sort(function(a,b){return b[1]-a[1];});
    list = list.slice(0,10);
    if(!list.length){
      block4.innerHTML = '<p style="color:white;">No data for '+instrumentName+'</p>';
      return;
    }
    block4.innerHTML = '<canvas id="correlationChart"></canvas>';
    drawCorrelationChart(list);
  },300);
}


/* ------------------- Fullscreen & YouTube ------------------- */

function updateFullscreenButton() {
  var btn = document.getElementById("fullscreen-button");
  if (!btn) return;
  btn.textContent = document.fullscreenElement ? '⇱⇲\n⇳⇵' : '⇱⇲\n⇳⇵';
}

document.getElementById("fullscreen-button")
  .addEventListener("click", function(){
    if(!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setTimeout(updateFullscreenButton,100);
  });

function openYouTubePopup(){
  var p = document.getElementById("youtube-popup");
  p.style.display = "block";
  if(window.jQuery&&jQuery.fn.draggable) {
    jQuery("#youtube-popup").draggable({handle:"#youtube-popup-header"});
  }
}
function updateYouTubePlayer(){
  var url = document.getElementById("youtube-url").value.trim();
  document.getElementById("youtube-iframe").src = url;
}
document.getElementById("collapse-btn")
  .addEventListener("click", openYouTubePopup);
document.getElementById("youtube-popup-close")
  .addEventListener("click", function(){
    document.getElementById("youtube-popup").style.display = "none";
  });


/* ------------------- Portfolio Builder ------------------- */

window.portfolioFilters = [];

function openFilterSelector(){
  var pf = window.portfolioFilters;
  var available = [];
  var first = pf.length ? pf[0].value : null;
  var all;
  if(first==="FUTURES") all=["Score","Gap to Peak","S&P500 Correlation","S&P500 Volatility Ratio","Alpha Strength"];
  else if(first==="FX") all=["Score","Gap to Peak","AVERAGE DAILY VOLATILITY","FX Volatility Ratio","30 DAYS PROJECTION","LONG TERM - MACRO","MEDIUM TERM - MATH","MEDIUM TERM - STATS","SHORT TERM - TECH"];
  else all=["Score","Gap to Peak","S&P500 Correlation","S&P500 Volatility Ratio","Bullish Alpha","Bearish Alpha","Alpha Strength"];
  available = (pf.length? all.filter(function(f){return pf.findIndex(function(x){return x.filterName===f;})<0;}) : ["Asset Class"]);
  var selDiv = document.createElement("div"); selDiv.className="filter-selector";
  var sel = document.createElement("select");
  available.forEach(function(f){
    var o=document.createElement("option"); o.value=f; o.textContent=f; sel.appendChild(o);
  });
  selDiv.appendChild(sel);
  var inputs = document.createElement("span"); selDiv.appendChild(inputs);

  function updateInputs(){
    inputs.innerHTML="";
    if(sel.value==="Asset Class"){
      var a = document.createElement("select");
      ["STOCKS","ETFS","FUTURES","FX"].forEach(function(x){
        var o=document.createElement("option");o.value=x;o.textContent=x;a.appendChild(o);
      });
      inputs.appendChild(a);
    } else {
      var oP=["≥","≤"].map(function(op){
        var o=document.createElement("option");o.value=op;o.textContent=op;return o;
      });
      var opSel=document.createElement("select");oP.forEach(function(o){opSel.appendChild(o);});
      var num=document.createElement("input");num.type="number";num.placeholder="Value";
      inputs.appendChild(opSel);inputs.appendChild(num);
    }
  }
  sel.addEventListener("change", updateInputs);
  updateInputs();

  var btn = document.createElement("button"); btn.textContent="Add Filter";
  btn.style.marginLeft="10px";
  btn.addEventListener("click", function(){
    var obj={filterName:sel.value};
    if(sel.value==="Asset Class"){
      obj.value=inputs.querySelector("select").value;
    } else {
      obj.operator=inputs.querySelector("select").value;
      obj.value=inputs.querySelector("input").value;
    }
    pf.push(obj);
    updatePortfolioSteps();
    selDiv.parentNode.removeChild(selDiv);
  });
  selDiv.appendChild(btn);
  document.getElementById("portfolio_builder1").appendChild(selDiv);
}

function updatePortfolioSteps(){
  var pf = window.portfolioFilters;
  var container = document.getElementById("portfolio-builder-steps");
  container.innerHTML="";
  pf.forEach(function(step,i){
    var div=document.createElement("div");div.className="filter-step";
    var txt=step.filterName + (step.filterName==="Asset Class" ? ": "+step.value : " "+step.operator+" "+step.value);
    var span=document.createElement("span");span.textContent=txt;div.appendChild(span);
    var rem=document.createElement("button");rem.className="remove-filter-btn";rem.textContent="✕";
    rem.addEventListener("click",function(){pf.splice(i,1);updatePortfolioSteps();});
    div.appendChild(rem);
    container.appendChild(div);
  });
  var instr=document.createElement("p"); instr.id="portfolio-builder-instructions";
  instr.style.textAlign="center";instr.style.color="#cccccc";instr.innerHTML='<button id="add-filter-btn">+</button> Add another filter';
  container.appendChild(instr);
  document.getElementById("add-filter-btn").addEventListener("click",openFilterSelector);
}

function generatePortfolioNew(){
  var pf = window.portfolioFilters;
  if(!pf.length || pf[0].filterName!=="Asset Class"){
    return alert("Please add the Asset Class filter first.");
  }
  // ... your existing generatePortfolioNew() logic goes here ...
}

document.getElementById("add-filter-btn")
  .addEventListener("click", openFilterSelector);
document.getElementById("generate-portfolio-btn")
  .addEventListener("click", generatePortfolioNew);

