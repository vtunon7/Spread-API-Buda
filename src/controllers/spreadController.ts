import { Request, Response } from "express";
import { calculateSpread } from "../services/marketService";
import { fetchMarketOrderBooksCached } from "../utils/cache";
import { calculateSpreads } from "../services/marketService";
import { sendErrorResponse } from "../utils/responseUtils";

// Function for endpoint to get spread for specific market
export async function getSpread(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const orderBook = await fetchMarketOrderBooksCached(id);
    if (orderBook) {
      const spread = calculateSpread(orderBook);
      res.status(200).json({ market: { [id]: { spread } } });
    } else {
      sendErrorResponse(res, 500, "Error fetching order book");
    }
  } catch (error) {
    sendErrorResponse(res, 500, "Error fetching order book");
  }
}

// Function for endpoint to get spreads for all markets
export async function getSpreads(req: Request, res: Response) {
  try {
    const spreads = await calculateSpreads();
    if (spreads) {
      res.status(200).json({ market: spreads });
    } else {
      sendErrorResponse(res, 500, "Error fetching spreads");
    }
  } catch (error) {
    sendErrorResponse(res, 500, "Error fetching spreads");
  }
}
