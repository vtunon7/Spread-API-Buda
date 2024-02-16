import axios from "axios";
import {
  fetchMarketOrderBooksCached,
  getCachedMarketIds,
} from "../utils/cache";

// Function to fetch market IDs from Buda API
export async function fetchMarketIds(): Promise<string[] | undefined> {
  try {
    const response = await axios.get(`${process.env.BUDA_URL}/markets`);
    const markets = response.data.markets;
    if (markets) {
      const ids = markets.map((market: any) => market.id);
      return ids;
    }
  } catch (error) {
    console.error("Error fetching market ids:", error);
  }
}

// Function to calculate spread from order book
export function calculateSpread(orderBook: Record<string, string[]>): number {
  const asks = orderBook.asks;
  const bids = orderBook.bids;
  const asksPrices = asks.map((ask: any) => parseFloat(ask[0]));
  const bidsPrices = bids.map((bid: any) => parseFloat(bid[0]));
  const minAskPrice = asksPrices.reduce(
    (min, price) => (price < min ? price : min),
    asksPrices[0]
  );
  const maxBidPrice = bidsPrices.reduce(
    (max, price) => (price > max ? price : max),
    bidsPrices[0]
  );
  const spread = minAskPrice - maxBidPrice;
  return spread;
}

// Function to calculate spreads for all markets
export async function calculateSpreads(): Promise<{
  [market: string]: { spread: number };
}> {
  const marketIds = (await getCachedMarketIds()) as string[];
  const orderBookPromises = marketIds.map((marketId: string) =>
    fetchMarketOrderBooksCached(marketId)
  );

  // Fetch market order books in parallel
  const orderBooks = await Promise.all(orderBookPromises);
  const spreads: { [market: string]: { spread: number } } = {};

  marketIds.forEach((marketId, i) => {
    const orderBook = orderBooks[i] as Record<string, string[]>;
    let spread: number;
    if (orderBook.asks.length === 0 || orderBook.bids.length === 0) {
      spread = 0;
    } else {
      spread = calculateSpread(orderBook);
    }
    spreads[marketId] = { spread };
  });
  return spreads;
}

// Function to get market spread
export async function getMarketSpread(id: string): Promise<number | undefined> {
  try {
    const orderBook = await fetchMarketOrderBooksCached(id);
    if (orderBook) {
      return calculateSpread(orderBook);
    } else {
      console.error("Error fetching order book");
    }
  } catch (error) {
    console.error("Error fetching market spread:", error);
  }
}
