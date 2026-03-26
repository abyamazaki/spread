import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/error-handler";
import authRoutes from "./routes/auth";
import sheetsRoutes from "./routes/sheets";
import rowsRoutes from "./routes/rows";
import lockedColumnsRoutes from "./routes/locked-columns";
import changeRequestsRoutes from "./routes/change-requests";
import usersRoutes from "./routes/users";
import adminRoutes from "./routes/admin";
import profileRoutes from "./routes/profile";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
  })
);

app.onError(errorHandler);

app.get("/healthz", (c) => c.json({ status: "ok" }));

// Mount all routes
app.route("/", authRoutes);
app.route("/", sheetsRoutes);
app.route("/", rowsRoutes);
app.route("/", lockedColumnsRoutes);
app.route("/", changeRequestsRoutes);
app.route("/", usersRoutes);
app.route("/", adminRoutes);
app.route("/", profileRoutes);

const port = parseInt(process.env.PORT || "3001");
console.log(`API server running on port ${port}`);
serve({ fetch: app.fetch, port });
