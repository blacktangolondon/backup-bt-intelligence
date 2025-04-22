// tvResolver.js
export async function resolveTVSymbol(query) {
  const params = new URLSearchParams({ text: query, hl: '1' });
  const resp   = await fetch(
    `https://symbol-search.tradingview.com/symbol_search/?${params}`
  );
  const list   = await resp.json();
  // fall back to raw query if nothing matched
  return list.length && list[0].symbol ? list[0].symbol : query;
}
