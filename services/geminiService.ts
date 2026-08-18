import { GoogleGenAI, Type } from "@google/genai";
import { JobData, Source } from '../types';

let aiInstance: GoogleGenAI | null = null;

const getAiInstance = (): GoogleGenAI => {
    if (!aiInstance) {
        const apiSecret = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiSecret) {
            throw new Error("GEMINI_API_KEY environment variable not set");
        }
        aiInstance = new GoogleGenAI({
            apiKey: apiSecret,
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build',
                }
            }
        });
    }
    return aiInstance;
};

// Define structure schema in Japanese
const jobDataSchema = {
    type: Type.OBJECT,
    properties: {
        companyName: { type: Type.STRING, description: "企業名" },
        departmentAndTitle: { type: Type.STRING, description: "部署・役職名。候補者に魅力的に見えるよう仕事内容や仕事の魅力と絡めたキャッチーな表記で【必ずおすすめ候補を3つ】作成し、箇条書き（行頭「・」）で出力してください。※企業名やサービス名は絶対に記載しないでください。" },
        jobDescription: { type: Type.STRING, description: "仕事内容。必ず【仕事内容】、【仕事の魅力】、【キャリア上の魅力】の3つのセクションを立て、各セクションの間には必ず1行の空行（改行）を挿入してください。セクション内は箇条書き（行頭に「・」を使用）で具体的に記述してください。" },
        workingConditions: { type: Type.STRING, description: "労働条件に関する情報（勤務時間、休日休暇、福利厚生など）。箇条書きで見やすく整理してください。" },
        workLocation: { type: Type.STRING, description: "勤務地" },
        remoteWork: { type: Type.STRING, description: "リモートワークの可否（例：可、不可、一部可など）" },
        passiveSmoking: { type: Type.STRING, description: "受動喫煙対策の有無" },
        jobCategory: { type: Type.STRING, description: "職種。スカウト媒体（スカウトサービス等）の選択項目となるカテゴリーから、求人内容に最も即したおすすめの職種を必ず3つ選び、箇条書き（行頭に「・」）で具体的に記述してください。" },
        industry: { type: Type.STRING, description: "業種。スカウト媒体（スカウトサービス等）の選択項目となるカテゴリーから、企業・求人情報に最も即したおすすめの業種・業界を必ず2つ選び、箇条書き（行頭に「・」）で具体的に記述してください。" },
        companyOverviewAndBenefits: { type: Type.STRING, description: "会社概要及び福利厚生（企業の特徴やビジョン、独自の制度、福利厚生などの魅力）" },
        companySize: { type: Type.STRING, description: "会社規模（社員数など）" },
        salaryRange: { type: Type.STRING, description: "給与レンジ" },
        requiredQualifications: { type: Type.STRING, description: "応募資格（必須）" },
        preferredQualifications: { type: Type.STRING, description: "応募資格（歓迎）" },
    },
    required: [
        "companyName", "departmentAndTitle", "jobDescription", "workingConditions", "workLocation",
        "remoteWork", "passiveSmoking", "jobCategory", "industry", "companyOverviewAndBenefits",
        "companySize", "salaryRange", "requiredQualifications", "preferredQualifications"
    ]
};

const jsonSchemaString = JSON.stringify({
    companyName: "企業名",
    departmentAndTitle: "部署・役職名（候補者に魅力的に見えるよう仕事内容や魅力と絡めたキャッチーな表記で【必ず候補を3つ】作成し、箇条書き（行頭「・」）で記述。※企業名やサービス名は絶対に記載しないこと）",
    jobDescription: "仕事内容(詳細がわかる具体記述。必ず【仕事内容】、【仕事の魅力】、【キャリア上の魅力】の項目を立てて箇条書きで具体記述してください。各項目の直後にコロン (:) は付けないでください)",
    workingConditions: "労働条件（勤務時間、休日休暇、福利厚生など。箇条書きで見やすく整理してください。）",
    workLocation: "勤務地",
    remoteWork: "リモートワーク（リモートワーク可否の記述、例：可、不可、一部可など。理由があればそれも記載）",
    passiveSmoking: "受動喫煙対策の有無",
    jobCategory: "職種（スカウト媒体の選択可能なカテゴリーから、求人内容に最も適した職種を3つ選定し箇条書きで記述。例：・IT／通信 > システムエンジニア など）",
    industry: "業種（スカウト媒体の選択可能なカテゴリーから、企業情報に最も適した業種を2つ選定し箇条書きで記述。例：・IT・インターネット > ソフトウェア など）",
    companyOverviewAndBenefits: "会社概要及び福利厚生（企業の特徴やビジョン、独自の制度、福利厚生などの魅力）",
    companySize: "会社規模(社員数・設立年・資本金など。不明な場合は「情報が見つかりませんでした」)",
    salaryRange: "給与レンジ",
    requiredQualifications: "応募資格（必須条件）",
    preferredQualifications: "応募資格（歓迎条件、あれば記載。無い場合は「情報が見つかりませんでした」）"
}, null, 2);

export const analyzeJobDescription = async (jobText: string, useSearch: boolean = true): Promise<{ data: JobData, sources: Source[] }> => {
    try {
        const prompt = `
あなたは優秀なリクルーティングアシスタントです。
以下の求人情報テキストを分析し、指定されたJSON形式で情報を整理・抽出してください。

# 指示
1.  まず、提供された「求人情報テキスト」を注意深く読み、各項目に該当する情報を抽出します。
2.  テキスト内に情報が不足している項目については、Web検索機能を活用して情報を探し、補完してください。
3.  給与レンジなど、検索しても情報が見つからない場合は、その項目に「情報が見つかりませんでした」と正直に記載してください。
4.  各項目の値には、抽出または検索した情報のみを含めてください。不要なメタデータや接頭辞（例: [Text, 6]）は含めないでください。
5.  最終的な出力は、必ず後述する「出力JSONフォーマット」に厳密に従った、単一の有効なJSONオブジェクトのみとしてください。説明文や\`\`\`jsonのようなマークダウンは一切含めないでください。
6.  **【最重要・言語の指定】**: 入力された元の「求人情報テキスト」や、Web検索の補完結果、会社情報が英語やその他の外国語で書かれている場合であっても、**すべての項目値（JSON内のすべてのテキスト・記述）は必ず流暢で自然な、正確な日本語に翻訳またはローカライズして回答してください**。英語のままで出力せず、適切な専門日本語（または一般的に使われるカタカナ表記）に変換してください。（例：\"Full-Time\" -> \"正社員\"、\"Remote\" -> \"在宅勤務・リモートワーク\"、\"Software Development\" -> \"ソフトウェア開発\"、\"Paid leaves\" -> \"有休休暇\" など）。ただし、一般的な固有名詞やプログラム名、技術用語（Java, AWS, Github, Slackなど）は元の表記で構いません。

# フォーマットに関する追加指示
-   **"departmentAndTitle"**: 部署・役職名は、求職者・候補者にとって魅力的に映るよう、仕事内容や仕事の魅力（担当領域、技術スタック、解決する課題、ポジションの重要性など）と絡めた訴求力のある表記を**【必ずおすすめ候補を3つ】**作成し、箇条書き（行頭に「・」）で提示してください。**【厳禁】企業名や具体的なサービス名は絶対に記載しないでください。**（例：\n・大規模トラフィックを支えるSREエンジニア\n・プロダクト成長を牽引するプロダクトマネージャー候補\n・組織の急速な事業拡大を支える人事スペシャリスト）
-   **"jobDescription"**: 以下の項目を立てて、各項目（セクション）の間には必ず1行の空行を挿入して見やすく改行し、箇条書き（行頭に「・」を使用）を織り交ぜながら具体的に記述してください。各項目の見出し（例: 【仕事内容】）の直後にはコロン（:）やその他の文字を絶対に付けず、見出し単独で1行にしてください。

    【仕事内容】
    ・具体的な業務内容
    ・役割と責任

    【仕事の魅力】
    ・本ポジションのやりがいや面白さ
    ・チーム環境、技術スタックなどの魅力

    【キャリア上の魅力】
    ・将来のキャリアパス
    ・成長機会、学べるスキル

-   **"workingConditions"**: 労働条件に関する情報を、項目ごとに適切な空行と箇条書き（行頭に「・」を使用）を使い、見やすく整理してください。（例：勤務時間、休日休暇、福利厚生など）
-   **"jobCategory"**: 受動喫煙対策の次に配置される生成項目です。主要なスカウト媒体（ビズリーチ、AMBI、Wantedly等）の選択項目として用意されている一般的な職種カテゴリーから、求人内容や企業情報に最も合致する職種を**【必ず3つ】**選定し、箇条書き（行頭「・」）で具体的に記述してください。（例：・IT／通信 > システムエンジニア、・オープン・Web系エンジニア、・ITコンサルタント）
-   **"industry"**: 職種の次に配置される生成項目です。主要なスカウト媒体の選択項目として用意されている一般的な業界カテゴリーから、企業や求人内容に最も合致する業種・業界を**【必ず2つ】**選定し、箇条書き（行頭「・」）で具体的に記述してください。（例：・IT・インターネット > ソフトウェア・Web、・コンサルティング・リサーチ）

# 求人情報テキスト
\`\`\`
${jobText}
\`\`\`

# 出力JSONフォーマット
${jsonSchemaString}
`;

        // Robust call function with multi-tier fallback strategy
        const callGeminiWithAttempts = async (): Promise<{ response: any; usedSchema: boolean }> => {
            // Dynamic array of attempts to prevent redundant calls and minimize quota usage.
            const attemptsConfig = useSearch ? [
                {
                    model: "gemini-3.5-flash",
                    enableSearch: true,
                    useSchema: false, // Use raw JSON generation when search is enabled to prevent combination errors.
                },
                {
                    model: "gemini-3.1-flash-lite", // Fallback to lightweight model without search when rate limited
                    enableSearch: false,
                    useSchema: true,
                },
                {
                    model: "gemini-3.5-flash",
                    enableSearch: false, // Fallback to non-search
                    useSchema: true,
                },
                {
                    model: "gemini-3.1-flash-lite",
                    enableSearch: false,
                    useSchema: false, // Plain instruction-guided JSON fallback
                }
            ] : [
                {
                    model: "gemini-3.5-flash",
                    enableSearch: false,
                    useSchema: true,
                },
                {
                    model: "gemini-3.1-flash-lite", // Efficient alternative
                    enableSearch: false,
                    useSchema: true,
                },
                {
                    model: "gemini-3.5-flash",
                    enableSearch: false,
                    useSchema: false,
                },
                {
                    model: "gemini-3.1-flash-lite",
                    enableSearch: false,
                    useSchema: false,
                }
            ];

            let lastError: any = null;
            const ai = getAiInstance();

            for (let i = 0; i < attemptsConfig.length; i++) {
                const config = attemptsConfig[i];
                const attemptNum = i + 1;
                console.log(`[Gemini API] Analyzing (Attempt ${attemptNum}/${attemptsConfig.length} using ${config.model}, search: ${config.enableSearch}, schema: ${config.useSchema})...`);
                
                try {
                    const params: any = {
                        model: config.model,
                        contents: prompt,
                        config: {
                            temperature: 0.1,
                            tools: config.enableSearch ? [{ googleSearch: {} }] : [],
                        }
                    };

                    if (config.useSchema) {
                        params.config.responseMimeType = "application/json";
                        params.config.responseSchema = jobDataSchema;
                    }

                    const response = await ai.models.generateContent(params);
                    return { response, usedSchema: config.useSchema };
                } catch (error: any) {
                    lastError = error;
                    const errStr = String(error) + " " + JSON.stringify(error) + " " + (error.message || "");
                    const isRateLimit = errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota") || errStr.includes("limit");
                    const isUnsupportedCombo = errStr.includes("combination") || errStr.includes("not supported") || errStr.includes("schema") || errStr.includes("tool") || errStr.includes("InvalidArgument") || errStr.includes("INVALID_ARGUMENT");

                    console.warn(`[Gemini API] Attempt ${attemptNum} failed:`, error.message || error);

                    if (i < attemptsConfig.length - 1) {
                        if (isRateLimit) {
                            const backoffMs = attemptNum === 1 ? 2500 : 4000;
                            console.warn(`[Gemini API] Quota/Rate limit hit. Waiting ${backoffMs}ms before fallback retry...`);
                            await new Promise(resolve => setTimeout(resolve, backoffMs));
                        } else if (isUnsupportedCombo) {
                            console.warn(`[Gemini API] Unsupported API combination or parameter. Trying next fallback...`);
                        } else {
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                }
            }
            throw lastError;
        };

        const { response, usedSchema } = await callGeminiWithAttempts();
        
        const rawText = response.text.trim();
        let jsonText = rawText;
        let parsedData: any;

        try {
            if (usedSchema) {
                parsedData = JSON.parse(rawText);
            } else {
                const jsonStartIndex = rawText.indexOf('{');
                const jsonEndIndex = rawText.lastIndexOf('}');
                if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
                    jsonText = rawText.substring(jsonStartIndex, jsonEndIndex + 1);
                } else {
                    throw new SyntaxError("AIからの応答に有効なJSONオブジェクトが含まれていませんでした。");
                }
                parsedData = JSON.parse(jsonText);
            }
        } catch (parseErr) {
            console.warn("[Gemini API] Direct JSON parsing failed, attempting fallback markdown extraction:", parseErr);
            const markdownJsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
            if (markdownJsonMatch) {
                jsonText = markdownJsonMatch[1].trim();
            } else {
                const jsonStartIndex = rawText.indexOf('{');
                const jsonEndIndex = rawText.lastIndexOf('}');
                if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
                    jsonText = rawText.substring(jsonStartIndex, jsonEndIndex + 1);
                }
            }
            parsedData = JSON.parse(jsonText);
        }
        
        const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        const sources: Source[] = rawChunks
            .filter((chunk: any) => chunk.web && chunk.web.uri)
            .map((chunk: any) => ({
                uri: chunk.web.uri,
                title: chunk.web.title || chunk.web.uri,
            }));
        // Remove duplicate sources
        const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

        return { data: parsedData as JobData, sources: uniqueSources };

    } catch (error: any) {
        console.error("Error analyzing job description:", error);
        
        const errStr = String(error) + " " + JSON.stringify(error) + " " + (error.message || "");
        const isQuotaExceeded = errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota") || errStr.includes("limit");
        
        if (isQuotaExceeded) {
            throw new Error(
                "Gemini APIの利用制限（クオータ超過）に達しました。\n\n" +
                "【エラーの解決方法】\n" +
                "1. 一時的な利用過多（数リクエスト/分）の場合は、1分ほど時間をおいてから再度お試しください。すぐに再度利用可能になるケースが多いです。\n" +
                "2. 継続して制限が発生する場合は、APIキーのクオータ（無料枠など）を超過している可能性があります。Settings（画面上部またはメインエリアの設定パネル）の「GEMINI_API_KEY」をご確認ください。"
            );
        }

        let errorMessage = "求人情報の分析中にエラーが発生しました。";
        if (error instanceof SyntaxError) {
            errorMessage += "AIからの応答形式が正しくありません。";
        } else if (error instanceof Error) {
            errorMessage += error.message;
        } else {
            errorMessage += String(error);
        }
        errorMessage += "入力内容を確認するか、後でもう一度お試しください。"
        throw new Error(errorMessage);
    }
};
