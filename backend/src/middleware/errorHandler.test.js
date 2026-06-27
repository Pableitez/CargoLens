import { describe, expect, it, jest } from "@jest/globals";
import { errorHandler, notFoundHandler } from "./errorHandler.js";

describe("errorHandler middleware", () => {
  it("returns JSON 404 from notFoundHandler", () => {
    const json = jest.fn();
    notFoundHandler({}, { status: () => ({ json }) });
    expect(json).toHaveBeenCalledWith({
      error: "NOT_FOUND",
      message: "Route not found.",
    });
  });

  it("returns JSON 500 from errorHandler", () => {
    const json = jest.fn();
    const next = jest.fn();
    errorHandler(new Error("boom"), {}, { headersSent: false, status: () => ({ json }) }, next);
    expect(json).toHaveBeenCalledWith({
      error: "SERVER_ERROR",
      message: "Unexpected server error.",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
