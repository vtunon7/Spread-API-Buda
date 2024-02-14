import { Request, Response } from "express";
import { calculateSpread } from "../utils/calculateSpread";
import { fetchMarketOrderBooksCached } from "../utils/cache";
import { calculateSpreads } from "../services/market";

export async function getSpread(req: Request, res: Response) {
  const { id } = req.params;
  const orderBook = await fetchMarketOrderBooksCached(id);
  if (orderBook) {
    const spread = calculateSpread(orderBook);
    res.status(200).json({ spread: { [id]: spread } });
  } else {
    res.status(500).json({ message: "Error fetching order book" });
  }
}

export async function getSpreads(req: Request, res: Response) {
  const spreads = await calculateSpreads();
  if (spreads) {
    res.status(200).json({ spreads });
  } else {
    res.status(500).json({ message: "Error fetching spreads" });
  }
}
