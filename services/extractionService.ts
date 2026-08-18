import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FieldConfig, Source } from '../types';

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

const buildResponseSchema = (fields: FieldConfig[]) => {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    fields.forEach(field => {
        properties[field.id] = {
            type: field.type === 'array' ? Type.ARRAY : Type.STRING,
            description: field.description,
        };
        if (field.type === 'array') {
            properties[field.id].items = { type: Type.STRING };
        }
        required.push(field.id);
    });
    return { type: Type.OBJECT, properties, required };
};

const buildPlainFormatDescription = (fields: FieldConfig[]): string => {
    const shape: Record<string, string> = {};
    fields.forEach(field => {
        shape[field.id] = field.type === 'array'
            ? `[${field.description}]（文字列の配列）`
            : field.description;
    });
    return JSON.stringify(shape, null, 2);
};

const buildPrompt = (jobText: string, fields: FieldConfig[], useSearch: boolean, useSchema: boolean): string => {
    const formatSection = useSchema
        ? ''
        : `\n# 出力JSONフォーマット\n各キーの説明に従い、値を生成してください。\n${buildPlainFormatDescription(fields)}\n`;

    return `
あなたは優秀なリクルーティングアシスタントです。
以下の求人情報テキストを分析し、指定されたJSON形式で各項目の情報を抽出・整理してください。

# 指示
1. 提供された「求人情報テキスト」を注意深く読み、各項目に該当する情報を抽出してください。各項目の抽出ルールは、出力する各キーの説明（description）に従ってください。
2. テキスト内に情報が不足している項目は、${useSearch ? 'Web検索機能を活用して情報を探し、補完してください' : 'テキスト内の情報のみで対応し、無理に推測や補完はしないでください'}。
3. 検索しても情報が見つからない項目は、その項目に「情報が見つかりませんでした」と正直に記載してください。
4. 元の求人情報テキストやWeb検索の補完結果が英語やその他の外国語で書かれている場合であっても、すべての項目値は必ず流暢で自然な、正確な日本語に翻訳またはローカライズして回答してください。ただし、一般的な固有名詞やプログラム名、技術用語（Java, AWS, Github, Slackなど）は元の表記で構いません。
5. 最終的な出力は、必ず指定されたJSON形式に厳密に従った、単一の有効なJSONオブジェクトのみとしてください。説明文や\`\`\`jsonのようなマークダウンは一切含めないでください。
${formatSection}
# 求人情報テキスト
\`\`\`
${jobText}
\`\`\`
`;
};

const parseJsonResponse = (rawText: string, usedSchema: boolean): any => {
    const trimmed = rawText.trim();
    try {
        if (usedSchema) {
            return JSON.parse(trimmed);
        }
        const start = trimmed.indexOf('{');
        const end = trimmed.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            return JSON.parse(trimmed.substring(start, end + 1));
        }
        throw new SyntaxError("AIからの応答に有効なJSONオブジェクトが含まれていませんでした。");
    } catch (parseErr) {
        const markdownJsonMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/);
        if (markdownJsonMatch) {
            return JSON.parse(markdownJsonMatch[1].trim());
        }
        const start = trimmed.indexOf('{');
        const end = trimmed.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            return JSON.parse(trimmed.substring(start, end + 1));
        }
        throw parseErr;
    }
};

export const analyzeJobDescription = async (
    jobText: string,
    fields: FieldConfig[],
    useSearch: boolean = true
): Promise<{ data: AnalysisResult; sources: Source[] }> => {
    const enabledFields = fields.filter(f => f.isEnabled);
    if (enabledFields.length === 0) {
        throw new Error("有効な抽出項目がありません。設定から項目を有効にしてください。");
    }

    try {
        const attemptsConfig = useSearch ? [
            { model: "gemini-3.5-flash", enableSearch: true, useSchema: false },
            { model: "gemini-3.1-flash-lite", enableSearch: false, useSchema: true },
            { model: "gemini-3.5-flash", enableSearch: false, useSchema: true },
            { model: "gemini-3.1-flash-lite", enableSearch: false, useSchema: false },
        ] : [
            { model: "gemini-3.5-flash", enableSearch: false, useSchema: true },
            { model: "gemini-3.1-flash-lite", enableSearch: false, useSchema: true },
            { model: "gemini-3.5-flash", enableSearch: false, useSchema: false },
            { model: "gemini-3.1-flash-lite", enableSearch: false, useSchema: false },
        ];

        const ai = getAiInstance();
        let lastError: any = null;
        let response: any = null;
        let usedSchema = false;

        for (let i = 0; i < attemptsConfig.length; i++) {
            const config = attemptsConfig[i];
            const attemptNum = i + 1;
            console.log(`[Extraction] Attempt ${attemptNum}/${attemptsConfig.length} (${config.model}, search: ${config.enableSearch}, schema: ${config.useSchema})...`);

            try {
                const params: any = {
                    model: config.model,
                    contents: buildPrompt(jobText, enabledFields, useSearch, config.useSchema),
                    config: {
                        temperature: 0.1,
                        tools: config.enableSearch ? [{ googleSearch: {} }] : [],
                    }
                };
                if (config.useSchema) {
                    params.config.responseMimeType = "application/json";
                    params.config.responseSchema = buildResponseSchema(enabledFields);
                }

                response = await ai.models.generateContent(params);
                usedSchema = config.useSchema;
                break;
            } catch (error: any) {
                lastError = error;
                const errStr = String(error) + " " + JSON.stringify(error) + " " + (error.message || "");
                const isRateLimit = errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota") || errStr.includes("limit");
                const isUnsupportedCombo = errStr.includes("combination") || errStr.includes("not supported") || errStr.includes("schema") || errStr.includes("tool") || errStr.includes("InvalidArgument") || errStr.includes("INVALID_ARGUMENT");

                console.warn(`[Extraction] Attempt ${attemptNum} failed:`, error.message || error);

                if (i < attemptsConfig.length - 1) {
                    if (isRateLimit) {
                        await new Promise(resolve => setTimeout(resolve, attemptNum === 1 ? 2500 : 4000));
                    } else if (!isUnsupportedCombo) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }
        }

        if (!response) {
            throw lastError || new Error("求人情報の分析に失敗しました。");
        }

        const rawText = response.text ? response.text.trim() : "{}";
        const parsedData = parseJsonResponse(rawText, usedSchema);

        const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        const sources: Source[] = rawChunks
            .filter((chunk: any) => chunk.web && chunk.web.uri)
            .map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri }));
        const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

        return { data: parsedData as AnalysisResult, sources: uniqueSources };

    } catch (error: any) {
        console.error("Error analyzing job description:", error);

        const errStr = String(error) + " " + JSON.stringify(error) + " " + (error.message || "");
        const isQuotaExceeded = errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota") || errStr.includes("limit");

        if (isQuotaExceeded) {
            throw new Error(
                "Gemini APIの利用制限（クオータ超過）に達しました。\n\n" +
                "【エラーの解決方法】\n" +
                "1. 一時的な利用過多（数リクエスト/分）の場合は、1分ほど時間をおいてから再度お試しください。すぐに再度利用可能になるケースが多いです。\n" +
                "2. 継続して制限が発生する場合は、Web検索のチェックを外して再度お試しください。"
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
        errorMessage += "入力内容を確認するか、後でもう一度お試しください。";
        throw new Error(errorMessage);
    }
};
