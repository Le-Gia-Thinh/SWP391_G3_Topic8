import * as reservationService from "../services/reservationService.js";

function getErrorStatus(err) {
  return err.status || err.statusCode || 500;
}

export async function getReservations(req, res, next) {
  try {
    const data = await reservationService.getReservations(req);

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getReservationById(req, res, next) {
  try {
    const data = await reservationService.getReservationById(req);

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    const status = getErrorStatus(err);

    if (status < 500) {
      return res.status(status).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
}

export async function createReservation(req, res, next) {
  try {
    const data = await reservationService.createReservation(req);

    return res.status(201).json({
      success: true,
      message: "Đặt chỗ thành công.",
      data,
    });
  } catch (err) {
    const status = getErrorStatus(err);

    if (status < 500) {
      return res.status(status).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
}

export async function cancelReservation(req, res, next) {
  try {
    const data = await reservationService.cancelReservation(req);

    return res.json({
      success: true,
      message: "Hủy đặt chỗ thành công.",
      data,
    });
  } catch (err) {
    const status = getErrorStatus(err);

    if (status < 500) {
      return res.status(status).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
}