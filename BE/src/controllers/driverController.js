import { getPool, sql } from "../config/db.js";

function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

function buildBookingCode(reservationId) {
  return `BK-${String(reservationId).padStart(4, "0")}`;
}

function buildReportCode(incidentId) {
  return `RP-${String(incidentId).padStart(4, "0")}`;
}

function formatSessionCode(sessionId, entryTime) {
  const date = new Date(entryTime);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `SESS-${yyyy}${mm}${dd}-${String(sessionId).padStart(4, "0")}`;
}

function normalizeReportPriority(issueType) {
  const highPriorityTypes = new Set(["no_session", "occupied", "payment"]);
  const lowPriorityTypes = new Set(["other"]);

  if (highPriorityTypes.has(issueType)) return "High";
  if (lowPriorityTypes.has(issueType)) return "Low";
  return "Normal";
}

function buildAttachmentText(attachments) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;

  return attachments
    .map((item) => {
      if (typeof item === "string") return item;
      return item.name || item.fileName || item.originalname || "";
    })
    .filter(Boolean)
    .join(", ")
    .slice(0, 200);
}

// ─────────────────────────────────────────────────────────────
// DRIVER HOME
// GET /driver/home
// ─────────────────────────────────────────────────────────────
export async function getDriverHome(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

    const [
      userResult,
      slotResult,
      bookingSummaryResult,
      currentBookingResult,
      currentSessionResult,
    ] = await Promise.all([
      pool
        .request()
        .input("DriverID", sql.Int, driverId)
        .query(`
          SELECT TOP 1
            u.UserID,
            u.FullName,
            u.Email,
            u.PhoneNumber,
            CONVERT(VARCHAR(10), u.DateOfBirth, 23) AS DateOfBirth,
            u.AvatarUrl,
            u.IsActive,
            u.IsEmailVerified,
            r.RoleName
          FROM Users u
          LEFT JOIN Roles r ON u.RoleID = r.RoleID
          WHERE u.UserID = @DriverID
        `),

      pool.request().query(`
        SELECT
          vt.VehicleTypeID,
          vt.VehicleCode,
          vt.VehicleName,
          COUNT(ps.SlotID) AS TotalSlots,
          SUM(CASE WHEN ps.SlotStatus = 'Available' THEN 1 ELSE 0 END) AS AvailableSlots,
          SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END) AS OccupiedSlots,
          SUM(CASE WHEN ps.SlotStatus = 'Reserved' THEN 1 ELSE 0 END) AS ReservedSlots
        FROM VehicleTypes vt
        LEFT JOIN ParkingSlots ps ON vt.VehicleTypeID = ps.VehicleTypeID
        GROUP BY vt.VehicleTypeID, vt.VehicleCode, vt.VehicleName
        ORDER BY vt.VehicleTypeID
      `),

      pool
        .request()
        .input("DriverID", sql.Int, driverId)
        .query(`
          SELECT
            COUNT(*) AS TotalBookings,
            SUM(
              CASE 
                WHEN ReservationStatus = 'Reserved' AND EndTime >= GETDATE()
                THEN 1 ELSE 0 
              END
            ) AS ActiveBookings,
            SUM(
              CASE 
                WHEN ReservationStatus = 'Completed'
                THEN 1 ELSE 0 
              END
            ) AS CompletedBookings,
            SUM(
              CASE 
                WHEN ReservationStatus = 'Cancelled'
                THEN 1 ELSE 0 
              END
            ) AS CancelledBookings,
            SUM(
              CASE 
                WHEN ReservationStatus = 'Expired'
                  OR (ReservationStatus = 'Reserved' AND EndTime < GETDATE())
                THEN 1 ELSE 0 
              END
            ) AS ExpiredBookings
          FROM Reservations
          WHERE DriverID = @DriverID
        `),

      pool
        .request()
        .input("DriverID", sql.Int, driverId)
        .query(`
          SELECT TOP 1
            r.ReservationID,
            CONCAT('BK-', RIGHT('0000' + CAST(r.ReservationID AS VARCHAR(10)), 4)) AS BookingCode,
            r.DriverID,
            r.VehicleTypeID,
            vt.VehicleCode,
            vt.VehicleName,
            r.SlotID,
            ps.SlotCode,
            z.ZoneName,
            f.FloorName,
            b.BuildingName,
            b.Address,
            r.ReservationDate,
            r.StartTime,
            r.EndTime,
            r.ReservationStatus,
            r.CreatedAt
          FROM Reservations r
          JOIN VehicleTypes vt ON r.VehicleTypeID = vt.VehicleTypeID
          LEFT JOIN ParkingSlots ps ON r.SlotID = ps.SlotID
          LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
          LEFT JOIN Floors f ON z.FloorID = f.FloorID
          LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID
          WHERE r.DriverID = @DriverID
            AND r.ReservationStatus = 'Reserved'
            AND r.EndTime >= GETDATE()
          ORDER BY r.StartTime ASC
        `),

      pool
        .request()
        .input("DriverID", sql.Int, driverId)
        .query(`
          SELECT TOP 1
            s.SessionID,
            s.DriverID,
            s.PlateNumber,
            s.VehicleTypeID,
            vt.VehicleCode,
            vt.VehicleName,
            s.EntryTime,
            s.ExitTime,
            s.SessionStatus,

            ps.SlotID,
            ps.SlotCode,

            z.ZoneName,
            f.FloorName,
            b.BuildingID,
            b.BuildingName,
            b.Address,

            p.Amount,
            p.PaymentMethod,
            p.PaymentTime,
            p.PaymentStatus,

            booking.ReservationID,
            CASE 
              WHEN booking.ReservationID IS NOT NULL
              THEN CONCAT('BK-', RIGHT('0000' + CAST(booking.ReservationID AS VARCHAR(10)), 4))
              ELSE NULL
            END AS BookingCode

          FROM ParkingSessions s
          JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
          JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
          JOIN Zones z ON ps.ZoneID = z.ZoneID
          JOIN Floors f ON z.FloorID = f.FloorID
          JOIN Buildings b ON f.BuildingID = b.BuildingID
          LEFT JOIN Payments p ON p.SessionID = s.SessionID

          OUTER APPLY (
            SELECT TOP 1 r.ReservationID
            FROM Reservations r
            WHERE r.DriverID = s.DriverID
              AND r.SlotID = s.SlotID
              AND r.ReservationStatus IN ('Reserved', 'Completed')
            ORDER BY ABS(DATEDIFF(MINUTE, r.StartTime, s.EntryTime))
          ) booking

          WHERE s.DriverID = @DriverID
            AND s.SessionStatus = 'Active'
            AND s.ExitTime IS NULL

          ORDER BY s.EntryTime DESC
        `),
    ]);

    const user = userResult.recordset[0] || null;

    const bookingSummary = bookingSummaryResult.recordset[0] || {
      TotalBookings: 0,
      ActiveBookings: 0,
      CompletedBookings: 0,
      CancelledBookings: 0,
      ExpiredBookings: 0,
    };

    const currentBooking = currentBookingResult.recordset[0] || null;
    const currentSession = currentSessionResult.recordset[0] || null;

    let mappedCurrentSession = null;

    if (currentSession) {
      const entryTime = new Date(currentSession.EntryTime);
      const now = new Date();

      const parkedMinutes = Math.max(
        0,
        Math.floor((now.getTime() - entryTime.getTime()) / 60000)
      );

      const parkedHours = Math.floor(parkedMinutes / 60);
      const parkedRemainMinutes = parkedMinutes % 60;

      mappedCurrentSession = {
        ...currentSession,
        SessionCode: formatSessionCode(
          currentSession.SessionID,
          currentSession.EntryTime
        ),
        ParkedDuration: `${parkedHours} giờ ${parkedRemainMinutes} phút`,
      };
    }

    return res.json({
      success: true,
      data: {
        user,
        slotSummary: slotResult.recordset,
        bookingSummary,
        currentBooking: currentBooking
          ? {
              ...currentBooking,
              BookingCode:
                currentBooking.BookingCode ||
                buildBookingCode(currentBooking.ReservationID),
            }
          : null,
        currentSession: mappedCurrentSession,
        serverTime: new Date(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// DRIVER PROFILE
// GET /driver/profile
// PATCH /driver/profile
// ─────────────────────────────────────────────────────────────
export async function getDriverProfile(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 1
          u.UserID,
          u.FullName,
          u.Email,
          u.PhoneNumber,
          CONVERT(VARCHAR(10), u.DateOfBirth, 23) AS DateOfBirth,
          u.AvatarUrl,
          u.IsActive,
          u.IsEmailVerified,
          u.CreatedAt,
          u.UpdatedAt,
          r.RoleName
        FROM Users u
        LEFT JOIN Roles r ON u.RoleID = r.RoleID
        WHERE u.UserID = @DriverID
      `);

    const profile = result.recordset[0];

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ tài xế.",
      });
    }

    return res.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDriverProfile(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const fullName = String(req.body.fullName || req.body.FullName || "").trim();
    const phoneNumber = String(
      req.body.phoneNumber || req.body.PhoneNumber || ""
    ).trim();
    const avatarUrl = String(
      req.body.avatarUrl || req.body.AvatarUrl || ""
    ).trim();
    const dateOfBirth = req.body.dateOfBirth || req.body.DateOfBirth || null;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: "Họ và tên không được để trống.",
      });
    }

    if (phoneNumber && !/^[0-9+\-\s.]{8,20}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ.",
      });
    }

    const pool = await getPool();

    const updateResult = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .input("FullName", sql.NVarChar(100), fullName)
      .input("PhoneNumber", sql.NVarChar(20), phoneNumber || null)
      .input("AvatarUrl", sql.NVarChar(500), avatarUrl || null)
      .input("DateOfBirth", sql.VarChar(10), dateOfBirth || null)
      .query(`
        UPDATE Users
        SET
          FullName = @FullName,
          PhoneNumber = @PhoneNumber,
          AvatarUrl = @AvatarUrl,
          DateOfBirth = CASE
            WHEN @DateOfBirth IS NULL OR @DateOfBirth = '' THEN NULL
            ELSE CONVERT(date, @DateOfBirth, 23)
          END,
          UpdatedAt = GETDATE()
        WHERE UserID = @DriverID
      `);

    if (!updateResult.rowsAffected || updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản để cập nhật.",
      });
    }

    const updatedResult = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 1
          u.UserID,
          u.FullName,
          u.Email,
          u.PhoneNumber,
          CONVERT(VARCHAR(10), u.DateOfBirth, 23) AS DateOfBirth,
          u.AvatarUrl,
          u.IsActive,
          u.IsEmailVerified,
          u.CreatedAt,
          u.UpdatedAt,
          r.RoleName
        FROM Users u
        LEFT JOIN Roles r ON u.RoleID = r.RoleID
        WHERE u.UserID = @DriverID
      `);

    return res.json({
      success: true,
      message: "Cập nhật thông tin cá nhân thành công.",
      data: updatedResult.recordset[0],
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// DRIVER REPORT CONTEXT
// GET /driver/report-context
// ─────────────────────────────────────────────────────────────
export async function getDriverReportContext(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

      const currentSessionResult = await pool
        .request()
        .input("DriverID", sql.Int, driverId)
        .query(`
        SELECT
          s.SessionID,
          CONCAT(
            'SESS-',
            CONVERT(CHAR(8), s.EntryTime, 112),
            '-',
            RIGHT('0000' + CAST(s.SessionID AS VARCHAR(10)), 4)
          ) AS SessionCode,

          s.DriverID,
          s.PlateNumber,
          s.VehicleTypeID,
          vt.VehicleCode,
          vt.VehicleName,

          s.EntryTime,
          s.ExitTime,
          s.SessionStatus,

          ps.SlotID,
          ps.SlotCode,

          z.ZoneName,
          f.FloorName,
          b.BuildingID,
          b.BuildingName,
          b.Address,

          booking.ReservationID,
          CASE 
            WHEN booking.ReservationID IS NOT NULL
            THEN CONCAT('BK-', RIGHT('0000' + CAST(booking.ReservationID AS VARCHAR(10)), 4))
            ELSE NULL
          END AS BookingCode

        FROM ParkingSessions s
        JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
        JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
        JOIN Zones z ON ps.ZoneID = z.ZoneID
        JOIN Floors f ON z.FloorID = f.FloorID
        JOIN Buildings b ON f.BuildingID = b.BuildingID

        OUTER APPLY (
          SELECT TOP 1
            r.ReservationID,
            r.StartTime,
            r.EndTime
          FROM Reservations r
          WHERE r.DriverID = s.DriverID
            AND r.SlotID = s.SlotID
            AND r.ReservationStatus IN ('Reserved', 'Completed')
          ORDER BY ABS(DATEDIFF(MINUTE, r.StartTime, s.EntryTime))
        ) booking

        WHERE s.DriverID = @DriverID
          AND s.SessionStatus = 'Active'
          AND s.ExitTime IS NULL

        ORDER BY s.EntryTime DESC
      `);

    const reservationsResult = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 10
          r.ReservationID,
          CONCAT('BK-', RIGHT('0000' + CAST(r.ReservationID AS VARCHAR(10)), 4)) AS BookingCode,

          r.DriverID,
          r.VehicleTypeID,
          vt.VehicleCode,
          vt.VehicleName,

          r.SlotID,
          ps.SlotCode,

          z.ZoneName,
          f.FloorName,
          b.BuildingID,
          b.BuildingName,
          b.Address,

          r.StartTime,
          r.EndTime,
          r.ReservationStatus,
          r.CreatedAt,

          latestSession.SessionID,
          latestSession.PlateNumber

        FROM Reservations r
        JOIN VehicleTypes vt ON r.VehicleTypeID = vt.VehicleTypeID
        LEFT JOIN ParkingSlots ps ON r.SlotID = ps.SlotID
        LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
        LEFT JOIN Floors f ON z.FloorID = f.FloorID
        LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID

        OUTER APPLY (
          SELECT TOP 1
            s.SessionID,
            s.PlateNumber,
            s.EntryTime
          FROM ParkingSessions s
          WHERE s.DriverID = r.DriverID
            AND s.SlotID = r.SlotID
          ORDER BY s.EntryTime DESC
        ) latestSession

        WHERE r.DriverID = @DriverID

        ORDER BY r.CreatedAt DESC
      `);

    const reportsResult = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 10
          i.IncidentID,
          CONCAT('RP-', RIGHT('0000' + CAST(i.IncidentID AS VARCHAR(10)), 4)) AS ReportCode,
          i.SessionID,
          i.DriverID,
          i.IncidentType,
          i.IncidentStatus,
          i.Priority,
          i.Description,
          i.CreatedAt,
          i.UpdatedAt,

          s.PlateNumber,
          s.EntryTime,
          s.ExitTime,

          ps.SlotCode,
          z.ZoneName,
          f.FloorName,
          b.BuildingName

        FROM Incidents i
        LEFT JOIN ParkingSessions s ON i.SessionID = s.SessionID
        LEFT JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
        LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
        LEFT JOIN Floors f ON z.FloorID = f.FloorID
        LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID

        WHERE i.DriverID = @DriverID

        ORDER BY i.CreatedAt DESC
      `);

    return res.json({
      success: true,
      data: {
        currentSession: currentSessionResult.recordset[0] || null,
        activeSessions: currentSessionResult.recordset,
        reservations: reservationsResult.recordset,
        recentReports: reportsResult.recordset,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// DRIVER REPORT
// GET /driver/reports
// POST /driver/reports
// ─────────────────────────────────────────────────────────────
export async function createDriverReport(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const issueType = String(req.body.issueType || "other").trim();
    const issueLabel = String(req.body.issueLabel || "").trim();
    const description = String(req.body.description || "").trim();

    const sessionIdRaw = req.body.sessionId;
    const reservationIdRaw = req.body.reservationId;

    const sessionId =
      sessionIdRaw && !Number.isNaN(Number(sessionIdRaw))
        ? Number(sessionIdRaw)
        : null;

    const reservationId =
      reservationIdRaw && !Number.isNaN(Number(reservationIdRaw))
        ? Number(reservationIdRaw)
        : null;

    const bookingCode = String(req.body.bookingCode || "").trim();
    const plateNumber = String(req.body.plateNumber || "").trim();
    const attachments = Array.isArray(req.body.attachments)
      ? req.body.attachments
      : [];

    if (!issueType) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn loại sự cố.",
      });
    }

    if (!description || description.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng mô tả sự cố rõ hơn, tối thiểu 5 ký tự.",
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Mô tả sự cố không được vượt quá 1000 ký tự.",
      });
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      let verifiedSession = null;
      let verifiedReservation = null;

      if (sessionId) {
        const sessionCheck = await new sql.Request(transaction)
          .input("SessionID", sql.Int, sessionId)
          .input("DriverID", sql.Int, driverId)
          .query(`
            SELECT TOP 1
              s.SessionID,
              s.PlateNumber,
              s.EntryTime,
              s.SessionStatus,
              ps.SlotCode,
              b.BuildingName
            FROM ParkingSessions s
            LEFT JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
            LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
            LEFT JOIN Floors f ON z.FloorID = f.FloorID
            LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID
            WHERE s.SessionID = @SessionID
              AND s.DriverID = @DriverID
          `);

        verifiedSession = sessionCheck.recordset[0];

        if (!verifiedSession) {
          await transaction.rollback();

          return res.status(404).json({
            success: false,
            message: "Không tìm thấy phiên gửi xe thuộc tài khoản của bạn.",
          });
        }
      }

      if (reservationId) {
        const reservationCheck = await new sql.Request(transaction)
          .input("ReservationID", sql.Int, reservationId)
          .input("DriverID", sql.Int, driverId)
          .query(`
            SELECT TOP 1
              r.ReservationID,
              CONCAT('BK-', RIGHT('0000' + CAST(r.ReservationID AS VARCHAR(10)), 4)) AS BookingCode,
              r.StartTime,
              r.EndTime,
              r.ReservationStatus,
              ps.SlotCode,
              b.BuildingName
            FROM Reservations r
            LEFT JOIN ParkingSlots ps ON r.SlotID = ps.SlotID
            LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
            LEFT JOIN Floors f ON z.FloorID = f.FloorID
            LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID
            WHERE r.ReservationID = @ReservationID
              AND r.DriverID = @DriverID
          `);

        verifiedReservation = reservationCheck.recordset[0];

        if (!verifiedReservation) {
          await transaction.rollback();

          return res.status(404).json({
            success: false,
            message: "Không tìm thấy đặt chỗ thuộc tài khoản của bạn.",
          });
        }
      }

      const attachmentText = buildAttachmentText(attachments);

      const finalDescription = [
        issueLabel ? `[${issueLabel}]` : null,
        bookingCode ? `Mã đặt chỗ: ${bookingCode}` : null,
        plateNumber ? `Biển số: ${plateNumber}` : null,
        verifiedSession?.SlotCode ? `Vị trí: ${verifiedSession.SlotCode}` : null,
        verifiedReservation?.SlotCode
          ? `Vị trí đặt chỗ: ${verifiedReservation.SlotCode}`
          : null,
        attachmentText ? `Tệp đính kèm: ${attachmentText}` : null,
        `Nội dung: ${description}`,
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 500);

      const incidentResult = await new sql.Request(transaction)
        .input("SessionID", sql.Int, sessionId)
        .input("DriverID", sql.Int, driverId)
        .input("IncidentType", sql.NVarChar(50), issueType)
        .input("Priority", sql.NVarChar(20), normalizeReportPriority(issueType))
        .input("Description", sql.NVarChar(500), finalDescription)
        .query(`
          INSERT INTO Incidents (
            SessionID,
            DriverID,
            IncidentType,
            IncidentStatus,
            Priority,
            Description,
            CreatedAt,
            UpdatedAt
          )
          VALUES (
            @SessionID,
            @DriverID,
            @IncidentType,
            'Open',
            @Priority,
            @Description,
            GETDATE(),
            GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS IncidentID;
        `);

      const incident = incidentResult.recordset[0];

      await new sql.Request(transaction)
        .input("DriverID", sql.Int, driverId)
        .input("IncidentID", sql.Int, incident.IncidentID)
        .input("FeedbackType", sql.NVarChar(50), issueType)
        .input("Description", sql.NVarChar(500), description.slice(0, 500))
        .input("Attachment", sql.NVarChar(200), attachmentText)
        .query(`
          INSERT INTO Feedbacks (
            DriverID,
            IncidentID,
            FeedbackType,
            Description,
            Attachment,
            FeedbackStatus,
            CreatedAt,
            UpdatedAt
          )
          VALUES (
            @DriverID,
            @IncidentID,
            @FeedbackType,
            @Description,
            @Attachment,
            'Open',
            GETDATE(),
            GETDATE()
          )
        `);

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "Gửi báo cáo sự cố thành công.",
        data: {
          ...incident,
          ReportCode: buildReportCode(incident.IncidentID),
        },
      });
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {}

      throw error;
    }
  } catch (err) {
    next(err);
  }
}

export async function getDriverReports(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const pool = await getPool();

    const result = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .input("Limit", sql.Int, limit)
      .input("Offset", sql.Int, offset)
      .query(`
        SELECT
          i.IncidentID,
          CONCAT('RP-', RIGHT('0000' + CAST(i.IncidentID AS VARCHAR(10)), 4)) AS ReportCode,
          i.SessionID,
          i.DriverID,
          i.IncidentType,
          i.IncidentStatus,
          i.Priority,
          i.Description,
          i.CreatedAt,
          i.UpdatedAt,

          s.PlateNumber,
          s.EntryTime,
          s.ExitTime,

          ps.SlotCode,
          z.ZoneName,
          f.FloorName,
          b.BuildingName

        FROM Incidents i
        LEFT JOIN ParkingSessions s ON i.SessionID = s.SessionID
        LEFT JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
        LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
        LEFT JOIN Floors f ON z.FloorID = f.FloorID
        LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID

        WHERE i.DriverID = @DriverID

        ORDER BY i.CreatedAt DESC
        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
      `);

    return res.json({
      success: true,
      data: result.recordset,
    });
  } catch (err) {
    next(err);
  }
}