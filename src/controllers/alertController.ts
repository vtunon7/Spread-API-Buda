import { Request, Response } from "express";
import { alertSpreads } from "../services/alertService";
import { calculateSpreads, getMarketSpread } from "../services/marketService";

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
    sendErrorResponse(res, 500, "Error checking alert status");
  }
}

export async function checkAlert(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const spread = await getMarketSpread(id);
    if (spread === undefined) {
      return sendErrorResponse(
        res,
        500,
        "Error fetching or calculating spread"
      );
    }
    const alertSpread = alertSpreads[id];
    if (alertSpread === undefined) {
      return sendErrorResponse(res, 400, "No alert spread set for this market");
    }
    const alertMessage = getAlertMessage(spread, alertSpread);
    res.status(200).json({ [id]: alertMessage });
  } catch (error) {
    sendErrorResponse(res, 500, "Error checking alert status");
  }
}

function sendErrorResponse(res: Response, status: number, message: string) {
  res.status(status).json({ message });
}

function getAlertMessage(spread: number, alertSpread: number | undefined) {
  if (alertSpread === undefined) {
    return "No alert spread set for this market";
  }
  return spread > alertSpread
    ? `Current spread (${spread}) BIGGER than alert spread (${alertSpread})`
    : `Current spread (${spread}) LOWER than alert spread (${alertSpread})`;
}
