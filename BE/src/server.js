import express      from "express";
import cors         from "cors";
import dotenv       from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();

import corsOptions from "./config/corsOptions.js";
import router      from "./routes/index.js";


import { errorHandlingMiddleware } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/api", router);
app.use(errorHandlingMiddleware); // luôn để cuối

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));