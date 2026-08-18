
import React, { useState, useCallback, DragEvent } from 'react';
import { usePresets } from '../../contexts/PresetContext';
import { parseFile } from '../../services/fileParser';
import { AnalysisResult, Source } from '../../types';
import UploadIcon from '../icons/UploadIcon';
import LoadingSpinner from '../LoadingSpinner';
import SettingsIcon from '../icons/SettingsIcon';
import XCircleIcon from '../icons/XCircleIcon';
import ResultGroups from '../ResultGroups';
import SettingsModal from '../SettingsModal';
import PresetSwitcher from '../PresetSwitcher';

const ExtractionTab: React.FC = () => {
    const { activePreset, setActivePresetId, updateExtractionConfig } = usePresets();
    const preset = activePreset('extract');
    const { fields, groups } = preset.extraction;

    const [jobText, setJobText] = useState('');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [sources, setSources] = useState<Source[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [inputError, setInputError] = useState<string | null>(null);
    const [useSearch, setUseSearch] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const processFile = useCallback(async (file: File) => {
        setInputError(null);
        setIsParsing(true);
        try {
            const text = await parseFile(file);
            setJobText(text);
        } catch (err: any) {
            setInputError(err.message || 'ファイルの解析に失敗しました。');
        } finally {
            setIsParsing(false);
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = '';
    }, [processFile]);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

    const handleAnalyze = useCallback(async () => {
        if (!jobText.trim()) {
            setError('分析する求人情報を入力してください。');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setSources([]);

        try {
            const response = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobText, fields, useSearch }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            const { data, sources: newSources } = await response.json();
            setAnalysisResult(data);
            setSources(newSources);
        } catch (err: any) {
            setError(err.message || '不明なエラーが発生しました。');
        } finally {
            setIsLoading(false);
        }
    }, [jobText, fields, useSearch]);

    const handleClear = () => {
        setJobText('');
        setAnalysisResult(null);
        setSources([]);
        setError(null);
        setInputError(null);
    };

    const handleSaveSettings = (newFields: typeof fields, newGroups: typeof groups) => {
        updateExtractionConfig(preset.id, { fields: newFields, groups: newGroups });
    };

    const isQuotaError = !!error && (error.includes('クオータ') || error.includes('429') || error.includes('制限') || error.includes('quota') || error.includes('limit') || error.includes('EXHAUSTED'));

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                <PresetSwitcher tab="extract" />
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                >
                    <SettingsIcon className="w-4 h-4" />
                    <span>抽出項目・コピーグループを編集</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div
                    className="bg-white dark:bg-gray-950 p-8 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 flex flex-col"
                    onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">1. 求人情報を入力</h2>
                        {jobText && !isLoading && !isParsing && (
                            <button onClick={handleClear} className="flex items-center space-x-1.5 px-3 py-1 text-sm rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors">
                                <XCircleIcon className="w-4 h-4" />
                                <span>クリア</span>
                            </button>
                        )}
                    </div>
                    <div className="relative flex-grow flex flex-col">
                        <textarea
                            value={jobText}
                            onChange={(e) => { setJobText(e.target.value); if (inputError) setInputError(null); if (error) setError(null); }}
                            placeholder="ここに求人情報を貼り付けるか、ファイルをドロップしてください"
                            className="w-full flex-grow p-4 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-100/70 dark:bg-slate-800/40 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition duration-150 ease-in-out text-sm z-10"
                            style={{ minHeight: '320px' }}
                            disabled={isLoading || isParsing}
                        />
                        {(isDragging || isParsing || (!jobText && !isParsing)) && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-gray-950/80 rounded-md flex flex-col items-center justify-center text-center p-4 z-20 pointer-events-none transition-opacity duration-300">
                                {isParsing ? (
                                    <LoadingSpinner message="ファイルを解析中です..." />
                                ) : isDragging ? (
                                    <>
                                        <UploadIcon className="w-12 h-12 text-cyan-500 mb-2" />
                                        <p className="font-semibold text-lg text-slate-700 dark:text-slate-300">ここにファイルをドロップ</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadIcon className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-2" />
                                        <p className="font-semibold text-slate-600 dark:text-slate-400">ファイルをドラッグ＆ドロップ</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-500">
                                            または{' '}
                                            <button type="button" onClick={() => document.getElementById('extract-file-upload')?.click()} className="font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded pointer-events-auto">
                                                クリックして選択
                                            </button>
                                        </p>
                                        <input id="extract-file-upload" type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.txt" />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    {inputError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{inputError}</p>}

                    <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                        <label className="flex items-start space-x-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={useSearch}
                                onChange={(e) => setUseSearch(e.target.checked)}
                                className="mt-1 h-4 w-4 text-cyan-600 border-slate-300 dark:border-slate-700 rounded focus:ring-cyan-500 cursor-pointer"
                                disabled={isLoading || isParsing}
                            />
                            <div className="text-sm">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Web検索（Google Search）で不足情報を補完する</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    AIがインターネット検索を行い会社概要や福利厚生、不足情報を補い高精度に抽出します。利用制限エラー（429エラー）が発生する場合は、このチェックを外して再度お試しください。
                                </p>
                            </div>
                        </label>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || isParsing || !jobText.trim()}
                        className="mt-6 w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-gradient-to-br from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400/50 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-950 disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:bg-slate-700 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        {isLoading || isParsing ? (isLoading ? '分析中...' : '解析中...') : '分析開始'}
                    </button>

                    {error && (
                        <div className="mt-4 text-left p-5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-md">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-base">エラーが発生しました</h3>
                                <button type="button" onClick={handleAnalyze} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-lg shadow-sm transition-all">再実行する</button>
                            </div>
                            <p className="text-sm whitespace-pre-line leading-relaxed">{error}</p>
                            {isQuotaError && (
                                <div className="bg-white/90 dark:bg-gray-900/80 p-4 rounded-xl border border-red-100 dark:border-red-950 text-slate-700 dark:text-slate-300 text-xs leading-relaxed space-y-2.5 mt-3.5">
                                    <p className="font-semibold text-slate-800 dark:text-white">推奨される解決策：</p>
                                    <ul className="list-disc pl-4 space-y-1.5">
                                        <li><strong>「Web検索」のチェックを外す</strong>: 多くのAPIクオータを消費するWeb検索をオフにして再度お試しください。</li>
                                        <li><strong>1分ほど待ってから再実行する</strong>: 短期間のアクセス頻度制限に達している場合、時間を置くだけで解決します。</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-950 p-8 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">2. 分析結果</h2>
                    <div className="min-h-[460px] flex flex-col">
                        {isLoading && <LoadingSpinner message="AIが分析中です。少々お待ちください..." />}
                        {!isLoading && !analysisResult && (
                            <div className="flex-grow flex items-center justify-center">
                                <div className="text-center p-8 text-slate-500 dark:text-slate-400">
                                    <p>求人情報を入力またはアップロードして分析を開始してください。</p>
                                    <p className="mt-1">結果がここに表示されます。</p>
                                </div>
                            </div>
                        )}
                        {analysisResult && (
                            <div className="space-y-6">
                                <ResultGroups fields={fields} groups={groups} data={analysisResult} />
                                {sources.length > 0 && (
                                    <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-slate-800">
                                        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">参照元（AIによる補足情報）</h4>
                                        <ul className="space-y-1.5 list-none p-0">
                                            {sources.map((source, index) => (
                                                <li key={index} className="flex items-start">
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors break-all underline-offset-2 hover:underline">
                                                        {source.title}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                fields={fields}
                groups={groups}
                onSave={handleSaveSettings}
                previewData={analysisResult}
            />
        </div>
    );
};

export default ExtractionTab;
