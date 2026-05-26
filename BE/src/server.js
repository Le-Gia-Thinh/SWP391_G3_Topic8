import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import corsOptions from "./config/corsOptions.js";
import router from "./routes/index.js";
import { errorHandlingMiddleware } from "./middlewares/errorHandler.js";
const app = express();

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Parking Building Management API is running",
    });
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api", router);

app.use(errorHandlingMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});