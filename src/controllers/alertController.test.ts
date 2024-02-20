import { Request, Response } from "express";
import { getAlerts, getAlert, postAlert } from "./alertController";
import { checkAlerts, checkAlert, saveAlert } from "../services/alertService";
import * as alertService from "../services/alertService";
import { sendErrorResponse } from "../utils/responseUtils";

jest.mock("../services/alertService");

describe("getAlerts", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = {};
    res = { status: statusMock } as Partial<Response>;
  });

  test("should return alert status when checkAlerts succeeds", async () => {
    (checkAlerts as jest.Mock).mockResolvedValue({
      market1: { spread: 0.01 },
      market2: { spread: 0.02 },
    });

    await getAlerts(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      market1: { spread: 0.01 },
      market2: { spread: 0.02 },
    });
  });

  test("should return 500 status when checkAlerts fails", async () => {
    (checkAlerts as jest.Mock).mockRejectedValue(
      new Error("Failed to check alerts")
    );

    await getAlerts(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
  });
});

describe("getAlert", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = { params: { id: "testMarket" } };
    res = { status: statusMock } as Partial<Response>;
  });

  test("should return alert spread when checkAlert succeeds", async () => {
    (checkAlert as jest.Mock).mockResolvedValue({
      testMarket: "Alert message",
    });

    await getAlert(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ testMarket: "Alert message" });
  });

  test("should return 500 status when checkAlert fails", async () => {
    (checkAlert as jest.Mock).mockRejectedValue(
      new Error("Failed to check alert")
    );

    await getAlert(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
  });
});

describe("postAlert", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {
        alertSpread: {
          market1: 0.01,
          market2: 0.02,
        },
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should handle successful alert spread saving", async () => {
    const saveAlertMock = jest
      .spyOn(alertService, "saveAlert")
      .mockResolvedValue({
        code: 201,
        message: "Alert spread saved successfully",
        alertSpreads: req.body.alertSpread,
      });

    await postAlert(req as Request, res as Response);

    expect(saveAlertMock).toHaveBeenCalledWith(req.body.alertSpread);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Alert spread saved successfully",
      alertSpreads: req.body.alertSpread,
    });
  });

  it("should handle missing alertSpread in request body", async () => {
    delete req.body.alertSpread;

    await postAlert(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid request body: alertSpread is required",
    });
  });

  it("should handle error while saving alert spread", async () => {
    const error = new Error("Error saving alert spread");
    const saveAlertMock = jest
      .spyOn(alertService, "saveAlert")
      .mockRejectedValue(error);

    await postAlert(req as Request, res as Response);

    expect(saveAlertMock).toHaveBeenCalledWith(req.body.alertSpread);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error saving alert spread: " + error.message,
    });
  });
});
