import { Request, Response } from "express";
import { alertSpreads } from "../services/alert";
import { calculateSpreads } from "../services/market";
import { calculateSpread } from "../utils/calculateSpread";
import { fetchMarketOrderBooksCached } from "../utils/cache";
import { spread } from "axios";

export async function checkAlerts(req: Request, res: Response) {
  try {
    const spreads = await calculateSpreads();
    if (!spreads) {
      return sendErrorResponse(res, 500, "Error calculating spreads");
    }
    const alertStatus: { [market: string]: string } = {};
    for (const market in spreads) {
      alertStatus[market] = getAlertMessage(
        spreads[market],
        alertSpreads[market]
      );
    }
    res.status(200).json(alertStatus);
  } catch (error) {
    res.status(500).json({ message: "Error checking alert status" });
  }
}

export async function checkAlert(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const orderBook = await fetchMarketOrderBooksCached(id);
    if (!orderBook) {
      return sendErrorResponse(res, 500, "Error fetching order book");
    }

    const spread = calculateSpread(orderBook as Record<string, string[]>);
    if (!spread) {
      return sendErrorResponse(res, 500, "Error calculating spread");
    }

    const alertSpread = alertSpreads[id];
    if (alertSpread === undefined) {
      return sendErrorResponse(res, 200, "No alert spread set for this market");
    }

    const alertMessage = getAlertMessage(spread, alertSpread);
    return res.status(200).json({ [id]: alertMessage });
  } catch (error) {
    return sendErrorResponse(res, 500, "Error checking alert status");
  }
}

function sendErrorResponse(res: Response, status: number, message: string) {
  return res.status(status).json({ message });
}

function getAlertMessage(spread: number, alertSpread: number | undefined) {
  if (alertSpread === undefined) {
    return "No alert spread set for this market";
  }
  return spread > alertSpread
    ? `Current spread (${spread}) BIGGER than alert spread (${alertSpread})`
    : `Current spread (${spread}) LOWER than alert spread (${alertSpread})`;
}
