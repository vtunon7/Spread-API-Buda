import axios from "axios";
import { calculateSpread } from "../utils/calculateSpread";
import {
  fetchMarketOrderBooksCached,
  getCachedMarketIds,
} from "../utils/cache";
import { budaURL } from "../config";

export async function fetchMarketIds(): Promise<string[] | undefined> {
  try {
    const response = await axios.get(`${budaURL}/markets`);
    const markets = response.data.markets;
    if (markets) {
      const ids = markets.map((market: any) => market.id);
      return ids;
    }
  } catch (error) {
    console.error("Error fetching market ids:", error);
  }
}

// async function fetchMarketOrderBooks(
//   marketId: string
// ): Promise<Record<string, string[]> | undefined> {
//   try {
//     const response = await axios.get(
//       `${budaURL}/markets/${marketId}/order_book`
//     );
//     const orderBook = response.data.order_book;
//     return orderBook;
//   } catch (error) {
//     console.error("Error fetching order book:", error);
//   }
// }

export async function calculateSpreads(): Promise<{
  [market: string]: number;
}> {
  const marketIds = (await getCachedMarketIds()) as string[];
  const orderBookPromises = marketIds.map((marketId: string) =>
    fetchMarketOrderBooksCached(marketId)
  );

  // Fetch market order books in parallel
  const orderBooks = await Promise.all(orderBookPromises);

  const spreads: { [market: string]: number } = {};
  for (let i = 0; i < marketIds.length; i++) {
    const marketId = marketIds[i];
    const orderBook = orderBooks[i] as Record<string, string[]>;
    let spread: number;
    if (orderBook.asks.length === 0 || orderBook.bids.length === 0) {
      spread = 0;
    } else {
      spread = calculateSpread(orderBook);
    }
    spreads[marketId] = spread;
  }
  return spreads;
}
