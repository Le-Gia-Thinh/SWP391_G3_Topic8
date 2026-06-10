import * as sessionService from "../services/sessionService.js";

function getErrorStatus(err) {
  return err.status || err.statusCode || 500;
}

function sendClientError(res, err) {
  const status = getErrorStatus(err);

  if (status < 500) {
    return res.status(status).json({
      success: false,
      message: err.message,
    });
  }

  return null;
}

export async function getSessions(req, res, next) {
  try {
    const data = await sessionService.getSessions();
    res.status(StatusCodes.OK).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function checkInVehicle(req, res, next) {
  try {
    const data = await sessionService.checkInVehicle(req);

    return res.status(201).json({
      success: true,
      message: "Check-in thành công.",
      data,
    });
  } catch (err) {
    const handled = sendClientError(res, err);

    if (handled) return handled;

    next(err);
  }
}

export async function checkOutVehicle(req, res, next) {
  try {
    const data = await sessionService.checkOutVehicle(req);

    return res.json({
      success: true,
      message: "Check-out thành công.",
      data,
    });
  } catch (err) {
    const handled = sendClientError(res, err);

    if (handled) return handled;

    next(err);
  }
}

export async function getCurrentDriverSession(req, res, next) {
  try {
    const data = await sessionService.getCurrentDriverSession(req);

    if (!data) {
      return res.json({
        success: true,
        data: null,
        message: "Không có phiên đỗ xe hiện tại.",
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    const handled = sendClientError(res, err);

    if (handled) return handled;

    next(err);
  }
}
