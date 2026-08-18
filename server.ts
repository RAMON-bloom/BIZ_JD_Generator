import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { analyzeJobDescription } from "./services/extractionService";
import { generateScoutMessage, generateScoutSubjects } from "./services/scoutService";

const _filename = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const _dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(_filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON request bodies
  app.use(express.json({ limit: "15mb" }));

  // API Route for extracting job information
  app.post("/api/extract", async (req, res) => {
    try {
      const { jobText, fields, useSearch } = req.body;
      if (!jobText || typeof jobText !== "string" || !jobText.trim()) {
        res.status(400).json({ error: "求人情報テキストが入力されていません。" });
        return;
      }
      if (!Array.isArray(fields) || fields.length === 0) {
        res.status(400).json({ error: "抽出項目の設定が不正です。" });
        return;
      }

      const { data, sources } = await analyzeJobDescription(jobText, fields, useSearch !== false);
      res.json({ data, sources });
    } catch (err: any) {
      console.error("API error during job description extraction:", err);
      res.status(500).json({ error: err.message || "求人情報の抽出に失敗しました。" });
    }
  });

  // API Route for generating a scout message
  app.post("/api/scout-message", async (req, res) => {
    try {
      const { candidateExperience, candidateDesiredRole, jobInfo, fixedPhrases, promptSections, knowledge } = req.body;
      if (!jobInfo || typeof jobInfo !== "string" || !jobInfo.trim()) {
        res.status(400).json({ error: "求人情報が提供されていません。" });
        return;
      }
      const sections = await generateScoutMessage(
        candidateExperience || "",
        candidateDesiredRole || "",
        jobInfo,
        fixedPhrases || [],
        promptSections || [],
        knowledge || { subjects: [], structures: [] }
      );
      res.json({ sections });
    } catch (err: any) {
      console.error("API error during scout message generation:", err);
      res.status(500).json({ error: err.message || "スカウト本文の生成に失敗しました。" });
    }
  });

  // API Route for generating scout subject lines
  app.post("/api/scout-subjects", async (req, res) => {
    try {
      const { jobInfo, knowledge } = req.body;
      if (!jobInfo || typeof jobInfo !== "string" || !jobInfo.trim()) {
        res.status(400).json({ error: "求人情報が提供されていません。" });
        return;
      }
      const subjectsData = await generateScoutSubjects(jobInfo, knowledge || { subjects: [], structures: [] });
      res.json(subjectsData);
    } catch (err: any) {
      console.error("API error during scout subjects generation:", err);
      res.status(500).json({ error: err.message || "件名の生成に失敗しました。" });
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
