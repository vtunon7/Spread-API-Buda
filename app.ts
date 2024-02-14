import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { setInterval } from "timers";
import axios from "axios";

const app = express();
const port = 3000;
const budaURL = "https://www.buda.com/api/v2";

async function fetchMarketIds(): Promise<string[] | undefined> {
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

// Function to calculate spreads
function calculateSpread(orderBook: Record<string, string[]>): number {
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

let orderBookCache: {
  [marketId: string]: {
    orderBook: Record<string, string[]>;
    timestamp: number;
  };
} = {};

const CACHE_TTL = 10000; // 10 seconds

// Función para recuperar el libro de órdenes de un mercado desde el caché o la API
async function fetchMarketOrderBooksCached(
  marketId: string
): Promise<Record<string, string[]> | undefined> {
  const cachedOrderBook = orderBookCache[marketId];
  // Verificar si el libro de órdenes está en caché y si no ha expirado
  if (cachedOrderBook && Date.now() - cachedOrderBook.timestamp < CACHE_TTL) {
    console.log("Order book retrieved from cache");
    return cachedOrderBook.orderBook;
  } else {
    try {
      const response = await axios.get(
        `${budaURL}/markets/${marketId}/order_book`
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

// Function to calculate spreads of all markets
async function calculateSpreads(): Promise<{ [market: string]: number }> {
  const marketIds = (await fetchMarketIds()) as string[];
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

// Alert spread
let alertSpreads: { [market: string]: number } = {};

let cachedMarketIds: string[];

async function getCachedMarketIds() {
  if (!cachedMarketIds) {
    cachedMarketIds = (await fetchMarketIds()) as string[];
  }
  return cachedMarketIds;
}

// Middleware para validar el ID del mercado
function validateMarketId(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  if (!id || !/^[A-Z]+-[A-Z]+$/.test(id)) {
    return res.status(400).json({
      error:
        "Invalid market ID, ID must be uppercase and inlcude both market names separated by a dash (Ex: BTC-CLP)",
    });
  }
  next();
}

// Middleware para validar el cuerpo de la solicitud para guardar alerta
function validateSaveAlert(req: Request, res: Response, next: NextFunction) {
  const { alertSpread } = req.body;
  if (!alertSpread || typeof alertSpread !== "object") {
    return res.status(400).json({
      error:
        "Invalid alert spread data, should be an object (Ex: { alertSpread: { BTC-CLP: 1000, ... }})",
    });
  }
  next();
}

// Endpoint to get spread of specific market
app.get(
  "/spreads/:id",
  validateMarketId,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const marketIds = await getCachedMarketIds();
    if (marketIds.includes(id)) {
      const orderBook = await fetchMarketOrderBooksCached(id);
      if (orderBook) {
        const spread = calculateSpread(orderBook);
        res.status(200).json({ spread });
      } else {
        res.status(500).json({ message: "Error fetching order book" });
      }
    } else {
      res.status(404).json({ message: "Market not found" });
    }
  }
);

// Endpoint to get spreads of all markets
app.get("/spreads", async (req: Request, res: Response) => {
  const spreads = await calculateSpreads();
  if (spreads) {
    res.status(200).json({ spreads });
  } else {
    res.status(500).json({ message: "Error fetching spreads" });
  }
});

// Endpoint to save alert spread
app.post(
  "/save-alert",
  bodyParser.json(),
  validateSaveAlert,
  (req: Request, res: Response) => {
    const { alertSpread } = req.body;
    if (alertSpread) {
      alertSpreads = { ...alertSpreads, ...alertSpread };
      res
        .status(201)
        .json({ message: "Alert spread saved successfully", alertSpreads });
    } else {
      res
        .status(400)
        .json({ message: "Invalid request body: alertSpread is required" });
    }
  }
);

// Endpoint for checking if current spread exceeds alert spread
app.get("/check-alert", async (req: Request, res: Response) => {
  try {
    const spreads = await calculateSpreads();
    const alertStatus: { [market: string]: string } = {};
    for (const market in spreads) {
      alertStatus[market] =
        spreads[market] > alertSpreads[market]
          ? "spread actual MAYOR a spread alerta"
          : "spread actual MENOR a spread alerta";
    }
    res.status(200).json(alertStatus);
  } catch (error) {
    res.status(500).json({ message: "Error checking alert status" });
  }
});

// Polling function to generate market data and check alert status every 10 seconds
// setInterval(() => {
//   generateMarketData();
//   console.log("Market data updated:", marketData);
//   const alertStatus = calculateSpreads();
//   console.log("Alert status:", alertStatus);
// }, 10000);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
