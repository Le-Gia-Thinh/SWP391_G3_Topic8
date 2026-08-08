import { getPool } from '../src/config/db.js'

async function run() {
    const pool = await getPool()
    console.log('🔄 Cleaning up BuildingAssignments in Database...')

    // Lấy UserID của Bob Staff
    const userRes = await pool.request().query("SELECT UserID, FullName, Email FROM Users WHERE Email = 'bob@email.com'")
    const bob = userRes.recordset[0]
    if (bob) {
        console.log(`Found Bob: UserID=${bob.UserID}, Email=${bob.Email}`)
        // Xóa các phân công phụ của Bob, chỉ giữ phân công Tòa 1 (IsPrimary = 1)
        await pool.request()
            .input('bobId', bob.UserID)
            .query("DELETE FROM BuildingAssignments WHERE UserID = @bobId AND BuildingID <> 1")
        console.log(`✅ Fixed Bob Staff building assignment to BuildingID = 1 only.`)
    }

    // Đảm bảo mỗi Staff/User chỉ giữ 1 bản ghi BuildingAssignments (uu tien IsPrimary = 1)
    await pool.request().query(`
        WITH CTE AS (
            SELECT AssignmentID, UserID, BuildingID, IsPrimary,
                   ROW_NUMBER() OVER (PARTITION BY UserID ORDER BY IsPrimary DESC, AssignmentID ASC) as rn
            FROM BuildingAssignments
        )
        DELETE FROM CTE WHERE rn > 1;
    `)
    console.log('✅ Cleaned duplicate building assignments for all users in Database.')

    const finalRes = await pool.request().query(`
        SELECT ba.AssignmentID, ba.UserID, u.FullName, u.Email, ba.BuildingID, b.BuildingName, ba.IsPrimary
        FROM BuildingAssignments ba
        JOIN Users u ON ba.UserID = u.UserID
        JOIN Buildings b ON ba.BuildingID = b.BuildingID
        ORDER BY ba.UserID
    `)
    console.log('📌 Current Building Assignments:', finalRes.recordset)
    process.exit(0)
}

run().catch(err => {
    console.error('❌ Error executing fix:', err)
    process.exit(1)
})
