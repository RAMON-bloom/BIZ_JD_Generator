
import React from 'react';

interface DriveConflictModalProps {
    isBusy: boolean;
    onUseLocal: () => void;
    onUseDrive: () => void;
    onCancel: () => void;
}

const DriveConflictModal: React.FC<DriveConflictModalProps> = ({ isBusy, onUseLocal, onUseDrive, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
            <div className="bg-white dark:bg-gray-950 shadow-2xl rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">設定の内容が一致しません</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    このブラウザの設定と、Google Driveに保存されている設定の内容が異なります。どちらを使いますか？後からいつでも「Driveに保存」「Driveから読み込む」で上書きできます。
                </p>
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={onUseLocal}
                        disabled={isBusy}
                        className="w-full py-2.5 rounded-lg font-bold text-sm bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50"
                    >
                        このブラウザの設定をアップロードする
                    </button>
                    <button
                        type="button"
                        onClick={onUseDrive}
                        disabled={isBusy}
                        className="w-full py-2.5 rounded-lg font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50"
                    >
                        Driveの設定を読み込む
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isBusy}
                        className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
                    >
                        あとで決める
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DriveConflictModal;
