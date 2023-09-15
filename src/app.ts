import "dotenv/config";
import morgan from "morgan";
import cors from "cors";
import express, { NextFunction, Response, Request } from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import createHttpError, { isHttpError } from "http-errors";
import notesRoutes from "./routes/notes";
import productsRoutes from "./routes/products";
import storeRoutes from "./routes/stores";
import usersRoutes from "./routes/users";
import authRoutes from "./routes/auth";
import mapRoutes from "./routes/map";
import reportsRoutes from "./routes/reports";
import notificationRoutes from "./routes/notification";
import shoppingListRoutes from "./routes/shoppingList";
import shoppingListHistoryRoutes from "./routes/shoppingListHistory";
import env from "./util/validateEnv";
import { verifyJWT } from "./middleware/verifyJWT";
import cookieParser from "cookie-parser";

const app = express();

app.use(morgan("dev"));

app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:3000",
      env.FRONT_URL,
      "https://local-shop-web.vercel.app",
      "https://local-shop-fsqv2acfp-ricopomps.vercel.app",
      "https://local-shop-web-git-master-ricopomps.vercel.app",
      "https://local-shop-qgtkoqzbv-ricopomps.vercel.app",
      "/.vercel.app$/",
    ],
    methods: ["POST", "PUT", "PATCH", "GET", "OPTIONS", "HEAD", "DELETE"],
  })
);

app.use(express.json());

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 60 * 1000,
    },
    rolling: true,
    store: MongoStore.create({
      mongoUrl: env.MONGO_CONNECTION_STRING,
    }),
  })
);

app.use(cookieParser());

app.use("/api/notes", verifyJWT, notesRoutes);
app.use("/api/products", verifyJWT, productsRoutes);
app.use("/api/stores", verifyJWT, storeRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/shoppinglist", verifyJWT, shoppingListRoutes);
app.use("/api/shoppingListHistory", verifyJWT, shoppingListHistoryRoutes);
app.use("/api/map", verifyJWT, mapRoutes);
app.use("/api/notifications", verifyJWT, notificationRoutes);
app.use("/api/reports", verifyJWT, reportsRoutes);

app.use((req, res, next) => {
  next(createHttpError(404, "Rota não encontrada"));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  let errorMessage = "Um erro inesperado aconteceu";
  let statusCode = 500;
  if (isHttpError(error)) {
    statusCode = error.status;
    errorMessage = error.message;
  }
  res.status(statusCode).json({ error: errorMessage });
});

export default app;
