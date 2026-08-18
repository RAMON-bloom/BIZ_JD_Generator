import React from 'react';

interface LoadingSpinnerProps {
    message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "AIが分析中です。少々お待ちください..." }) => (
    <div className="flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-t-cyan-500 border-slate-200 dark:border-slate-700 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-center">{message}</p>
    </div>
);

export default LoadingSpinner;