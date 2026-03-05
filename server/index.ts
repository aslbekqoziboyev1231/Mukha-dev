import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.ts";
import authRoutes from "./routes/auth.ts";
import chatRoutes from "./routes/chat.ts";
import knowledgeRoutes from "./routes/knowledge.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Connect to Database
  await connectDB();

  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/messages", chatRoutes);
  app.use("/api/knowledge", knowledgeRoutes);

  // Serve frontend
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve from the dist folder which is in the root
    const distPath = path.join(__dirname, "../dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
