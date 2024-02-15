import { Request, Response } from "express";
import { calculateSpread } from "../utils/calculateSpread";
import { fetchMarketOrderBooksCached } from "../utils/cache";
import { calculateSpreads } from "../services/marketService";

export async function getSpread(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const orderBook = await fetchMarketOrderBooksCached(id);
    if (orderBook) {
      const spread = calculateSpread(orderBook);
      res.status(200).json({ spread: { [id]: spread } });
    } else {
      res.status(500).json({ message: "Error fetching order book" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching order book" });
  }
}

export async function getSpreads(req: Request, res: Response) {
  try {
    const spreads = await calculateSpreads();
    if (spreads) {
      res.status(200).json({ spreads });
    } else {
      res.status(500).json({ message: "Error fetching spreads" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching spreads" });
  }
}
