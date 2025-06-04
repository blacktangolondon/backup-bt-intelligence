#!/usr/bin/env python3

import os
import json
import pandas as pd
import numpy as np
import math
from scipy.stats import linregress
import yfinance as yf
import time
import random

# Load SPY (S&P 500 ETF) for correlation & volatility of non-futures
sp500_df = (
    pd.read_csv("raw_data/SPY.csv")[['Date', 'Close']]
    .assign(Date=lambda df: pd.to_datetime(df['Date']))
    .sort_values('Date')
    .reset_index(drop=True)
)
sp500_df['Return'] = sp500_df['Close'].pct_change()
sp500_volatility_5w = sp500_df['Close'].pct_change(periods=5).abs().dropna().mean()

# Map tickers.csv Exchange → desired output exchange field
EXCHANGE_MAP = {
    'NASDAQ': 'NASDAQ',
    'NYSE':    'NYSE',
    'MIL':     'FTSE MIB',
    'XETR':    'DAX40',
    'VIE':     'WIENER BOERSE',
    'TSX':     'CANADIAN SECURITIES EXCHANGE',
    'OMXCOP':  'NASDAQ COPENHAGEN',
    'OMXHEX':  'NASDAQ HELSINKI',
    'OMXSTO':  'NASDAQ STOCKHOLM',
    'Majors':  'MAJORS',
    'Minors':  'MINORS'
}

def sanitize_record(rec: dict) -> dict:
    """
    Replace any float('nan') values in a record with None, so JSON will emit 'null'.
    """
    for k, v in rec.items():
        if isinstance(v, float) and math.isnan(v):
            rec[k] = None
    return rec

def calculate_score_for_stock(file_path, ticker, asset_class, display_name, exchange):
    # Determine TradingView symbol
    if asset_class in ('equity', 'etf'):
        if exchange in ('NASDAQ', 'NYSE'):
            tv_symbol = f"{exchange}:{ticker}"
        else:
            root = ticker.split('.', 1)[0]
            tv_symbol = f"{exchange}:{root}"
    elif asset_class == 'fx':
        root = ticker.split('=')[0]
        tv_symbol = f"SAXO:{root}"
    elif asset_class in ('future', 'futures'):
        tv_symbol = exchange
    else:
        tv_symbol = ticker

    # Always map via EXCHANGE_MAP; do not override futures to literal "futures"
    out_exchange = EXCHANGE_MAP.get(exchange, exchange)

    try:
        df = (
            pd.read_csv(file_path)[['Date', 'Close']]
            .assign(Date=lambda d: pd.to_datetime(d['Date']))
            .sort_values('Date')
            .reset_index(drop=True)
        )
        if len(df) < 27:
            return None

        df['ma21_delta']  = df['Close'] - df['Close'].rolling(21).mean()
        df['ma100_delta'] = df['Close'] - df['Close'].rolling(100).mean()
        df['momentum_14'] = df['Close'].pct_change(14)
        latest = df.iloc[-1]

        # Futures & FX logic
        if asset_class in ('future', 'futures', 'fx'):
            if len(df) < 100:
                return None

            ma21_score     = 20 if latest['ma21_delta'] > 0 else -20
            ma100_score    = 20 if latest['ma100_delta'] > 0 else -20
            momentum_score = 20 if latest['momentum_14'] > 0 else -20

            x = np.arange(100)
            reg = linregress(x, df['Close'].iloc[-100:])
            slope_score        = 20 if reg.slope > 0 else -20
            proj_price         = reg.intercept + reg.slope * (99 + 30)
            future_proj_score  = 20 if proj_price > latest['Close'] else -20

            final_score = ma21_score + ma100_score + momentum_score + slope_score + future_proj_score

            if final_score == 100:
                trend       = 'LONG'
                approach    = 'BUY THE DIPS'
                gap_to_peak = round((df['Close'].max() - latest['Close']) / df['Close'].max() * 100, 2)
            elif final_score == -100:
                trend       = 'SHORT'
                approach    = 'SELL THE DIPS'
                gap_to_peak = round((latest['Close'] - df['Close'].min()) / df['Close'].min() * 100, 2)
            else:
                trend       = 'NEUTRAL'
                approach    = 'WAIT'
                gap_to_peak = 0

            # Volatility-based key_area bands
            if len(df) >= 20:
                recent20   = df['Close'].iloc[-20:]
                vol5       = df['Close'].pct_change(5).abs().dropna().mean()
                anchor_max = recent20.max()
                anchor_min = recent20.min()
                if final_score == 100:
                    kmax = anchor_max * (1 - vol5)
                    kmin = anchor_max * (1 - 2 * vol5)
                elif final_score == -100:
                    kmin = anchor_min * (1 + vol5)
                    kmax = anchor_min * (1 + 2 * vol5)
                else:
                    kmin = kmax = 0
                kmin = round(kmin, 2)
                kmax = round(kmax, 2)
                key_area = f"{kmin} / {kmax}"
                if final_score == 100:
                    limit     = round(kmin * 0.98, 2)
                    extension = round(kmax * 1.03, 2)
                elif final_score == -100:
                    limit     = round(kmax * 1.02, 2)
                    extension = round(kmin * 0.97, 2)
                else:
                    limit = extension = 0
            else:
                key_area = '0'
                limit = extension = 0

            # SP500 correlation & volatility ratio
            gspc = (
                pd.read_csv("raw_data/^GSPC.csv")[['Date','Close']]
                .assign(Date=lambda d: pd.to_datetime(d['Date']))
            )
            merged = pd.merge(df[['Date','Close']], gspc, on='Date', suffixes=('','_g'))
            sp500_corr      = round(merged[['Close','Close_g']].corr().iloc[0,1], 2) if len(merged)>10 else None
            vol_g           = gspc['Close'].pct_change(5).abs().dropna().mean()
            sp500_vol_ratio = round(df['Close'].pct_change(5).abs().dropna().mean() / vol_g, 2) if vol_g else None

            # Alpha & projection
            ret13            = df['Close'].pct_change().dropna().tail(13)
            pos              = ret13[ret13 > 0]
            neg              = ret13[ret13 < 0].abs()
            alpha_strength   = round(pos.mean() / neg.mean(), 2) if len(pos) and len(neg) else None
            projection_30    = round((proj_price - latest['Close']) / latest['Close'] * 100, 2)

            tech_str = (
                'SHORT TERM BULLISH' if ma21_score==ma100_score==momentum_score==20
                else 'SHORT TERM BEARISH' if ma21_score==ma100_score==momentum_score==-20
                else 'SHORT TERM NEUTRAL'
            )

            rec = {
                'tvSymbol':               tv_symbol,
                'ticker':                 display_name,
                'asset_class':            asset_class,
                'exchange':               out_exchange,
                'ma21_score':             ma21_score,
                'ma100_score':            ma100_score,
                'momentum_score':         momentum_score,
                'slope_score':            slope_score,
                'future_projection_score':future_proj_score,
                'final_score':            final_score,
                'trend':                  trend,
                'approach':               approach,
                'gap_to_peak':            gap_to_peak,
                'key_area':               key_area,
                'limit':                  limit,
                'extension':              extension,
                'sp500_correlation':      sp500_corr,
                'sp500_volatility_ratio': sp500_vol_ratio,
                'alpha_strength':         alpha_strength,
                'projection_30':          projection_30,
                'math':                   ('MEDIUM TERM BULLISH' if slope_score>0 else 'MEDIUM TERM BEARISH'),
                'stats':                  ('MEDIUM TERM UP' if future_proj_score>0 else 'MEDIUM TERM DOWN'),
                'tech':                   tech_str
            }
            if asset_class in ('future', 'futures'):
                rec['correlation_ticker'] = ticker
            return sanitize_record(rec)

        # Equities & ETFs
        ma21_score     = 25 if latest['ma21_delta'] > 0 else -25
        ma100_score    = 25 if latest['ma100_delta'] > 0 else -25
        momentum_score = 25 if latest['momentum_14'] > 0 else -25
        tech_score     = ma21_score if ma21_score==ma100_score==momentum_score else 0

        slope_score       = 25 if len(df)>=100 and linregress(np.arange(100), df['Close'].iloc[-100:]).slope>0 else -25
        future_proj_score = slope_score
        secondary_score   = tech_score + slope_score + future_proj_score

        # Initialize fundamental & growth variables to None
        pe_ratio = eps = price_to_book = dividend_yield = None
        roe = de_ratio = beta = rev_growth = price_to_sales = None
        payout_ratio = None

        if asset_class != 'etf':
            info = yf.Ticker(ticker).info

            # DEBUG: print whether priceToBook, dividendYield, etc. exist in `info`
            print(
                f"{ticker} → priceToBook:", info.get("priceToBook"),
                "; dividendYield:", info.get("dividendYield"),
                "; returnOnEquity:",   info.get("returnOnEquity"),
                "; debtToEquity:", info.get("debtToEquity"),
                "; beta:", info.get("beta"),
                "; revenueGrowth:", info.get("revenueGrowth"),
                "; priceToSales:", info.get("priceToSales")
            )

            # Existing fundamentals
            pe_ratio       = info.get('trailingPE')
            eps            = info.get('trailingEps')
            price_to_book  = info.get('priceToBook')
            dividend_yield = info.get('dividendYield')
            fundamental_score = 25 if pe_ratio and 0 < pe_ratio <= 50 else -25

            # New fields for additional strategies
            roe            = info.get('returnOnEquity')      # Return on Equity (e.g. 0.12 = 12%)
            de_ratio       = info.get('debtToEquity')        # Debt/Equity
            beta           = info.get('beta')                # Beta vs. SP500
            rev_growth     = info.get('revenueGrowth')       # 1-yr revenue growth (e.g. 0.05 = 5%)
            price_to_sales = info.get('priceToSales')        # Price-to-Sales ratio

            # Payout ratio (approx): dividend_yield (%) ÷ (eps if eps>0)
            if dividend_yield and eps:
                try:
                    payout_ratio = dividend_yield / eps
                except Exception:
                    payout_ratio = None

        else:
            fundamental_score = 0

        final_score = secondary_score + fundamental_score
        trend       = 'LONG' if final_score==100 else 'NEUTRAL'
        approach    = 'BUY THE DIPS' if final_score==100 else 'WAIT'

        one_year_high = round(df['Close'].iloc[-52:].max(), 2) if len(df)>=52 else None
        one_year_low  = round(df['Close'].iloc[-52:].min(), 2) if len(df)>=52 else None
        gap_to_peak   = round((df['Close'].max()-latest['Close']) / df['Close'].max()*100, 2)

        recent20 = df['Close'].iloc[-20:]
        vol5     = df['Close'].pct_change(5).abs().dropna().mean()
        anchor   = recent20.max()
        kmax     = anchor * (1 - vol5)
        kmin     = anchor * (1 - 2 * vol5)
        kmin     = round(kmin, 2)
        kmax     = round(kmax, 2)
        key_area = f"{kmin} / {kmax}"

        merged = pd.merge(df[['Date','Close']], sp500_df[['Date','Close','Return']], on='Date', suffixes=('','_sp'))
        corr        = round(merged[['Close','Close_sp']].corr().iloc[0,1], 2) if len(merged)>10 else None
        vol_ratio   = round(vol5 / sp500_volatility_5w, 2) if sp500_volatility_5w else None

        bullish_alpha = None
        bearish_alpha = None
        bullish       = merged.tail(13)
        up            = bullish[bullish['Return']>0]
        down          = bullish[bullish['Return']<0]
        if len(up) >= 3:
            bullish_alpha  = round(up['Close'].pct_change().mean() / up['Return'].mean(), 2)
        if len(down) >= 3:
            bearish_alpha = round(down['Close'].pct_change().mean() / down['Return'].mean(), 2)

        ret13          = df['Close'].pct_change().dropna().tail(13)
        pos            = ret13[ret13>0]
        neg            = ret13[ret13<0].abs()
        alpha_strength = round(pos.mean()/neg.mean(), 2) if len(pos) and len(neg) else None

        micro = 'LONG TERM BULLISH' if fundamental_score==25 else 'LONG TERM BEARISH' if fundamental_score==-25 else 'LONG TERM NEUTRAL'
        math  = 'MEDIUM TERM BULLISH' if slope_score>0 else 'MEDIUM TERM BEARISH'
        stats = 'MEDIUM TERM UP' if future_proj_score>0 else 'MEDIUM TERM DOWN'
        tech  = 'SHORT TERM BULLISH' if tech_score>0 else 'SHORT TERM BEARISH' if tech_score<0 else 'SHORT TERM NEUTRAL'

        result = {
            'tvSymbol':                tv_symbol,
            'ticker':                  display_name,
            'asset_class':             asset_class,
            'exchange':                out_exchange,
            'tech_score':              tech_score,
            'ma21_score':              ma21_score,
            'ma100_score':             ma100_score,
            'momentum_score':          momentum_score,
            'slope_score':             slope_score,
            'future_projection_score': future_proj_score,
            'secondary_score':         secondary_score,
            'fundamental_score':       fundamental_score,
            'final_score':             final_score,
            'trend':                   trend,
            'approach':                approach,
            'gap_to_peak':             gap_to_peak,
            'one_year_high':           one_year_high,
            'one_year_low':            one_year_low,
            'key_area':                key_area,
            'sp500_correlation':       corr,
            'sp500_volatility_ratio':  vol_ratio,
            'bullish_alpha':           bullish_alpha,
            'bearish_alpha':           bearish_alpha,
            'alpha_strength':          alpha_strength,
            'micro':                   micro,
            'math':                    math,
            'stats':                   stats,
            'tech':                    tech,
            # New fundamental & growth metrics
            'pe_ratio':        round(pe_ratio, 2)           if pe_ratio is not None     else None,
            'eps':             round(eps, 2)                if eps is not None          else None,
            'pb_ratio':        round(price_to_book, 2)      if price_to_book is not None else None,
            'div_yield':       round(dividend_yield, 4)     if dividend_yield is not None else None,
            'roe':             round(roe * 100, 2)          if roe is not None          else None,   # convert to % 
            'de_ratio':        round(de_ratio, 2)           if de_ratio is not None     else None,
            'beta':            round(beta, 2)               if beta is not None         else None,
            'rev_growth':      round(rev_growth * 100, 2)   if rev_growth is not None   else None,   # convert to % 
            'price_to_sales':  round(price_to_sales, 2)     if price_to_sales is not None else None,
            'payout_ratio':    round(payout_ratio, 2)       if payout_ratio is not None else None
        }

        return sanitize_record(result)

    except Exception as e:
        print(f"❌ Error processing {ticker}: {e}")
        return None

if __name__ == "__main__":
    data_folder = "raw_data"
    # Read the CSV, now including the 'Category' header
    tickers_df  = pd.read_csv("data/tickers.csv", dtype=str)

    instruments = []
    for _, row in tickers_df.iterrows():
        ticker      = row['Ticker']
        asset_class = row['Asset Class'].lower()
        exchange    = row['Exchange']
        # Safely read the Category column, which may be NaN
        raw_cat = row.get('Category', '')
        category = raw_cat.upper() if isinstance(raw_cat, str) else ''

        try:
            info = yf.Ticker(ticker).info
            display_name = info.get('shortName') or info.get('longName') or ticker
        except Exception:
            display_name = ticker

        file_path = os.path.join(data_folder, f"{ticker}.csv")
        if os.path.exists(file_path):
            res = calculate_score_for_stock(file_path, ticker, asset_class, display_name, exchange)
            if res:
                # Attach the category field
                res['category'] = category
                instruments.append(res)

        # pause 1–3 seconds between each request to avoid Yahoo rate limits
        time.sleep(random.uniform(1, 3))

    with open("instruments.json", "w", encoding="utf-8") as f:
        json.dump(instruments, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # validate JSON
    try:
        with open("instruments.json", "r", encoding="utf-8") as f:
            json.load(f)
    except json.JSONDecodeError as e:
        print("❌ instruments.json is invalid JSON:", e)
        raise

    print(f"✅ Generated instruments.json with {len(instruments)} entries successfully.")
