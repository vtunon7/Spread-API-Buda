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

function getAlertMessage(spread: number, alertSpread: number | undefined) {
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
        ? `Curretn spread EQUALS alert spread (${spread} = ${alertSpread})`
        : spread > alertSpread
        ? `Current spread BIGGER than alert spread (${spread} > ${alertSpread})`
        : `Current spread LOWER than alert spread (${spread} < ${alertSpread})`,
  };
}

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

// Define el intervalo de tiempo en milisegundos (por ejemplo, cada 10 segundos)
export const pollingInterval = 10000;

// Función para realizar la consulta de alertas
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
    // Aquí podrías realizar acciones basadas en el estado de las alertas, como enviar notificaciones, etc.
  } catch (error) {
    console.error("Error polling alerts:", error);
  }
}
