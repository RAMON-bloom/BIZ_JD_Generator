import React, { useState, useCallback } from 'react';
import { JobData, JobDataKey, Source } from '../types';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';

interface ResultListViewProps {
    data: JobData;
    labels: Record<JobDataKey, string>;
    order: JobDataKey[];
    sources: Source[];
}

const formatValueForText = (value: string | { [key: string]: string }): string => {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'object' && value !== null) {
        return Object.entries(value)
            .map(([key, val]) => `■ ${key}\n${val}`)
            .join('\n\n');
    }
    return '';
};


const ResultListView: React.FC<ResultListViewProps> = ({ data, labels, order, sources }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [copiedCandidateIndex, setCopiedCandidateIndex] = useState<number | null>(null);

    const handleCopyCandidate = useCallback((candidateText: string, index: number) => {
        const cleanText = candidateText.replace(/^([\*\-\+・]|\d+[\.\:]\s*|候補\s*\d+[\.\:\s]*)/, '').trim();
        if (!cleanText) return;
        navigator.clipboard.writeText(cleanText).then(() => {
            setCopiedCandidateIndex(index);
            setTimeout(() => setCopiedCandidateIndex(null), 2000);
        }).catch(err => {
            console.error('Failed to copy candidate: ', err);
        });
    }, []);

    const generateTextForCopy = useCallback(() => {
        let text = order
            .map(key => {
                const value = data[key];
                 if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
                    return null;
                }
                return `--- ${labels[key]} ---\n${formatValueForText(value)}`;
            })
            .filter(Boolean)
            .join('\n\n');
        
        if (sources.length > 0) {
            const sourceText = sources.map(source => `- ${source.title}: ${source.uri}`).join('\n');
            text += `\n\n--- 参照元 (AIによる補足情報) ---\n${sourceText}`;
        }

        return text;
    }, [data, labels, order, sources]);

    const handleCopy = useCallback(() => {
        const textToCopy = generateTextForCopy();
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }, [generateTextForCopy]);
    
    const renderTextWithBullets = (text: string | null | undefined) => {
        if (!text) return 'N/A';
        const lines = text.split('\n');
        
        return lines.map((line, index) => {
            const trimmedLine = line.trim();
            
            // Match heading blocks like 【仕事内容】
            const headingMatch = trimmedLine.match(/^【(.*?)】$/);
            if (headingMatch) {
                const headingText = headingMatch[1];
                return (
                    <div 
                        key={index} 
                        className="font-bold text-sm text-cyan-700 dark:text-cyan-400 border-b border-cyan-100 dark:border-cyan-950 pb-1 mb-2 mt-4 first:mt-1 flex items-center gap-1.5"
                    >
                        <span className="w-1.5 h-3.5 bg-gradient-to-b from-sky-500 to-cyan-400 rounded-full inline-block"></span>
                        {headingText}
                    </div>
                );
            }
            
            // Match bullets
            const bulletMatch = trimmedLine.match(/^([\*\-\+・])\s*(.*)$/);
            if (bulletMatch) {
                const content = bulletMatch[2];
                return (
                    <div key={index} className="flex items-start ml-2 my-1 leading-relaxed text-sm">
                        <span className="text-cyan-500 dark:text-cyan-400 mr-2 mt-1.5 select-none text-[8px]">●</span>
                        <span className="flex-1 text-slate-700 dark:text-slate-300">{content}</span>
                    </div>
                );
            }
            
            // Empty line spacing
            if (trimmedLine === '') {
                return <div key={index} className="h-2" />;
            }
            
            // Default text line
            return (
                <div key={index} className="text-slate-700 dark:text-slate-300 my-0.5 leading-relaxed text-sm ml-2">
                    {line}
                </div>
            );
        });
    };

    const renderValue = (value: string | { [key: string]: string }, fieldKey?: string) => {
        const isDepartmentField = fieldKey === 'departmentAndTitle' || (fieldKey && labels[fieldKey as JobDataKey]?.includes('部署'));
        if (typeof value === 'string') {
            if (isDepartmentField) {
                const candidates = value.split('\n').map(l => l.trim()).filter(Boolean);
                if (candidates.length > 0) {
                    return (
                        <div className="space-y-2.5 mt-2">
                            {candidates.map((line, index) => {
                                const cleanText = line.replace(/^([\*\-\+・]|\d+[\.\:]\s*|候補\s*\d+[\.\:\s]*)/, '').trim();
                                const isCopiedThis = copiedCandidateIndex === index;
                                return (
                                    <div 
                                        key={index} 
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-white dark:bg-slate-950/80 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-cyan-400/80 dark:hover:border-cyan-600/80 transition-all duration-200"
                                    >
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <span className="inline-flex items-center justify-center bg-cyan-100/90 dark:bg-cyan-950/90 text-cyan-700 dark:text-cyan-300 text-xs font-bold px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800/80 shrink-0 mt-0.5">
                                                候補 {index + 1}
                                            </span>
                                            <span className="text-slate-800 dark:text-slate-200 font-medium text-sm leading-relaxed break-words">
                                                {cleanText}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyCandidate(line, index)}
                                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 shrink-0 border ${
                                                isCopiedThis 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800' 
                                                : 'bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border-slate-200/90 dark:bg-slate-800 dark:hover:bg-cyan-950/60 dark:text-slate-300 dark:hover:text-cyan-300 dark:border-slate-700'
                                            }`}
                                            title="この候補単体をコピー"
                                        >
                                            {isCopiedThis ? (
                                                <>
                                                    <CheckIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                    <span>コピー完了</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ClipboardIcon className="w-3.5 h-3.5" />
                                                    <span>コピー</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    );
                }
            }

            return <div className="text-slate-800 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{renderTextWithBullets(value)}</div>;
        }

        if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
            return (
                <div className="space-y-3">
                    {Object.entries(value).map(([subKey, subVal]) => (
                         <div key={subKey}>
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">{subKey}</h4>
                            <div className="text-slate-800 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed mt-1">{renderTextWithBullets(subVal)}</div>
                        </div>
                    ))}
                </div>
            )
        }
        return null;
    }

    return (
        <div className="bg-slate-100/50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200/80 dark:border-slate-800 relative">
            <div className="absolute top-4 right-4">
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-300 bg-slate-200/70 hover:bg-slate-300/70 dark:bg-slate-800/70 dark:hover:bg-slate-700/70 transition-colors duration-200"
                    aria-label="すべてコピー"
                    title="すべてコピー"
                >
                    {isCopied ? (
                        <>
                            <CheckIcon className="w-4 h-4 text-green-500" />
                            <span className="text-sm">コピーしました</span>
                        </>
                    ) : (
                        <>
                            <ClipboardIcon className="w-4 h-4" />
                            <span className="text-sm">すべてコピー</span>
                        </>
                    )}
                </button>
            </div>
            <div className="space-y-5">
                {order.map((key) => {
                    const value = data[key];
                    if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) return null;
                    return (
                        <div key={key}>
                            <h3 className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 mb-2">{labels[key]}</h3>
                            {renderValue(value, key)}
                        </div>
                    );
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
        </div>
    );
};

export default ResultListView;