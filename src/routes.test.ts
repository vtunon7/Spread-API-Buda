import express, { Response } from "express";
import request from "supertest";
import bodyParser from "body-parser";
import router from "./routes";
import { validateMarketId, validateSaveAlert } from "./middleware/validation";
import { getSpread, getSpreads } from "./controllers/spreadController";
import { getAlerts, getAlert, postAlert } from "./controllers/alertController";
import { alertSpreads } from "./services/alertService";

jest.mock("./middleware/validation");
jest.mock("./controllers/spreadController");
jest.mock("./controllers/alertController");

const app = express();
app.use(bodyParser.json());
app.use(router);

describe("Routes", () => {
  test("GET /markets/:id/spreads", async () => {
    (validateMarketId as jest.Mock).mockImplementation((req, res, next) =>
      next()
    );

    (getSpread as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({
        market: {
          "BTC-CLP": 1000,
        },
      });
    });

    const response = await request(app).get("/markets/BTC-USD/spreads");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      market: {
        "BTC-CLP": 1000,
      },
    });
  });

  test("GET /markets/spreads", async () => {
    (getSpreads as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({
        market: {
          "BTC-CLP": 1000,
          "ETH-CLP": 1000,
        },
      });
    });

    const response = await request(app).get("/markets/spreads");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      market: {
        "BTC-CLP": 1000,
        "ETH-CLP": 1000,
      },
    });
  });

  test("POST /markets/spreads/alert", async () => {
    (validateMarketId as jest.Mock).mockImplementation((req, res, next) =>
      next()
    );

    (validateSaveAlert as jest.Mock).mockImplementation((req, res, next) =>
      next()
    );

    (postAlert as jest.Mock).mockImplementation((req, res) => {
      res.status(201).json({
        message: "Alert spread saved successfully",
      });
    });

    const response = await request(app)
      .post("/markets/spreads/alert")
      .send({ alertSpread: { "BTC-CLP": 1000 } });

    expect(response.status).toBe(201);
    console.log(response.body);
    expect(response.body).toEqual({
      message: "Alert spread saved successfully",
    });
  });

  test("GET /markets/spreads/alert", async () => {
    (getAlerts as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json(alertSpreads);
    });

    const response = await request(app).get("/markets/spreads/alert");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(alertSpreads);
  });

  test("GET /markets/:id/spreads/alert", async () => {
    (validateMarketId as jest.Mock).mockImplementation((req, res, next) =>
      next()
    );

    (getAlert as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({
        "BTC-CLP": 1000,
      });
    });

    const response = await request(app).get("/markets/BTC-USD/spreads/alert");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      "BTC-CLP": 1000,
    });
  });
});
