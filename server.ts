import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { analyzeJobDescription } from "./services/geminiService";

const _filename = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const _dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(_filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON request bodies
  app.use(express.json({ limit: "15mb" }));

  // API Route for analyzing the job description
  app.post("/api/analyze", async (req, res) => {
    try {
      const { jobText, useSearch } = req.body;
      if (!jobText || typeof jobText !== "string" || !jobText.trim()) {
        res.status(400).json({ error: "求人情報テキストが入力されていません。" });
        return;
      }
      
      const { data, sources } = await analyzeJobDescription(jobText, useSearch);
      res.json({ data, sources });
    } catch (err: any) {
      console.error("API error during job description analysis:", err);
      res.status(500).json({ error: err.message || "求人情報の分析に失敗しました。" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
