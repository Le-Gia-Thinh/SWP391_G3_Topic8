/**
 * FILE: requestUser.js
 * MÔ TẢ: Các hàm tiện ích để lấy thông tin user từ đối tượng request.
 * 
 * Vì req.user có thể đến từ nhiều nguồn (JWT decode, DB query), 
 * các trường có thể khác nhau (UserID vs userId vs id).
 * Các hàm này giúp lấy đúng giá trị bất kể nguồn gốc.
 */

/**
 * Lấy UserID từ request.
 * Kiểm tra tất cả các tên trường có thể có: UserID (DB), userId (JWT), id (fallback).
 * @param {Object} req - Express request (đã qua middleware isAuthorized)
 * @returns {number|undefined} UserID hoặc undefined nếu chưa xác thực
 */
export function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

/**
 * Lấy tên vai trò (RoleName) từ request.
 * Kiểm tra cả RoleName (DB) và roleName (JWT).
 * @param {Object} req - Express request (đã qua middleware isAuthorized)
 * @returns {string|undefined} Tên vai trò ("Admin", "Manager", "Staff", "Driver") hoặc undefined
 */
export function getRoleNameFromToken(req) {
  return req.user?.RoleName || req.user?.roleName;
}