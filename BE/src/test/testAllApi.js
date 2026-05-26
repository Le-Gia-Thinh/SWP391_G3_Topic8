
// src/test/testAllApi.js
// Test toàn bộ auth flow + các endpoint hiện có
// Chạy: yarn test  hoặc  node src/test/testAllApi.js

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true, // gửi kèm cookie
});

// ── Lưu token giữa các bước ──────────────────────────────────────────────────
let accessToken   = null;
let cookieJar     = "";   // lưu Set-Cookie thô để gửi lại

// Intercept response: lưu cookie từ server
api.interceptors.response.use((res) => {
  const setCookie = res.headers["set-cookie"];
  if (setCookie) cookieJar = setCookie.join("; ");
  return res;
});

// Intercept request: đính cookie + Authorization header
api.interceptors.request.use((config) => {
  if (cookieJar) config.headers["Cookie"] = cookieJar;
  if (accessToken) config.headers["Authorization"] = `Bearer ${accessToken}`;
  return config;
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function ok(label, data) {
  console.log(`✅ ${label}`);
  console.log("   ", JSON.stringify(data, null, 2).split("\n").join("\n    "));
}

function fail(label, err) {
  console.error(`❌ ${label}`);
  console.error("    status :", err.response?.status);
  console.error("    data   :", JSON.stringify(err.response?.data));
  console.error("    msg    :", err.message);
}

function section(title) {
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  ${title}`);
  console.log("═".repeat(50));
}

// =============================================================================
// AUTH TESTS
// =============================================================================

// 1. Register — tạo tài khoản mới (sẽ fail nếu email đã tồn tại, bỏ qua)
async function testRegister() {
  try {
    const res = await api.post("/auth/register", {
      fullName:    "Test User",
      email:       "testuser_999@email.com",
      password:    "123456",
      phoneNumber: "0909999999",
    });
    ok("POST /auth/register", res.data);
  } catch (e) {
    if (e.response?.status === 409) {
      console.log("⚠️  POST /auth/register — email đã tồn tại (bỏ qua, bình thường)");
    } else {
      fail("POST /auth/register", e);
    }
  }
}

// 2. Login — dùng data có sẵn trong DB (alice@email.com)
// NOTE: alice chưa có PasswordHash hợp lệ vì sample data dùng 'hash_alice' (không phải bcrypt)
// → test với tài khoản vừa register ở bước 1
async function testLogin() {
  try {
    const res = await api.post("/auth/login", {
      email:    "testuser_999@email.com",
      password: "123456",
    });
    accessToken = res.data.accessToken; // lưu cho các request sau
    ok("POST /auth/login", {
      message:     res.data.message,
      accessToken: accessToken?.slice(0, 30) + "...",
      user:        res.data.data?.user,
    });
    return res.data.data?.user;
  } catch (e) {
    fail("POST /auth/login", e);
  }
}

// 2b. Login sai password — expect 401
async function testLoginWrongPassword() {
  try {
    const res = await api.post("/auth/login", {
      email:    "testuser_999@email.com",
      password: "wrongpassword",
    });
    console.log("⚠️  testLoginWrongPassword nên 401 nhưng trả:", res.status);
  } catch (e) {
    if (e.response?.status === 401) {
      ok("POST /auth/login (sai password) → 401 đúng", e.response.data);
    } else {
      fail("POST /auth/login (sai password)", e);
    }
  }
}

// 2c. Login email không tồn tại — expect 401
async function testLoginNotFound() {
  try {
    const res = await api.post("/auth/login", {
      email:    "notexist@email.com",
      password: "123456",
    });
    console.log("⚠️  testLoginNotFound nên 401 nhưng trả:", res.status);
  } catch (e) {
    if (e.response?.status === 401) {
      ok("POST /auth/login (email không tồn tại) → 401 đúng", e.response.data);
    } else {
      fail("POST /auth/login (email không tồn tại)", e);
    }
  }
}

// 3. GET /auth/me — cần accessToken hợp lệ
async function testGetMe() {
  try {
    const res = await api.get("/auth/me");
    ok("GET /auth/me", res.data.data);
  } catch (e) { fail("GET /auth/me", e); }
}

// 4. Refresh token — dùng refreshToken cookie (tự động gửi nhờ cookieJar)
async function testRefreshToken() {
  try {
    // Xóa accessToken cũ để simulate hết hạn
    const oldToken = accessToken;
    accessToken = null;

    const res = await api.post("/auth/refresh");
    accessToken = res.data.accessToken; // cập nhật token mới
    ok("POST /auth/refresh", {
      newAccessToken: accessToken?.slice(0, 30) + "...",
    });
  } catch (e) { fail("POST /auth/refresh", e); }
}

// 5. Logout
async function testLogout() {
  try {
    const res = await api.post("/auth/logout");
    accessToken = null;
    ok("POST /auth/logout", res.data);
  } catch (e) { fail("POST /auth/logout", e); }
}

// 6. GET /auth/me sau logout — expect 401
async function testGetMeAfterLogout() {
  try {
    const res = await api.get("/auth/me");
    console.log("⚠️  testGetMeAfterLogout nên 401 nhưng trả:", res.status);
  } catch (e) {
    if (e.response?.status === 401) {
      ok("GET /auth/me (sau logout) → 401 đúng", e.response.data);
    } else {
      fail("GET /auth/me (sau logout)", e);
    }
  }
}

// 7. Forgot password
async function testForgotPassword() {
  try {
    const res = await api.post("/auth/forgot-password", {
      email: "testuser_999@email.com",
    });
    ok("POST /auth/forgot-password", res.data);
  } catch (e) { fail("POST /auth/forgot-password", e); }
}

// =============================================================================
// COMMON TESTS (cần đăng nhập lại trước)
// =============================================================================

async function reLogin() {
  try {
    const res = await api.post("/auth/login", {
      email:    "testuser_999@email.com",
      password: "123456",
    });
    accessToken = res.data.accessToken;
    console.log("🔄 Re-login thành công");
  } catch (e) { fail("Re-login", e); }
}

async function testGetRoles() {
  try {
    const res = await api.get("/roles");
    ok("GET /roles", res.data.data);
  } catch (e) { fail("GET /roles", e); }
}

async function testGetVehicleTypes() {
  try {
    const res = await api.get("/vehicle-types");
    ok("GET /vehicle-types", res.data.data);
  } catch (e) { fail("GET /vehicle-types", e); }
}

async function testGetBuildings() {
  try {
    const res = await api.get("/buildings");
    ok("GET /buildings", res.data.data);
  } catch (e) { fail("GET /buildings", e); }
}

async function testGetSlots() {
  try {
    const res = await api.get("/slots");
    ok("GET /slots", res.data.data?.slice(0, 3)); // in 3 slot đầu
  } catch (e) { fail("GET /slots", e); }
}

// =============================================================================
// VALIDATION TESTS
// =============================================================================

async function testRegisterValidation() {
  try {
    await api.post("/auth/register", { email: "bad-email", password: "123" });
    console.log("⚠️  Validation nên fail nhưng không fail");
  } catch (e) {
    if (e.response?.status === 400) {
      ok("POST /auth/register validation → 400 đúng", e.response.data);
    } else {
      fail("POST /auth/register validation", e);
    }
  }
}

async function testLoginValidation() {
  try {
    await api.post("/auth/login", {});
    console.log("⚠️  Validation nên fail nhưng không fail");
  } catch (e) {
    if (e.response?.status === 400) {
      ok("POST /auth/login validation → 400 đúng", e.response.data);
    } else {
      fail("POST /auth/login validation", e);
    }
  }
}

// =============================================================================
// MAIN
// =============================================================================
async function runAll() {
  console.log("⏳ Chờ server khởi động...\n");
  await new Promise((r) => setTimeout(r, 1500));

  // ── Auth Flow ──────────────────────────────────────────────────────────────
  section("1. REGISTER");
  await testRegister();

  section("2. LOGIN");
  await testLogin();
  await testLoginWrongPassword();
  await testLoginNotFound();

  section("3. GET ME (authenticated)");
  await testGetMe();

  section("4. REFRESH TOKEN");
  await testRefreshToken();
  await testGetMe(); // dùng token mới

  section("5. LOGOUT");
  await testLogout();
  await testGetMeAfterLogout();

  section("6. FORGOT PASSWORD");
  await testForgotPassword();

  // ── Validation ─────────────────────────────────────────────────────────────
  section("7. VALIDATION ERRORS");
  await testRegisterValidation();
  await testLoginValidation();

  // ── Common (cần login lại) ─────────────────────────────────────────────────
  section("8. COMMON ENDPOINTS");
  await reLogin();
  await Promise.all([
    testGetRoles(),
    testGetVehicleTypes(),
    testGetBuildings(),
    testGetSlots(),
  ]);

  console.log("\n✅ Done!\n");
}

runAll();
