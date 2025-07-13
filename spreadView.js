#!/usr/bin/env python3
"""
Reads daily CSVs of individual assets from `raw_data_spread/` and builds a JSON file
containing the spread ratios for predefined symbol pairs.

The output for each pair will be a list of the last 200 data points,
where each data point is an array: ["YYYY-MM-DD", ratio, lower_channel, upper_channel].
"""
import os
import json
import argparse
import pandas as pd
from scipy.stats import linregress

# Define the spread pairs you want to calculate (friendly names)
SPREAD_PAIRS = [
    ("FTSE100", "EU50"),
    ("FTSE100", "CAC40"),
    ("CAC40", "EU50"),
    ("DAX40", "EU50"),
    ("DOW30", "S&P500"),
    ("DOW30", "NASDAQ100"),
    ("DOW30", "RUSSELL2000"),
    ("NASDAQ100", "S&P500"),
    ("NASDAQ100", "RUSSELL2000"),
    ("S&P500", "RUSSELL2000"),
    ("GOLD", "SILVER"),
    ("GOLD", "PLATINUM"),
    ("PLATINUM", "SILVER"),
    ("WTI", "BRENT"),
    ("CORN", "WHEAT"),
    ("SOYBEANS", "CORN"),
    ("BITCOIN", "ETHEREUM")
]

def load_closes(input_dir: str) -> pd.DataFrame:
    """
    Reads all {NAME}.csv files in input_dir, each with Date as first column and Close/Price.
    Returns a DataFrame with Date as index and one column per NAME.
    """
    dfs = []
    # Update this to match your CSV date format:
    DATE_FORMAT = '%Y-%m-%d'

    for filename in os.listdir(input_dir):
        if not filename.lower().endswith('.csv'):
            continue
        name = os.path.splitext(filename)[0]
        path = os.path.join(input_dir, filename)

        try:
            df = pd.read_csv(
                path,
                header=0,
                index_col=0,
                dtype={0: str},
                on_bad_lines='warn'
            )
            df.index = pd.to_datetime(df.index, format=DATE_FORMAT, errors='coerce')
            df = df[df.index.notna()]
            if df.empty:
                print(f"Warning: '{filename}' has no valid dates after parsing. Skipping.")
                continue
        except Exception as e:
            print(f"Error reading {filename}: {e}. Skipping.")
            continue

        # Pick the price column
        if 'Close' in df.columns:
            col = 'Close'
        elif 'Price' in df.columns:
            col = 'Price'
        elif len(df.columns) == 1:
            col = df.columns[0]
            print(f"Info: Using sole column '{col}' from {filename} as price.")
        else:
            print(f"Warning: {filename} has multiple data columns and no 'Close'/'Price'. Skipping.")
            continue

        df = df[[col]].rename(columns={col: name})
        df[name] = pd.to_numeric(df[name], errors='coerce')
        df = df[df[name].notna()]
        dfs.append(df)

    if not dfs:
        raise ValueError(f"No valid CSV data found in {input_dir}")

    all_df = pd.concat(dfs, axis=1, join='inner').sort_index()
    all_df.index = pd.to_datetime(all_df.index)
    return all_df

def build_spreads(df: pd.DataFrame, pairs) -> dict:
    """
    Given a DataFrame of closes and a list of (A,B) pairs,
    returns a dict mapping "A/B" -> list of the last 200 entries:
    [ "YYYY-MM-DD", ratio, lower, upper ].
    """
    output = {}
    for a, b in pairs:
        if a not in df.columns or b not in df.columns:
            print(f"Warning: {a}/{b} data missing, skipping.")
            continue

        # Prepare time as ordinal for regression
        x = pd.Series(df.index.map(pd.Timestamp.toordinal).astype(float), index=df.index)
        prices_a = df[a]
        prices_b = df[b]
        ratio = prices_a / prices_b

        valid = ratio.dropna().index
        if len(valid) < 2 or ratio.loc[valid].std() == 0:
            print(f"Warning: Insufficient or constant ratio for {a}/{b}, skipping.")
            continue

        x_valid = x.loc[valid]
        y_valid = ratio.loc[valid].values
        try:
            slope, intercept, *_ = linregress(x_valid, y_valid)
        except Exception as e:
            print(f"Error in linregress for {a}/{b}: {e}, skipping.")
            continue

        trend = intercept + slope * x
        std = ratio.std()
        corr = prices_a.corr(prices_b)
        if pd.isna(corr) or corr == 0:
            print(f"Warning: Correlation zero/NaN for {a}/{b}, skipping.")
            continue
        offset = std * (1.0 / corr)
        lower = trend - offset
        upper = trend + offset

        combined = pd.DataFrame({
            'ratio': ratio,
            'lower': lower,
            'upper': upper
        }).dropna().replace([float('inf'), -float('inf')], pd.NA).dropna()

        tail = combined.tail(200)
        series_data = []
        for date, row in tail.iterrows():
            series_data.append([
                date.strftime('%Y-%m-%d'),
                round(row['ratio'], 6),
                round(row['lower'], 6),
                round(row['upper'], 6)
            ])

        if series_data:
            output[f"{a}/{b}"] = series_data
        else:
            print(f"Warning: No clean data for {a}/{b} after processing.")

    return output

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Build spreads.json with date stamps.')
    parser.add_argument('-i', '--input-dir', default='raw_data_spread',
                        help='Directory of daily CSVs')
    parser.add_argument('-o', '--output-file', default='spreads.json',
                        help='Output JSON file')
    args = parser.parse_args()

    df_closes = load_closes(args.input_dir)
    if df_closes.empty:
        print("Error: No valid data loaded.")
    else:
        spreads = build_spreads(df_closes, SPREAD_PAIRS)
        if not spreads:
            print("Warning: No spread pairs generated.")
        with open(args.output_file, 'w') as f:
            json.dump(spreads, f, indent=2)
        print(f"✅ Wrote {args.output_file}")
