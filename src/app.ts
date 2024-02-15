import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { setInterval } from "timers";
import { getSpread, getSpreads } from "./controllers/spreadController";
import { saveAlert } from "./services/alertService";
import { checkAlerts, checkAlert } from "./controllers/alertController";
import { validateMarketId, validateSaveAlert } from "./middleware/validation";
import { calculateSpreads } from "./services/marketService";

const app = express();
const port = 3000;

// Endpoint to get spread of specific market
app.get("/spreads/:id", validateMarketId, getSpread);

// Endpoint to get spreads of all markets
app.get("/spreads", getSpreads);

// Endpoint to save alert spread
app.post("/save-alert", bodyParser.json(), validateSaveAlert, saveAlert);

// Endpoint for checking if current spread exceeds alert spread for all markets
app.get("/check-alert", checkAlerts);

// Endpoint for checking if current spread exceeds alert spread for sprecific market
app.get("/check-alert/:id", checkAlert);

// Polling function to generate market data and check alert status every 10 seconds
// setInterval(() => {
//   generateMarketData();
//   console.log("Market data updated:", marketData);
//   const alertStatus = calculateSpreads();
//   console.log("Alert status:", alertStatus);
// }, 10000);

// const POLLING_INTERVAL = 60000; // 1 minuto

// async function pollSpread() {
//   const spreads = await calculateSpreads(); // Obtener los spreads actuales
//   // Comparar con el spread de alerta y tomar acciones si es necesario
//   for (const marketId in spreads) {
//     const currentSpread = spreads[marketId];
//     const alertSpread = await checkAlert(marketId); // Obtener el spread de alerta
//     if (currentSpread > alertSpread) {
//       console.log(`Spread de alerta excedido para ${marketId}!`);
//       // Lógica para manejar el spread de alerta excedido (por ejemplo, enviar una notificación)
//     }
//   }
// }

// // Iniciar el polling
// function startPolling() {
//   setInterval(async () => {
//     try {
//       await pollSpread();
//     } catch (error) {
//       console.error("Error en el polling:", error);
//     }
//   }, POLLING_INTERVAL);
// }

// // Llamar a startPolling() para iniciar el polling cuando la aplicación se inicia o cuando sea necesario.
// startPolling();

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
