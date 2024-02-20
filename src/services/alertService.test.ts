import {
  getAlertMessage,
  saveAlert,
  checkAlerts,
  checkAlert,
  alertSpreads,
  pollAlerts,
} from "./alertService";
import * as alertService from "./alertService";
import { getMarketSpread } from "./marketService";

jest.mock("./marketService", () => ({
  calculateSpreads: jest.fn().mockResolvedValue({
    market1: { spread: 0.01 },
    market2: { spread: 0.02 },
  }),
  getMarketSpread: jest.fn(),
}));

describe("getAlertMessage", () => {
  it("should return an object with spread, alertSpread, and message properties when alertSpread is defined", () => {
    const spread = 10;
    const alertSpread = 5;

    const result = getAlertMessage(spread, alertSpread);

    expect(result).toEqual({
      spread: 10,
      alertSpread: 5,
      message: "Current spread BIGGER than alert spread (10 > 5)",
    });
  });

  it('should return an object with spread, alertSpread, and "No alert spread set for this market" message when alertSpread is undefined', () => {
    const spread = 10;
    const alertSpread = undefined;

    const result = getAlertMessage(spread, alertSpread);

    expect(result).toEqual({
      spread: 10,
      alertSpread: undefined,
      message: "No alert spread set for this market",
    });
  });

  it('should return an object with message "Current spread EQUALS alert spread" when spread equals alertSpread', () => {
    const spread = 10;
    const alertSpread = 10;

    const result = getAlertMessage(spread, alertSpread);

    expect(result).toEqual({
      spread: 10,
      alertSpread: 10,
      message: "Current spread EQUALS alert spread (10 = 10)",
    });
  });

  it("should return undefined when spread is undefined", () => {
    const spread = undefined;
    const alertSpread = 5;

    const result = getAlertMessage(spread, alertSpread);

    expect(result).toEqual({
      alertSpread: 5,
      message: "Current spread LOWER than alert spread (undefined < 5)",
      spread: undefined,
    });
  });

  it("should return undefined when alertSpread is null", () => {
    const spread = 10;
    const alertSpread = undefined;

    const result = getAlertMessage(spread, alertSpread);

    expect(result).toEqual({
      spread: 10,
      alertSpread: undefined,
      message: "No alert spread set for this market",
    });
  });

  it("should return undefined when spread is null", () => {
    const spread = null;
    const alertSpread = 5;

    const result = getAlertMessage(spread, alertSpread);

    expect(result).toEqual({
      alertSpread: 5,
      message: "Current spread LOWER than alert spread (null < 5)",
      spread: null,
    });
  });
});

describe("saveAlert", () => {
  let req: Partial<Request>;
  it("should save alert spread when valid request body is provided", async () => {
    const alertSpread = { "BTC-CLP": 0.5 };

    const response = await saveAlert(alertSpread);

    expect(response).toEqual({
      code: 201,
      message: "Alert spread saved successfully",
      alertSpreads: { "BTC-CLP": 0.5 },
    });
  });

  it("should return a success message and updated alert spreads when alert spread is saved successfully", async () => {
    const alertSpread = { "ETH-CLP": 0.3 };

    const response = await saveAlert(alertSpread);

    expect(response).toEqual({
      code: 201,
      message: "Alert spread saved successfully",
      alertSpreads: { "BTC-CLP": 0.5, "ETH-CLP": 0.3 },
    });
  });

  it("should return an error message when alert spread is not provided in request body", async () => {
    const response = await saveAlert();

    expect(response).toEqual({
      code: 500,
      message: "No alert spread provided",
    });
  });

  it("should overwrite existing alert spread for a specific market when new alert spread is provided", async () => {
    const alertSpreads = { "BTC-CLP": 0.2, "ETH-CLP": 0.3 };
    const alertSpread = { "BTC-CLP": 0.8 };

    await saveAlert(alertSpreads);
    const response = await saveAlert(alertSpread);
    expect(response).toEqual({
      code: 201,
      message: "Alert spread saved successfully",
      alertSpreads: { "BTC-CLP": 0.8, "ETH-CLP": 0.3 },
    });
  });
});

describe("checkAlerts", () => {
  test("should return an object with spread, alertSpread and message for each market", async () => {
    const response = await checkAlerts();
    expect(response).toBeDefined();
    expect(typeof response).toBe("object");
    for (const market in response) {
      expect(response[market].spread).toBeDefined();
      expect(response[market].alertSpread).toBeUndefined();
      expect(response[market].message).toBeDefined();
    }
  });
  test("should return alert status for each market", async () => {
    const result = await checkAlerts();

    expect(result).toEqual({
      market1: {
        spread: 0.01,
        alertSpread: undefined,
        message: "No alert spread set for this market",
      },
      market2: {
        spread: 0.02,
        alertSpread: undefined,
        message: "No alert spread set for this market",
      },
    });
  });
});

describe("checkAlert", () => {
  test("should return alert message when spread is lower than alert spread", async () => {
    const id = "BTC-USD";
    const spread = 0.01;
    const alertSpread = 0.02;
    const message = "Current spread LOWER than alert spread (0.01 < 0.02)";

    (getMarketSpread as jest.Mock).mockResolvedValue(spread);

    alertSpreads[id] = alertSpread;

    const result = await checkAlert(id);

    expect(result).toEqual({ [id]: { alertSpread, spread, message } });
  });

  test("should return alert message when spread is equal to alert spread", async () => {
    const id = "BTC-USD";
    const spread = 0.02;
    const alertSpread = 0.02;
    const message = "Current spread EQUALS alert spread (0.02 = 0.02)";

    (getMarketSpread as jest.Mock).mockResolvedValue(spread);

    alertSpreads[id] = alertSpread;

    const result = await checkAlert(id);

    expect(result).toEqual({ [id]: { alertSpread, spread, message } });
  });

  test("should return alert message when alert spread is not set for the market", async () => {
    const id = "ETH-USD";
    const spread = 0.02;
    const alertSpread = undefined;
    const expectedMessage = "No alert spread set for this market";

    (getMarketSpread as jest.Mock).mockResolvedValue(spread);

    const result = await checkAlert(id);

    expect(result).toEqual({ [id]: expectedMessage });
  });

  test("should throw an error when there is an error fetching or calculating spread", async () => {
    const id = "BTC-USD";
    const errorMessage = "Error fetching or calculating spread";

    (getMarketSpread as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(checkAlert(id)).rejects.toThrow(errorMessage);
  });

  test("should throw an error when there is an error checking alert status", async () => {
    const id = "BTC-USD";
    const errorMessage = "Error checking alert status";

    jest.spyOn(global.console, "error").mockImplementation(() => {});

    await expect(checkAlert(id)).rejects.toThrow(errorMessage);

    jest.restoreAllMocks();
  });
});

describe("pollAlerts", () => {
  test("should log spread alert status when there are no errors", async () => {
    const alertStatus = {
      market1: {
        spread: 0.01,
        alertSpread: 0.02,
        message: "Current spread LOWER than alert spread (0.01 < 0.02)",
      },
      market2: {
        spread: 0.02,
        alertSpread: 0.03,
        message: "Current spread LOWER than alert spread (0.02 < 0.03)",
      },
    };

    alertSpreads["market1"] = 0.02;
    alertSpreads["market2"] = 0.03;

    const logSpy = jest.spyOn(console, "log").mockImplementation();
    const errorSpy = jest.spyOn(console, "error").mockImplementation();

    await pollAlerts();

    expect(logSpy).toHaveBeenCalledWith("Spread Alert status:", alertStatus);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
