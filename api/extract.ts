import { analyzeJobDescription } from "../services/extractionService.js";
import { verifyGoogleIdToken, extractBearerToken } from "../server/auth.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const idToken = extractBearerToken(req.headers.authorization);
  if (!idToken) {
    res.status(401).json({ error: "ログインが必要です。" });
    return;
  }
  try {
    await verifyGoogleIdToken(idToken);
  } catch (error: any) {
    res.status(401).json({ error: error.message || "認証に失敗しました。再度ログインしてください。" });
    return;
  }

  try {
    const { jobText, fields, useSearch } = req.body ?? {};
    if (!jobText || typeof jobText !== "string" || !jobText.trim()) {
      res.status(400).json({ error: "求人情報テキストが入力されていません。" });
      return;
    }
    if (!Array.isArray(fields) || fields.length === 0) {
      res.status(400).json({ error: "抽出項目の設定が不正です。" });
      return;
    }

    const { data, sources } = await analyzeJobDescription(jobText, fields, useSearch !== false);
    res.status(200).json({ data, sources });
  } catch (err: any) {
    console.error("API error during job description extraction:", err);
    res.status(500).json({ error: err.message || "求人情報の抽出に失敗しました。" });
  }
}
