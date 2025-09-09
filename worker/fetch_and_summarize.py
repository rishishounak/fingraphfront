# fetch_and_summarize.py
import os
import yfinance as yf
import openai
import psycopg2
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()  # expects .env to have OPENAI_API_KEY and DATABASE_URL

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY missing")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL missing")

openai.api_key = OPENAI_API_KEY

# Fetch last 5 days of stock data
def fetch_stock(ticker):
    stock = yf.Ticker(ticker)
    hist = stock.history(period="5d")
    return hist

# Generate 3 actionable insights
def generate_insights(prices_df, ticker):
    summary_text = prices_df.to_string()
    prompt = f"""
    You are a stock analyst. Given the following recent price data for {ticker}:

    {summary_text}

    Provide 3 actionable insights in short sentences.
    """
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role":"user", "content": prompt}],
        temperature=0.7,
        max_tokens=150
    )
    insights_text = response.choices[0].message.content.strip()
    insights = [line.strip("-• ").strip() for line in insights_text.split("\n") if line.strip()]
    return insights

# Save prices + insights to Postgres
def save_to_db(ticker, prices_df, insights):
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cur = conn.cursor()

    # Insert each date as a separate record
    for idx, row in prices_df.iterrows():
        record_date = idx.date()
        prices_json = {
            "Open": row["Open"],
            "High": row["High"],
            "Low": row["Low"],
            "Close": row["Close"],
            "Volume": row["Volume"]
        }

        # Insert or update
        cur.execute("""
            INSERT INTO stock_records (ticker, record_date, prices, insights)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (ticker, record_date)
            DO UPDATE SET prices = EXCLUDED.prices, insights = EXCLUDED.insights
        """, (ticker, record_date, psycopg2.extras.Json(prices_json), psycopg2.extras.Json(insights)))

    conn.commit()
    cur.close()
    conn.close()

def main():
    ticker = input("Enter stock ticker (e.g., AAPL): ").upper()

    print(f"\nFetching data for {ticker}...")
    prices = fetch_stock(ticker)
    print("\n=== Stock Prices ===")
    print(prices)

    print("\nGenerating actionable insights...")
    insights = generate_insights(prices, ticker)
    print("\n=== Actionable Insights ===")
    for idx, insight in enumerate(insights, 1):
        print(f"{idx}. {insight}")

    print("\nSaving to PostgreSQL...")
    save_to_db(ticker, prices, insights)
    print("Done! Data saved to database.")

if __name__ == "__main__":
    main()
