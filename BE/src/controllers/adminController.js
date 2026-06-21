import { getPool, sql } from '../config/db.js';
import bcryptjs from 'bcryptjs';

export const getStats = async (req, res, next) => {
    try {
        const pool = await getPool();
        const usersResult = await pool.request().query(`
            SELECT 
                COUNT(*) as totalUsers,
                SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as activeUsers,
                SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as inactiveUsers,
                SUM(CASE WHEN IsEmailVerified = 1 THEN 1 ELSE 0 END) as verifiedUsers
            FROM Users
        `);

        const rolesResult = await pool.request().query(`
            SELECT r.RoleID, r.RoleName, COUNT(u.UserID) as Count
            FROM Roles r
            LEFT JOIN Users u ON r.RoleID = u.RoleID
            GROUP BY r.RoleID, r.RoleName
        `);

        const stats = {
            ...usersResult.recordset[0],
            usersByRole: rolesResult.recordset
        };

        res.json({ success: true, data: stats });
    } catch (err) {
        next(err);
    }
};

export const getRoles = async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM Roles');
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        next(err);
    }
};

export const getUsers = async (req, res, next) => {
    try {
        const { search, roleId, isActive } = req.query;
        let query = `
            SELECT u.UserID, u.FullName, u.Email, u.PhoneNumber, u.RoleID, r.RoleName, 
                   u.IsActive, u.IsEmailVerified, u.CreatedAt
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            WHERE 1=1
        `;
        const pool = await getPool();
        const request = pool.request();

        if (search) {
            query += ` AND (u.FullName LIKE @Search OR u.Email LIKE @Search OR u.PhoneNumber LIKE @Search)`;
            request.input('Search', sql.NVarChar(100), `%${search}%`);
        }
        if (roleId) {
            query += ` AND u.RoleID = @RoleID`;
            request.input('RoleID', sql.Int, roleId);
        }
        if (isActive !== undefined && isActive !== '') {
            query += ` AND u.IsActive = @IsActive`;
            request.input('IsActive', sql.Bit, isActive === '1' || isActive === 'true');
        }

        query += ' ORDER BY u.CreatedAt DESC';
        const result = await request.query(query);

        res.json({ success: true, data: result.recordset });
    } catch (err) {
        next(err);
    }
};

export const createUser = async (req, res, next) => {
    try {
        const { FullName, Email, PhoneNumber, RoleID } = req.body;
        const pool = await getPool();

        // check email
        const check = await pool.request().input('Email', sql.NVarChar(100), Email).query('SELECT UserID FROM Users WHERE Email = @Email');
        if (check.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
        }

        // Insert
        const passwordHash = await bcryptjs.hash('123456', 10);
        const request = pool.request()
            .input('FullName', sql.NVarChar(100), FullName)
            .input('Email', sql.NVarChar(100), Email)
            .input('PhoneNumber', sql.NVarChar(20), PhoneNumber || null)
            .input('RoleID', sql.Int, RoleID)
            .input('PasswordHash', sql.NVarChar(256), passwordHash)
            .input('DateOfBirth', sql.Date, new Date('1990-01-01'));

        const result = await request.query(`
            INSERT INTO Users (FullName, Email, PhoneNumber, RoleID, PasswordHash, IsActive, IsEmailVerified, DateOfBirth)
            OUTPUT INSERTED.UserID, INSERTED.CreatedAt
            VALUES (@FullName, @Email, @PhoneNumber, @RoleID, @PasswordHash, 1, 0, @DateOfBirth)
        `);

        // log audit
        await logAudit(pool, req.user, 'Create', 'Người dùng', `Tạo tài khoản "${FullName}"`, req.ip);

        // Get created user
        const newUser = await pool.request().input('UserID', sql.Int, result.recordset[0].UserID).query(`
            SELECT u.*, r.RoleName FROM Users u JOIN Roles r ON u.RoleID = r.RoleID WHERE u.UserID = @UserID
        `);

        res.json({ success: true, data: newUser.recordset[0] });
    } catch (err) {
        next(err);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { FullName, PhoneNumber, RoleID } = req.body;
        const pool = await getPool();

        await pool.request()
            .input('UserID', sql.Int, id)
            .input('FullName', sql.NVarChar(100), FullName)
            .input('PhoneNumber', sql.NVarChar(20), PhoneNumber || null)
            .input('RoleID', sql.Int, RoleID)
            .query(`
                UPDATE Users SET FullName = @FullName, PhoneNumber = @PhoneNumber, RoleID = @RoleID, UpdatedAt = GETDATE()
                WHERE UserID = @UserID
            `);

        await logAudit(pool, req.user, 'Update', 'Người dùng', `Cập nhật tài khoản ID ${id}`, req.ip);

        const updatedUser = await pool.request().input('UserID', sql.Int, id).query(`
            SELECT u.*, r.RoleName FROM Users u JOIN Roles r ON u.RoleID = r.RoleID WHERE u.UserID = @UserID
        `);
        
        res.json({ success: true, data: updatedUser.recordset[0] });
    } catch (err) {
        next(err);
    }
};

export const toggleUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const pool = await getPool();

        await pool.request()
            .input('UserID', sql.Int, id)
            .input('IsActive', sql.Bit, isActive)
            .query('UPDATE Users SET IsActive = @IsActive WHERE UserID = @UserID');

        const action = isActive ? 'Unlock' : 'Lock';
        await logAudit(pool, req.user, action, 'Người dùng', `${action === 'Lock' ? 'Khoá' : 'Mở khoá'} tài khoản ID ${id}`, req.ip);

        const updatedUser = await pool.request().input('UserID', sql.Int, id).query(`
            SELECT u.*, r.RoleName FROM Users u JOIN Roles r ON u.RoleID = r.RoleID WHERE u.UserID = @UserID
        `);
        
        res.json({ success: true, data: updatedUser.recordset[0] });
    } catch (err) {
        next(err);
    }
};

export const resetUserPassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pool = await getPool();
        const passwordHash = await bcryptjs.hash('123456', 10);
        
        await pool.request()
            .input('UserID', sql.Int, id)
            .input('PasswordHash', sql.NVarChar(256), passwordHash)
            .query('UPDATE Users SET PasswordHash = @PasswordHash WHERE UserID = @UserID');

        await logAudit(pool, req.user, 'Update', 'Người dùng', `Reset mật khẩu tài khoản ID ${id} về mặc định`, req.ip);

        res.json({ success: true, data: { UserID: id } });
    } catch (err) {
        next(err);
    }
};

export const getPermissions = async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM Permissions');
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        next(err);
    }
};

export const getRolePermissions = async (req, res, next) => {
    try {
        const pool = await getPool();
        
        const rolesQuery = await pool.request().query(`
            SELECT r.RoleID, r.RoleName, COUNT(u.UserID) as userCount
            FROM Roles r
            LEFT JOIN Users u ON r.RoleID = u.RoleID
            GROUP BY r.RoleID, r.RoleName
        `);
        
        const rpQuery = await pool.request().query('SELECT RoleID, PermissionID FROM RolePermissions');
        
        const roles = rolesQuery.recordset.map(r => {
            return {
                ...r,
                permissionIds: rpQuery.recordset.filter(rp => rp.RoleID === r.RoleID).map(rp => rp.PermissionID)
            };
        });
        
        res.json({ success: true, data: roles });
    } catch (err) {
        next(err);
    }
};

export const updateRolePermissions = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { permissionIds } = req.body;
        const pool = await getPool();
        const transaction = pool.transaction();
        await transaction.begin();
        
        try {
            await transaction.request().input('RoleID', sql.Int, id).query('DELETE FROM RolePermissions WHERE RoleID = @RoleID');
            
            for (const pid of permissionIds) {
                await transaction.request()
                    .input('RoleID', sql.Int, id)
                    .input('PermissionID', sql.Int, pid)
                    .query('INSERT INTO RolePermissions (RoleID, PermissionID) VALUES (@RoleID, @PermissionID)');
            }
            
            await transaction.commit();
            await logAudit(pool, req.user, 'Update', 'Phân quyền', `Cập nhật quyền cho Role ID ${id}`, req.ip);
            
            res.json({ success: true, data: { roleId: Number(id), permissionIds } });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        next(err);
    }
};

export const getBuildings = async (req, res, next) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM Buildings WHERE 1=1';
        const pool = await getPool();
        const request = pool.request();
        
        if (search) {
            query += ' AND (BuildingName LIKE @Search OR Address LIKE @Search)';
            request.input('Search', sql.NVarChar(100), `%${search}%`);
        }
        
        const result = await request.query(query);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        next(err);
    }
};

export const createBuilding = async (req, res, next) => {
    try {
        const { BuildingName, Address, OperatingHours, TotalFloors } = req.body;
        const pool = await getPool();
        const result = await pool.request()
            .input('BuildingName', sql.NVarChar(100), BuildingName)
            .input('Address', sql.NVarChar(200), Address || null)
            .input('OperatingHours', sql.NVarChar(50), OperatingHours || null)
            .input('TotalFloors', sql.Int, TotalFloors || 0)
            .query(`
                INSERT INTO Buildings (BuildingName, Address, OperatingHours, TotalFloors)
                OUTPUT INSERTED.*
                VALUES (@BuildingName, @Address, @OperatingHours, @TotalFloors)
            `);
            
        await logAudit(pool, req.user, 'Create', 'Cơ sở', `Thêm cơ sở "${BuildingName}"`, req.ip);
        res.json({ success: true, data: result.recordset[0] });
    } catch (err) {
        next(err);
    }
};

export const updateBuilding = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { BuildingName, Address, OperatingHours, TotalFloors } = req.body;
        const pool = await getPool();
        const result = await pool.request()
            .input('BuildingID', sql.Int, id)
            .input('BuildingName', sql.NVarChar(100), BuildingName)
            .input('Address', sql.NVarChar(200), Address || null)
            .input('OperatingHours', sql.NVarChar(50), OperatingHours || null)
            .input('TotalFloors', sql.Int, TotalFloors || 0)
            .query(`
                UPDATE Buildings SET BuildingName = @BuildingName, Address = @Address, 
                                     OperatingHours = @OperatingHours, TotalFloors = @TotalFloors, UpdatedAt = GETDATE()
                OUTPUT INSERTED.*
                WHERE BuildingID = @BuildingID
            `);
            
        await logAudit(pool, req.user, 'Update', 'Cơ sở', `Cập nhật cơ sở "${BuildingName || id}"`, req.ip);
        res.json({ success: true, data: result.recordset[0] });
    } catch (err) {
        next(err);
    }
};

export const deleteBuilding = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pool = await getPool();
        
        // Kiểm tra xem cơ sở có dữ liệu tầng/khu vực con không
        const checkFloors = await pool.request().input('BuildingID', sql.Int, id).query('SELECT TOP 1 FloorID FROM Floors WHERE BuildingID = @BuildingID');
        if (checkFloors.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xoá cơ sở vì đang có tầng hoặc dữ liệu bên trong.' });
        }

        await pool.request().input('BuildingID', sql.Int, id).query('DELETE FROM Buildings WHERE BuildingID = @BuildingID');
        await logAudit(pool, req.user, 'Delete', 'Cơ sở', `Xoá cơ sở ID ${id}`, req.ip);
        res.json({ success: true, data: { BuildingID: Number(id) } });
    } catch (err) {
        next(err);
    }
};

export const getAuditLogs = async (req, res, next) => {
    try {
        const { search, action } = req.query;
        let query = 'SELECT * FROM AuditLogs WHERE 1=1';
        const pool = await getPool();
        const request = pool.request();
        
        if (search) {
            query += ' AND (UserName LIKE @Search OR Description LIKE @Search OR Target LIKE @Search)';
            request.input('Search', sql.NVarChar(100), `%${search}%`);
        }
        if (action) {
            query += ' AND Action = @Action';
            request.input('Action', sql.NVarChar(50), action);
        }
        query += ' ORDER BY CreatedAt DESC';
        
        const result = await request.query(query);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        next(err);
    }
};

const logAudit = async (pool, user, action, target, description, ip) => {
    try {
        await pool.request()
            .input('UserID', sql.Int, user?.UserID || null)
            .input('UserName', sql.NVarChar(100), user?.FullName || 'Hệ thống')
            .input('RoleName', sql.NVarChar(50), user?.RoleName || 'Admin')
            .input('Action', sql.NVarChar(50), action)
            .input('Target', sql.NVarChar(100), target)
            .input('Description', sql.NVarChar(500), description)
            .input('IpAddress', sql.NVarChar(45), ip)
            .query(`
                INSERT INTO AuditLogs (UserID, UserName, RoleName, Action, Target, Description, IpAddress)
                VALUES (@UserID, @UserName, @RoleName, @Action, @Target, @Description, @IpAddress)
            `);
    } catch (err) {
        console.error('Audit Log Error:', err);
    }
};
