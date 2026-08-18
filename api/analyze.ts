import { analyzeJobDescription } from "../services/geminiService.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const { jobText, useSearch } = req.body ?? {};
    if (!jobText || typeof jobText !== "string" || !jobText.trim()) {
      res.status(400).json({ error: "求人情報テキストが入力されていません。" });
      return;
    }

    const { data, sources } = await analyzeJobDescription(jobText, useSearch);
    res.status(200).json({ data, sources });
  } catch (err: any) {
    console.error("API error during job description analysis:", err);
    res.status(500).json({ error: err.message || "求人情報の分析に失敗しました。" });
  }
}
