/**
 * FILE: reservationController.js
 * MÔ TẢ: Controller xử lý đặt chỗ đỗ xe (Reservation/Booking).
 * 
 * Chức năng:
 * - getReservations: Lấy danh sách đặt chỗ
 * - getReservationById: Xem chi tiết một đặt chỗ
 * - getAvailableSlots: Lấy danh sách chỗ trống theo tiêu chí
 * - createReservation: Tạo đặt chỗ mới
 * - cancelReservation: Hủy đặt chỗ
 * 
 * @access Driver (đặt chỗ), Staff/Manager (xem)
 */

import * as reservationService from "../services/reservationService.js"; // Service xử lý logic đặt chỗ

/**
 * Hàm helper: Lấy HTTP status code từ đối tượng error.
 * @param {Error} err - Đối tượng lỗi
 * @returns {number} HTTP status code (mặc định 500)
 */
function getErrorStatus(err) {
  return err.status || err.statusCode || 500;
}

/**
 * Hàm helper: Gửi response lỗi cho client nếu là lỗi client (4xx).
 * Nếu lỗi 5xx (server), trả về null để middleware tiếp theo xử lý.
 * @param {Object} res - Express response
 * @param {Error} err - Đối tượng lỗi
 * @returns {Object|null} Response hoặc null
 */
function sendClientError(res, err) {
  const status = getErrorStatus(err);

  if (status < 500) {
    return res.status(status).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  return null;
}

/** @route GET /api/reservations - Lấy danh sách đặt chỗ */
export async function getReservations(req, res, next) {
  try {
    const data = await reservationService.getReservations(req);

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

export async function getReservationById(req, res, next) {
  try {
    const data = await reservationService.getReservationById(req);

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

export async function getAvailableSlots(req, res, next) {
  try {
    const data = await reservationService.getAvailableSlots(req);

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

export async function createReservation(req, res, next) {
  try {
    const data = await reservationService.createReservation(req);

    return res.status(201).json({
      success: true,
      message: "Đặt chỗ thành công.",
      data,
    });
  } catch (err) {
    const handled = sendClientError(res, err);
    if (handled) return handled;
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
    const handled = sendClientError(res, err);
    if (handled) return handled;
    next(err);
  }
}