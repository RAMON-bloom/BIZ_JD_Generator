
import React from 'react';
import PaperPlaneIcon from './icons/PaperPlaneIcon';
import XCircleIcon from './icons/XCircleIcon';

interface ScoutFormProps {
    candidateExperience: string;
    setCandidateExperience: (value: string) => void;
    candidateDesiredRole: string;
    setCandidateDesiredRole: (value: string) => void;
    jobInfo: string;
    setJobInfo: (value: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
}

const ScoutForm: React.FC<ScoutFormProps> = ({
    candidateExperience, setCandidateExperience,
    candidateDesiredRole, setCandidateDesiredRole,
    jobInfo, setJobInfo,
    onGenerate, isLoading,
}) => {
    const canGenerate = jobInfo.trim() !== '';

    const fieldLabel = "flex items-center justify-between";
    const labelText = "block text-sm font-semibold text-slate-600 dark:text-slate-400";
    const clearBtn = "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500";
    const textareaClass = "mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/40 p-3 text-sm text-slate-800 dark:text-slate-200 shadow-inner focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition duration-150";

    return (
        <div className="space-y-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-gray-950 p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
                <div className="space-y-6">
                    <div>
                        <div className={fieldLabel}>
                            <label className={labelText}>候補者の経験</label>
                            {candidateExperience && (
                                <button type="button" onClick={() => setCandidateExperience('')} className={clearBtn}>
                                    <XCircleIcon className="h-4 w-4" /><span>クリア</span>
                                </button>
                            )}
                        </div>
                        <textarea rows={8} className={textareaClass} placeholder="例：ReactとTypeScriptを用いたフロントエンド開発経験5年。UI/UXデザインの改善やパフォーマンスチューニングにも貢献..." value={candidateExperience} onChange={(e) => setCandidateExperience(e.target.value)} />
                    </div>
                    <div>
                        <div className={fieldLabel}>
                            <label className={labelText}>候補者の希望職種</label>
                            {candidateDesiredRole && (
                                <button type="button" onClick={() => setCandidateDesiredRole('')} className={clearBtn}>
                                    <XCircleIcon className="h-4 w-4" /><span>クリア</span>
                                </button>
                            )}
                        </div>
                        <textarea rows={6} className={textareaClass} placeholder="例：裁量権の大きい環境でプロダクト開発の初期段階から関わりたい。将来的にはテックリードを目指したい..." value={candidateDesiredRole} onChange={(e) => setCandidateDesiredRole(e.target.value)} />
                        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">ヒント: 「経験」や「希望職種」を入力すると、よりパーソナライズされた文章が生成されます。</p>
                    </div>
                </div>
                <div>
                    <div className={fieldLabel}>
                        <label className={labelText}>求人情報 <span className="text-red-500">*必須</span></label>
                        {jobInfo && (
                            <button type="button" onClick={() => setJobInfo('')} className={clearBtn}>
                                <XCircleIcon className="h-4 w-4" /><span>クリア</span>
                            </button>
                        )}
                    </div>
                    <textarea rows={17} className={textareaClass} placeholder="例：募集職種：シニアフロントエンドエンジニア。モダンな技術スタック（React, Next.js）を用いて、新規サービスの開発をリード..." value={jobInfo} onChange={(e) => setJobInfo(e.target.value)} />
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                        ヒント: 下の定型文設定で作成したプレースホルダー（例: <code className="rounded bg-slate-200/70 dark:bg-slate-800 px-1 py-0.5 text-xs text-cyan-600 dark:text-cyan-400">{'{企業紹介}'}</code>）を使用できます。
                    </p>
                </div>
            </div>
            <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-6">
                <button
                    type="button"
                    onClick={onGenerate}
                    disabled={!canGenerate || isLoading}
                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-gradient-to-br from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400/50 disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:bg-slate-700 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {isLoading ? '生成中...' : (<><PaperPlaneIcon className="mr-2 h-5 w-5" />スカウト文を生成</>)}
                </button>
            </div>
        </div>
    );
};

export default ScoutForm;
