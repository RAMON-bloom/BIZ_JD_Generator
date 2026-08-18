
import React, { useState, useCallback, DragEvent } from 'react';
import { parseFile } from './services/fileParser';
import { JobData, JobDataKey, Source } from './types';
import SparklesIcon from './components/icons/SparklesIcon';
import UploadIcon from './components/icons/UploadIcon';
import LoadingSpinner from './components/LoadingSpinner';
import ResultCard from './components/ResultCard';
import ResultListView from './components/ResultListView';
import Squares2x2Icon from './components/icons/Squares2x2Icon';
import ListBulletIcon from './components/icons/ListBulletIcon';
import XCircleIcon from './components/icons/XCircleIcon';


const fieldLabels: Record<JobDataKey, string> = {
  companyName: '企業名',
  departmentAndTitle: '部署・役職名（おすすめ候補3選）',
  jobDescription: '仕事内容',
  workingConditions: '労働条件',
  workLocation: '勤務地',
  remoteWork: 'リモートワークの可否',
  passiveSmoking: '受動喫煙対策の有無',
  jobCategory: '職種（スカウト媒体カテゴリー・3選）',
  industry: '業種（スカウト媒体カテゴリー・2選）',
  companyOverviewAndBenefits: '会社概要及び福利厚生',
  companySize: '会社規模（社員数）',
  salaryRange: '給与レンジ',
  requiredQualifications: '応募資格（必須）',
  preferredQualifications: '応募資格（歓迎）',
};

const fieldOrder: JobDataKey[] = [
  'companyName', 'departmentAndTitle', 'jobDescription', 'workingConditions', 'workLocation',
  'remoteWork', 'passiveSmoking', 'jobCategory', 'industry', 'companyOverviewAndBenefits',
  'companySize', 'salaryRange', 'requiredQualifications', 'preferredQualifications',
];

const App: React.FC = () => {
    const [jobText, setJobText] = useState('');
    const [analysisResult, setAnalysisResult] = useState<JobData | null>(null);
    const [sources, setSources] = useState<Source[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [inputError, setInputError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [useSearch, setUseSearch] = useState(true);

    const processFile = useCallback(async (file: File) => {
        setInputError(null);
        setIsParsing(true);
        try {
            const text = await parseFile(file);
            setJobText(text);
        } catch (err: any) {
            setInputError(err.message || 'ファイルの解析に失敗しました。');
            setJobText('');
        } finally {
            setIsParsing(false);
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
         e.target.value = '';
    }, [processFile]);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

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
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ jobText, useSearch }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            const { data, sources } = await response.json();
            setAnalysisResult(data);
            setSources(sources);
        } catch (err: any) {
            setError(err.message || '不明なエラーが発生しました。');
        } finally {
            setIsLoading(false);
        }
    }, [jobText, useSearch]);

    const handleClear = () => {
        setJobText('');
        setAnalysisResult(null);
        setSources([]);
        setError(null);
        setInputError(null);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-slate-900 dark:text-slate-200 transition-colors duration-300">
            <header className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                             <SparklesIcon className="w-7 h-7 text-cyan-500" />
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white">BIZ JD Generator</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div 
                        className="bg-white dark:bg-gray-950 p-8 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 flex flex-col"
                        onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">1. 求人情報を入力</h2>
                            {jobText && !isLoading && !isParsing && (
                                <button
                                    onClick={handleClear}
                                    className="flex items-center space-x-1.5 px-3 py-1 text-sm rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                                    title="入力をクリア"
                                    aria-label="入力をクリア"
                                >
                                    <XCircleIcon className="w-4 h-4" />
                                    <span>クリア</span>
                                </button>
                            )}
                        </div>
                        <div className="relative flex-grow flex flex-col">
                           <textarea
                                value={jobText}
                                onChange={(e) => {
                                    setJobText(e.target.value);
                                    if(inputError) setInputError(null);
                                    if(error) setError(null);
                                }}
                                placeholder="ここに求人情報を貼り付けるか、ファイルをドロップしてください"
                                className="w-full flex-grow p-4 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-100/70 dark:bg-slate-800/40 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition duration-150 ease-in-out text-sm z-10"
                                style={{minHeight: '320px'}}
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
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('file-upload')?.click()}
                                                    className="font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded pointer-events-auto"
                                                >
                                                    クリックして選択
                                                </button>
                                            </p>
                                            <input id="file-upload" type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.txt" />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        {inputError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{inputError}</p>}
                        
                        {/* Option to toggle web search */}
                        <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                            <label className="flex items-start space-x-3 cursor-pointer select-none">
                                <input
                                    id="search-toggle-checkbox"
                                    type="checkbox"
                                    checked={useSearch}
                                    onChange={(e) => setUseSearch(e.target.checked)}
                                    className="mt-1 h-4 w-4 text-cyan-600 border-slate-300 dark:border-slate-700 rounded focus:ring-cyan-500 cursor-pointer"
                                    disabled={isLoading || isParsing}
                                />
                                <div className="text-sm">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        Web検索（Google Search）で不足情報を補完する
                                    </span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                        AIがインターネット検索を行い会社概要や福利厚生、不足情報を補い高精度に抽出します。利用制限エラー（429エラー）が発生する場合は、このチェックを外して再度お試しください（すでにテキスト内にある情報のみで即時分析が進行します）。
                                    </p>
                                </div>
                            </label>
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading || isParsing || !jobText.trim()}
                            className="mt-6 w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-gradient-to-br from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400/50 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-950 disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:bg-slate-700 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-300 group"
                        >
                            {isLoading || isParsing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isLoading ? '分析中...' : '解析中...'}
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
                                    分析開始
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-white dark:bg-gray-950 p-8 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">2. 分析結果</h2>
                             {analysisResult && (
                               <div className="flex items-center space-x-1 bg-slate-200/70 dark:bg-slate-800/70 p-1 rounded-lg">
                                   <button
                                       onClick={() => setViewMode('card')}
                                       className={`p-1.5 rounded-md transition-colors duration-200 ${
                                           viewMode === 'card' 
                                           ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' 
                                           : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                       }`}
                                       aria-label="カード表示"
                                       title="カード表示"
                                   >
                                       <Squares2x2Icon className="w-5 h-5" />
                                   </button>
                                   <button
                                       onClick={() => setViewMode('list')}
                                       className={`p-1.5 rounded-md transition-colors duration-200 ${
                                           viewMode === 'list' 
                                           ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' 
                                           : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                       }`}
                                       aria-label="リスト表示"
                                       title="リスト表示"
                                   >
                                       <ListBulletIcon className="w-5 h-5" />
                                   </button>
                               </div>
                            )}
                        </div>
                        <div className="min-h-[460px] flex flex-col">
                            {error && (
                                <div className="text-left p-5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-md animate-fadeIn">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                                                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                            </svg>
                                            <h3 className="font-bold text-base">エラーが発生しました</h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAnalyze}
                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1 shrink-0"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                            </svg>
                                            <span>再実行する</span>
                                        </button>
                                    </div>
                                    <p className="text-sm whitespace-pre-line leading-relaxed">{error}</p>
                                    
                                    {(error.includes('クオータ') || error.includes('429') || error.includes('制限') || error.includes('quota') || error.includes('limit') || error.includes('EXHAUSTED')) && (
                                        <div className="bg-white/90 dark:bg-gray-900/80 p-4 rounded-xl border border-red-100 dark:border-red-950 text-slate-700 dark:text-slate-300 text-xs leading-relaxed space-y-2.5 mt-3.5 shadow-inner">
                                            <p className="font-semibold text-slate-800 dark:text-white flex items-center">
                                                <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-2 animate-pulse"></span>
                                                推奨される解決策：
                                            </p>
                                            <ul className="list-disc pl-4 space-y-1.5">
                                                <li>
                                                    <strong>「Web検索」のチェックを外す</strong>: 求人情報の補足に用いるWeb検索は、多くのAPIリクエストトークン/クオータ上限を消費します。左側のチェックボックスをオフにして再度お試しください。
                                                </li>
                                                <li>
                                                    <strong>1分ほど待ってから再実行する</strong>: 短期間のアクセス頻度制限（RPM制限）に達している場合は、少し時間を置くだけで正常に動作します。
                                                </li>
                                                <li>
                                                    <strong>ご自身のAPIキーを設定する</strong>: 画面上部（または設定パネル）の「Settings」を開き、ご自身の制限のない「GEMINI_API_KEY」を設定してください。
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                            {isLoading && <LoadingSpinner message="AIが分析中です。少々お待ちください..." />}
                            {!isLoading && !error && !analysisResult && (
                                <div className="flex-grow flex items-center justify-center">
                                     <div className="text-center p-8 text-slate-500 dark:text-slate-400">
                                        <p>求人情報を入力またはアップロードして分析を開始してください。</p>
                                        <p className="mt-1">結果がここに表示されます。</p>
                                    </div>
                                </div>
                            )}
                            {analysisResult && (
                                viewMode === 'card' ? (
                                    <div className="space-y-3">
                                        {fieldOrder.map((key) => {
                                            const value = analysisResult[key];
                                            return value ? <ResultCard key={key} label={fieldLabels[key]} value={value} /> : null;
                                        })}
                                        {sources.length > 0 && (
                                            <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-slate-800">
                                                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">参照元 (AIによる補足情報)</h4>
                                                <ul className="space-y-1.5 list-none p-0">
                                                    {sources.map((source, index) => (
                                                        <li key={index} className="flex items-start">
                                                            <span className="text-cyan-500 mr-2 mt-1">
                                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                                              </svg>
                                                            </span>
                                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors break-all underline-offset-2 hover:underline">
                                                                {source.title}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <ResultListView
                                        data={analysisResult}
                                        labels={fieldLabels}
                                        order={fieldOrder}
                                        sources={sources}
                                    />
                                )
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;