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
import env from "./util/validateEnv";
import { requiresAuth } from "./middleware/auth";

const app = express();

app.use(morgan("dev"));

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", env.FRONT_URL],
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
      sameSite: "none",
      maxAge: 60 * 60 * 1000,
    },
    rolling: true,
    store: MongoStore.create({
      mongoUrl: env.MONGO_CONNECTION_STRING,
    }),
  })
);

app.use("/api/notes", requiresAuth, notesRoutes);
app.use("/api/products", requiresAuth, productsRoutes);
app.use("/api/stores", requiresAuth, storeRoutes);
app.use("/api/users", usersRoutes);

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
