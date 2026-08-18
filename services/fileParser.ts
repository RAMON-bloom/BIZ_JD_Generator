import * as pdfjsLib from 'pdfjs-dist';

// CDNからワーカーを読み込むためにworkerSrcを設定します
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.mjs';

const parsePdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // textContent.itemsがTextItemオブジェクトであることを確認します
        const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
        fullText += pageText + '\n\n';
    }
    return fullText.trim();
};

const parseTxt = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            resolve(event.target?.result as string);
        };
        reader.onerror = (error) => {
            reject(new Error('テキストファイルの読み取りに失敗しました。'));
        };
        reader.readAsText(file);
    });
};

export const parseFile = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
        return parsePdf(file);
    }
    if (file.type === 'text/plain') {
        return parseTxt(file);
    }
    throw new Error('サポートされていないファイル形式です。PDFまたはTXTファイルを選択してください。');
};
