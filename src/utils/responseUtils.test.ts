import { Response } from "express";
import { sendErrorResponse } from "./responseUtils";

describe("sendErrorResponse", () => {
  let res: Response;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    res = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should send error response with status and message", () => {
    const status = 400;
    const message = "Error: Invalid request";

    sendErrorResponse(res, status, message);

    expect(statusMock).toHaveBeenCalledWith(status);
    expect(jsonMock).toHaveBeenCalledWith({ message });
  });
});
