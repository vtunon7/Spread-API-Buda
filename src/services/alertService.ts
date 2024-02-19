import { Request, Response } from "express";
import { calculateSpreads, getMarketSpread } from "../services/marketService";

export let alertSpreads: { [market: string]: number } = {};

// Function to check alerts for all markets
export async function checkAlerts(): Promise<
  | {
      [market: string]: {
        spread: number;
        alertSpread: number | undefined;
        message: string;
      };
    }
  | undefined
> {
  try {
    const spreads = await calculateSpreads();
    if (!spreads) {
      throw new Error("Error calculating spreads");
    }
    const alertStatus: {
      [market: string]: {
        spread: number;
        alertSpread: number | undefined;
        message: string;
      };
    } = {};
    for (const market in spreads) {
      alertStatus[market] = getAlertMessage(
        spreads[market].spread,
        alertSpreads[market]
      );
    }
    return alertStatus;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("Error checking alert status: " + error.message);
    } else {
      throw new Error("Error checking alert status");
    }
  }
}

// Function to check alert for specific market
export async function checkAlert(id: string) {
  try {
    const spread = await getMarketSpread(id);
    if (spread === undefined) {
      throw new Error("Error fetching or calculating spread");
    }
    const alertSpread = alertSpreads[id];
    if (alertSpread === undefined) {
      return { [id]: "No alert spread set for this market" };
    }
    const alertMessage = getAlertMessage(spread, alertSpread);
    if (alertMessage) {
      return { [id]: alertMessage };
    } else {
      throw new Error("Error checking alert status");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("Error checking alert status: " + error.message);
    } else {
      throw new Error("Error checking alert status");
    }
  }
}

// Function to get alert message for specific market
export function getAlertMessage(
  spread: number,
  alertSpread: number | undefined
) {
  if (alertSpread === undefined) {
    return {
      spread,
      alertSpread,
      message: "No alert spread set for this market",
    };
  }
  return {
    spread,
    alertSpread,
    message:
      spread === alertSpread
        ? `Current spread EQUALS alert spread (${spread} = ${alertSpread})`
        : spread > alertSpread
        ? `Current spread BIGGER than alert spread (${spread} > ${alertSpread})`
        : `Current spread LOWER than alert spread (${spread} < ${alertSpread})`,
  };
}

// Function to save alert spread for specific market
export async function saveAlert(req: Request, res: Response) {
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

// Constant for polling interval in miliseconds
export const pollingInterval = 10000;

// Function to poll alerts for all markets
export async function pollAlerts() {
  try {
    const response = (await checkAlerts()) as {
      [market: string]: {
        spread: number;
        alertSpread: number | undefined;
        message: string;
      };
    };
    const alertStatus = response;
    console.log("Spread Alert status:", alertStatus);
  } catch (error) {
    console.error("Error polling alerts:", error);
  }
}
