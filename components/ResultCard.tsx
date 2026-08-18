
import React from 'react';

interface ResultCardProps {
    title: string;
    content: string;
}

const renderTextWithBullets = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
        const trimmedLine = line.trim();

        const headingMatch = trimmedLine.match(/^【(.*?)】$/);
        if (headingMatch) {
            return (
                <div key={index} className="font-bold text-sm text-cyan-700 dark:text-cyan-400 border-b border-cyan-100 dark:border-cyan-950 pb-1 mb-2 mt-4 first:mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-3.5 bg-gradient-to-b from-sky-500 to-cyan-400 rounded-full inline-block"></span>
                    {headingMatch[1]}
                </div>
            );
        }

        const bulletMatch = trimmedLine.match(/^([*\-+・])\s*(.*)$/);
        if (bulletMatch) {
            return (
                <div key={index} className="flex items-start ml-2 my-1 leading-relaxed text-sm">
                    <span className="text-cyan-500 dark:text-cyan-400 mr-2 mt-1.5 select-none text-[8px]">●</span>
                    <span className="flex-1 text-slate-700 dark:text-slate-300">{bulletMatch[2]}</span>
                </div>
            );
        }

        if (trimmedLine === '') {
            return <div key={index} className="h-2" />;
        }

        return (
            <div key={index} className="text-slate-700 dark:text-slate-300 my-0.5 leading-relaxed text-sm ml-2">
                {line}
            </div>
        );
    });
};

const ResultCard: React.FC<ResultCardProps> = ({ title, content }) => {
    return (
        <div className="bg-white dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-5">
            <h3 className="text-base font-bold text-cyan-600 dark:text-cyan-400 mb-2">{title}</h3>
            {content ? (
                <div>{renderTextWithBullets(content)}</div>
            ) : (
                <p className="text-slate-400 dark:text-slate-500 italic text-sm">情報が見つかりませんでした。</p>
            )}
        </div>
    );
};

export default ResultCard;
