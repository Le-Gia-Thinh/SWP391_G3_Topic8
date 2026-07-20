// src/utils/auditLogger.js
// Helper ghi AuditLogs dùng chung cho các controller.
// Tách ra từ adminController.logAudit để controller hạ tầng (Floor/Zone/Slot) tái dùng.
import { sql } from '../config/db.js'
/*
hieu
*/

/**
 * Ghi một dòng audit log. Không bao giờ throw (lỗi log không được làm hỏng request chính).
 * @param {*} pool   mssql pool (đã connect)
 * @param {*} user   req.user (có thể null) — kỳ vọng { UserID, FullName, RoleName }
 * @param {string} action  'Create' | 'Update' | 'Delete' | 'Lock' | 'Unlock' | ...
 * @param {string} target  Nhóm đối tượng, vd 'Slot', 'Khu vực', 'Tầng'
 * @param {string} description  Mô tả người-đọc-được
 * @param {string} ip  req.ip
 */
export async function logAudit(pool, user, action, target, description, ip) {
  try {
    await pool.request()
      .input('UserID', sql.Int, user?.UserID || null)
      .input('UserName', sql.NVarChar(100), user?.FullName || 'Hệ thống')
      .input('RoleName', sql.NVarChar(50), user?.RoleName || 'Admin')
      .input('Action', sql.NVarChar(50), action)
      .input('Target', sql.NVarChar(100), target)
      .input('Description', sql.NVarChar(500), description)
      .input('IpAddress', sql.NVarChar(45), ip || null)
      .query(`
        INSERT INTO AuditLogs (UserID, UserName, RoleName, Action, Target, Description, IpAddress)
        VALUES (@UserID, @UserName, @RoleName, @Action, @Target, @Description, @IpAddress)
      `)
  } catch (err) {
    console.error('Audit Log Error:', err)
  }
}