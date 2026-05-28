// src/test/testAllApi.js
// Test auth flow + common endpoints
// Chạy:
//   node src/test/testAllApi.js
// hoặc thêm script:
//   "test-api": "node src/test/testAllApi.js"
// rồi chạy:
//   yarn test-api

import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
    timeout: 10000,
    withCredentials: true,
});

// Cookie jar đơn giản cho Node.js
const cookieStore = new Map();

function saveCookies(setCookieHeaders) {
    if (!setCookieHeaders) return;

    for (const cookieText of setCookieHeaders) {
        const firstPart = cookieText.split(";")[0];
        const [name, ...valueParts] = firstPart.split("=");
        const value = valueParts.join("=");

        if (!name) continue;

        if (!value) {
            cookieStore.delete(name.trim());
        } else {
            cookieStore.set(name.trim(), value);
        }
    }
}

function getCookieHeader() {
    return [...cookieStore.entries()]
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
}

api.interceptors.response.use((res) => {
    saveCookies(res.headers["set-cookie"]);
    return res;
});

api.interceptors.request.use((config) => {
    const cookieHeader = getCookieHeader();

    if (cookieHeader) {
        config.headers.Cookie = cookieHeader;
    }

    return config;
});

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

const testUser = {
    fullName: "Test User",
    email: "testuser_999@email.com",
    password: "123456",
    confirmPassword: "123456",
    phoneNumber: "0909999999",
};

// =============================================================================
// AUTH TESTS
// =============================================================================

async function testHealth() {
    try {
        const res = await api.get("/health");
        ok("GET /health", res.data);
    } catch (e) {
        fail("GET /health", e);
    }
}

async function testRegister() {
    try {
        const res = await api.post("/auth/register", testUser);
        ok("POST /auth/register", res.data);
    } catch (e) {
        if (e.response?.status === 409) {
            console.log("⚠️  POST /auth/register — email đã tồn tại, bỏ qua");
        } else {
            fail("POST /auth/register", e);
        }
    }
}

async function testLogin() {
    try {
        const res = await api.post("/auth/login", {
            email: testUser.email,
            password: testUser.password,
        });

        ok("POST /auth/login", {
            message: res.data.message,
            user: res.data.data?.user,
            cookies: getCookieHeader() ? "Cookie received" : "No cookie",
        });

        return res.data.data?.user;
    } catch (e) {
        fail("POST /auth/login", e);
    }
}

async function testLoginWrongPassword() {
    try {
        const res = await api.post("/auth/login", {
            email: testUser.email,
            password: "wrongpassword",
        });

        console.log("⚠️  testLoginWrongPassword nên 401 nhưng trả:", res.status);
    } catch (e) {
        if (e.response?.status === 401) {
            ok("POST /auth/login sai password → 401 đúng", e.response.data);
        } else {
            fail("POST /auth/login sai password", e);
        }
    }
}

async function testLoginNotFound() {
    try {
        const res = await api.post("/auth/login", {
            email: "notexist@email.com",
            password: "123456",
        });

        console.log("⚠️  testLoginNotFound nên 401 nhưng trả:", res.status);
    } catch (e) {
        if (e.response?.status === 401) {
            ok("POST /auth/login email không tồn tại → 401 đúng", e.response.data);
        } else {
            fail("POST /auth/login email không tồn tại", e);
        }
    }
}

async function testGetMe() {
    try {
        const res = await api.get("/auth/me");
        ok("GET /auth/me", res.data.data);
    } catch (e) {
        fail("GET /auth/me", e);
    }
}

async function testRefreshToken() {
    try {
        const res = await api.post("/auth/refresh");

        ok("POST /auth/refresh", {
            message: res.data.message,
            cookies: getCookieHeader() ? "Cookie refreshed" : "No cookie",
        });
    } catch (e) {
        fail("POST /auth/refresh", e);
    }
}

async function testLogout() {
    try {
        const res = await api.post("/auth/logout");
        ok("POST /auth/logout", res.data);
    } catch (e) {
        fail("POST /auth/logout", e);
    }
}

async function testGetMeAfterLogout() {
    try {
        const res = await api.get("/auth/me");
        console.log("⚠️  GET /auth/me sau logout nên 401 nhưng trả:", res.status);
    } catch (e) {
        if (e.response?.status === 401) {
            ok("GET /auth/me sau logout → 401 đúng", e.response.data);
        } else {
            fail("GET /auth/me sau logout", e);
        }
    }
}

async function testForgotPassword() {
    try {
        const res = await api.post("/auth/forgot-password", {
            email: testUser.email,
        });

        ok("POST /auth/forgot-password", res.data);
    } catch (e) {
        fail("POST /auth/forgot-password", e);
    }
}

// =============================================================================
// VALIDATION TESTS
// =============================================================================

async function testRegisterValidation() {
    try {
        await api.post("/auth/register", {
            fullName: "",
            email: "bad-email",
            password: "123",
        });

        console.log("⚠️  Register validation nên fail nhưng không fail");
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

        console.log("⚠️  Login validation nên fail nhưng không fail");
    } catch (e) {
        if (e.response?.status === 400) {
            ok("POST /auth/login validation → 400 đúng", e.response.data);
        } else {
            fail("POST /auth/login validation", e);
        }
    }
}

async function testSocialValidation() {
    try {
        await api.post("/auth/google", {});

        console.log("⚠️  Social validation nên fail nhưng không fail");
    } catch (e) {
        if (e.response?.status === 400) {
            ok("POST /auth/google validation → 400 đúng", e.response.data);
        } else {
            fail("POST /auth/google validation", e);
        }
    }
}

async function testCheckInValidation() {
    try {
        await api.post("/sessions/check-in", {
            driverId: "abc",
            plateNumber: "bad",
            vehicleTypeId: 1,
            slotId: 1,
        });

        console.log("⚠️  Check-in validation nên fail nhưng không fail");
    } catch (e) {
        if ([400, 401, 403].includes(e.response?.status)) {
            ok("POST /sessions/check-in validation/protected → đúng", e.response.data);
        } else {
            fail("POST /sessions/check-in validation", e);
        }
    }
}

// =============================================================================
// COMMON TESTS
// =============================================================================

async function reLogin() {
    try {
        const res = await api.post("/auth/login", {
            email: testUser.email,
            password: testUser.password,
        });

        ok("Re-login", {
            message: res.data.message,
            user: res.data.data?.user,
        });
    } catch (e) {
        fail("Re-login", e);
    }
}

async function testGetRoles() {
    try {
        const res = await api.get("/roles");
        ok("GET /roles", res.data.data);
    } catch (e) {
        fail("GET /roles", e);
    }
}

async function testGetVehicleTypes() {
    try {
        const res = await api.get("/vehicle-types");
        ok("GET /vehicle-types", res.data.data);
    } catch (e) {
        fail("GET /vehicle-types", e);
    }
}

async function testGetBuildings() {
    try {
        const res = await api.get("/buildings");
        ok("GET /buildings", res.data.data);
    } catch (e) {
        fail("GET /buildings", e);
    }
}

async function testGetSlots() {
    try {
        const res = await api.get("/slots");
        ok("GET /slots", res.data.data?.slice(0, 3));
    } catch (e) {
        fail("GET /slots", e);
    }
}

// =============================================================================
// MAIN
// =============================================================================

async function runAll() {
    console.log("⏳ Chờ server khởi động...\n");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    section("0. HEALTH");
    await testHealth();

    section("1. REGISTER");
    await testRegister();

    section("2. LOGIN");
    await testLogin();
    await testLoginWrongPassword();
    await testLoginNotFound();

    section("3. GET ME");
    await testGetMe();

    section("4. REFRESH TOKEN");
    await testRefreshToken();
    await testGetMe();

    section("5. LOGOUT");
    await testLogout();
    await testGetMeAfterLogout();

    section("6. FORGOT PASSWORD");
    await testForgotPassword();

    section("7. VALIDATION");
    await testRegisterValidation();
    await testLoginValidation();
    await testSocialValidation();

    section("8. COMMON ENDPOINTS");
    await reLogin();
    await Promise.all([
        testGetRoles(),
        testGetVehicleTypes(),
        testGetBuildings(),
        testGetSlots(),
    ]);

    section("9. PROTECTED VALIDATION");
    await testCheckInValidation();

    console.log("\n✅ Done!\n");
}

runAll();