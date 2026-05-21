import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5000/api", timeout: 5000 });

function logOk(name, data) { console.log(`✅ ${name}:`, JSON.stringify(data, null, 2)); }
function logErr(name, err) {
    console.error(`❌ ${name}:`);
    console.error("   status :", err.response?.status);
    console.error("   data   :", err.response?.data);
    console.error("   message:", err.message);
    console.error("   code   :", err.code);
}

// ── Common ──────────────────────────────────────────────────
async function testRoles() { try { logOk("GET /roles", (await api.get("/roles")).data); } catch (e) { logErr("GET /roles", e); } }
async function testVehicleTypes() { try { logOk("GET /vehicle-types", (await api.get("/vehicle-types")).data); } catch (e) { logErr("GET /vehicle-types", e); } }
async function testBuildings() { try { logOk("GET /buildings", (await api.get("/buildings")).data); } catch (e) { logErr("GET /buildings", e); } }
async function testSlots() { try { logOk("GET /slots", (await api.get("/slots")).data); } catch (e) { logErr("GET /slots", e); } }

// ── Report ──────────────────────────────────────────────────
async function testDashboard() { try { logOk("GET /dashboard", (await api.get("/reports/dashboard")).data); } catch (e) { logErr("GET /dashboard", e); } }

// ── Reservations ────────────────────────────────────────────
async function testGetReservations() { try { logOk("GET /reservations", (await api.get("/reservations")).data); } catch (e) { logErr("GET /reservations", e); } }
async function testCreateReservation() {
    try {
        const res = await api.post("/reservations", {
            driverId: 1, vehicleTypeId: 1, slotId: 1,
            reservationDate: "2026-05-21",
            startTime: "2026-05-21T08:00:00",
            endTime: "2026-05-21T10:00:00",
        });
        logOk("POST /reservations", res.data);
    } catch (e) { logErr("POST /reservations", e); }
}

// ── Sessions ────────────────────────────────────────────────
async function testGetSessions() { try { logOk("GET /sessions", (await api.get("/sessions")).data); } catch (e) { logErr("GET /sessions", e); } }
async function testCheckIn() {
    try {
        const res = await api.post("/sessions/check-in", {
            driverId: 1, plateNumber: "51A-12345", vehicleTypeId: 1, slotId: 2
            /* Giải thích tại sao :lỗi 500  POST /check-in:
                data: { success: false, message: 'Slot not available.' }
                    Slot 2 (A-M-02) đang Occupied — bạn thấy trong kết quả GET /slots:
                    json{ "SlotID": 2, "SlotCode": "A-M-02", "SlotStatus": "Occupied" }
                    Stored procedure sp_CheckInVehicle kiểm tra slot phải Available mới cho check-in. Fix đơn giản — đổi slotId sang slot đang Available trong testAllApi.js:
                    javascriptasync function testCheckIn() {
                    try {
                        const res = await api.post("/sessions/check-in", {
                        driverId: 1,
                        plateNumber: "51A-12345",
                        vehicleTypeId: 1,
                        slotId: 5,  // ✅ đổi từ 2 → 5 (A-M-05, Status: Available, VehicleType: MOTORBIKE)
                        });
                        logOk("POST /check-in", res.data);
                        return res.data.session?.SessionID;
                    } catch(e) { logErr("POST /check-in", e); }
                    }

                    Các slot Available phù hợp để test theo từng loại xe:
                    SlotIDSlotCodeVehicleTypeGhi chú5A-M-05MOTORBIKE✅ dùng cái này10A-C-05CARnếu muốn test xe hơi11-15B-M-01~05MOTORBIKEtầng 2*/
        });
        logOk("POST /check-in", res.data);
        return res.data.session?.SessionID; // ✅ trả sessionId cho checkOut
    } catch (e) { logErr("POST /check-in", e); }
}
async function testCheckOut(sessionId) {
    try {
        const res = await api.post("/sessions/check-out", {
            sessionId: sessionId ?? 1, paymentMethod: "Cash"
        });
        logOk("POST /check-out", res.data);
    } catch (e) { logErr("POST /check-out", e); }
}

// ── Run all ─────────────────────────────────────────────────
async function runAll() {
    console.log("\n⏳ Chờ server...\n");
    await new Promise(r => setTimeout(r, 2000));

    console.log("═══ COMMON ═══════════════════");
    // ✅ Promise.all: 4 GET không phụ thuộc nhau → chạy song song
    await Promise.all([testRoles(), testVehicleTypes(), testBuildings(), testSlots()]);

    console.log("\n═══ REPORT ═══════════════════");
    await testDashboard();

    console.log("\n═══ RESERVATIONS ═════════════");
    await testGetReservations();
    await testCreateReservation(); // phải tuần tự vì ghi DB

    console.log("\n═══ SESSIONS ═════════════════");
    await testGetSessions();
    const sessionId = await testCheckIn();   // check-in trước
    await testCheckOut(sessionId);           // check-out sau, cần sessionId

    console.log("\n✅ Done!\n");
}

runAll();