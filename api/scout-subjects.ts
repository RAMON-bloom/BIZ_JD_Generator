import { generateScoutSubjects } from "../services/scoutService.js";
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
    const { jobInfo, knowledge } = req.body ?? {};

    if (!jobInfo || typeof jobInfo !== "string" || !jobInfo.trim()) {
      res.status(400).json({ error: "求人情報が提供されていません。" });
      return;
    }

    const subjectsData = await generateScoutSubjects(jobInfo, knowledge || { subjects: [], structures: [] });
    res.status(200).json(subjectsData);
  } catch (err: any) {
    console.error("API error during scout subjects generation:", err);
    res.status(500).json({ error: err.message || "件名の生成に失敗しました。" });
  }
}
