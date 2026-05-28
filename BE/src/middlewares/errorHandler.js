import { StatusCodes } from "http-status-codes";

export const errorHandlingMiddleware = (err, req, res, next) => {
  console.error("❌ Error:", err.message);

  if (err.message?.includes("CORS blocked")) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false, message: err.message, code: "CORS_ERROR",
    });
  }

  if (err.message?.includes("Email already exists")) {
    return res.status(StatusCodes.CONFLICT).json({
      success: false, message: "Email đã được sử dụng", code: "EMAIL_EXISTS",
    });
  }

  res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: err.message || "Internal Server Error",
    code: err.code || "SERVER_ERROR",
  });
};