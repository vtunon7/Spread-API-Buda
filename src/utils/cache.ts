import axios from "axios";
import { fetchMarketIds } from "../services/marketService";

let cachedMarketIds: string[];

export async function getCachedMarketIds() {
  if (!cachedMarketIds) {
    cachedMarketIds = (await fetchMarketIds()) as string[];
  }
  return cachedMarketIds;
}

let orderBookCache: {
  [marketId: string]: {
    orderBook: Record<string, string[]>;
    timestamp: number;
  };
} = {};

export const CACHE_TTL = 10000; // 10 seconds

// Función para recuperar el libro de órdenes de un mercado desde el caché o la API
export async function fetchMarketOrderBooksCached(
  marketId: string
): Promise<Record<string, string[]> | undefined> {
  const cachedOrderBook = orderBookCache[marketId];
  // Verificar si el libro de órdenes está en caché y si no ha expirado
  if (cachedOrderBook && Date.now() - cachedOrderBook.timestamp < CACHE_TTL) {
    return cachedOrderBook.orderBook;
  } else {
    try {
      const response = await axios.get(
        `${process.env.BUDA_URL}/markets/${marketId}/order_book`
      );
      const orderBook = response.data.order_book;
      // Actualizar el caché con el nuevo libro de órdenes y la marca de tiempo actual
      orderBookCache[marketId] = { orderBook, timestamp: Date.now() };
      return orderBook;
    } catch (error) {
      console.error(`Error fetching order book for market ${marketId}:`, error);
      return undefined;
    }
  }
}
