// corsOptions: cấu hình CORS cho phép FE gửi cookie
//
// Tại sao cần cấu hình CORS riêng?
//   - Mặc định browser chặn cookie cross-origin
//   - credentials: true → cho phép cookie gửi kèm request
//   - origin phải chỉ định rõ domain (không dùng * khi có credentials)
//
// Sơ đồ:
//   FE (localhost:3000) → gửi request kèm cookie → BE (localhost:5000)
//   CORS kiểm tra origin → nếu trong whitelist → cho phép
//   credentials: true → browser chấp nhận set-cookie từ BE

const allowedOrigins = [
  process.env.FE_ORIGIN || "http://localhost:3000",
  "http://localhost:5173",   // Vite dev server
  "http://localhost:3001",   // fallback
];

const corsOptions = {
  // Kiểm tra origin có trong whitelist không
  origin: (origin, callback) => {
    // Cho phép request không có origin (Postman, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin} not allowed`));
    }
  },

  // Bắt buộc để cookie gửi được từ FE
  // FE phải set: axios.defaults.withCredentials = true
  // hoặc: fetch(url, { credentials: "include" })
  credentials: true,

  // Các method được phép
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // Các header FE được phép gửi
  allowedHeaders: ["Content-Type", "Authorization"],
};

export default corsOptions;