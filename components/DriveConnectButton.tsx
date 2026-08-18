
import React, { useEffect, useState } from 'react';
import { usePresets } from '../contexts/PresetContext';
import { AppSettingsDocument, MediaPreset } from '../types';
import DriveIcon from './icons/DriveIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import TeamSyncPanel from './TeamSyncPanel';
import DriveConflictModal from './DriveConflictModal';
import {
    isDriveConfigured,
    connectDrive,
    tryReconnectSilently,
    disconnectDrive,
    loadSettingsFromDrive,
    saveSettingsToDrive,
    sharePersonalSettingsFile,
    overwriteResearcherSettings,
    RESEARCHER_ROSTER_STORAGE_KEY,
    SHARED_WITH_AGENT_EMAIL_STORAGE_KEY,
} from '../services/driveSettingsService';

type DriveStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface DriveConflict {
    fileId: string;
    remoteData: AppSettingsDocument;
}

const loadRoster = (): string[] => {
    try {
        const raw = localStorage.getItem(RESEARCHER_ROSTER_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const formatTimestamp = (ts: number | null): string => {
    if (!ts) return '未実行';
    return new Date(ts).toLocaleString('ja-JP');
};

const DriveConnectButton: React.FC = () => {
    const { document: appDocument, replaceDocument } = usePresets();
    const configured = isDriveConfigured();

    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<DriveStatus>('disconnected');
    const [email, setEmail] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [lastPushedAt, setLastPushedAt] = useState<number | null>(null);
    const [lastPulledAt, setLastPulledAt] = useState<number | null>(null);
    const [isPushing, setIsPushing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const [pendingConflict, setPendingConflict] = useState<DriveConflict | null>(null);
    const [isResolvingConflict, setIsResolvingConflict] = useState(false);

    const [researcherRoster, setResearcherRoster] = useState<string[]>(() => loadRoster());
    const [sharedWithAgentEmail, setSharedWithAgentEmail] = useState<string | null>(
        () => localStorage.getItem(SHARED_WITH_AGENT_EMAIL_STORAGE_KEY)
    );
    const [isTeamSyncBusy, setIsTeamSyncBusy] = useState(false);

    useEffect(() => {
        if (!configured) return;
        let cancelled = false;
        (async () => {
            const reconnected = await tryReconnectSilently();
            if (cancelled || !reconnected) return;
            setEmail(reconnected.email);
            setStatus('connected');
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [configured]);

    const persistRoster = (roster: string[]) => {
        setResearcherRoster(roster);
        localStorage.setItem(RESEARCHER_ROSTER_STORAGE_KEY, JSON.stringify(roster));
    };

    // Only checks for a conflict right after a *new* connection is established — an
    // already-connected session was either conflict-free or already resolved once.
    const ensureConnected = async (checkConflict: boolean): Promise<'ready' | 'conflict' | 'error'> => {
        if (status === 'connected') return 'ready';
        setStatus('connecting');
        setErrorMessage(null);
        try {
            const conn = await connectDrive();
            setEmail(conn.email);
            setStatus('connected');
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err?.message || 'Googleドライブへの接続に失敗しました。');
            return 'error';
        }

        if (checkConflict) {
            try {
                const remote = await loadSettingsFromDrive();
                if (remote && JSON.stringify(remote.data) !== JSON.stringify(appDocument)) {
                    setPendingConflict({ fileId: remote.fileId, remoteData: remote.data });
                    return 'conflict';
                }
            } catch {
                // Conflict check failing shouldn't block the connection itself.
            }
        }
        return 'ready';
    };

    const handleConnectClick = () => {
        setIsOpen(true);
        ensureConnected(true);
    };

    const handlePush = async () => {
        const result = await ensureConnected(true);
        if (result !== 'ready') return;
        setIsPushing(true);
        setErrorMessage(null);
        try {
            await saveSettingsToDrive(appDocument);
            setLastPushedAt(Date.now());
        } catch (err: any) {
            setErrorMessage(err?.message || 'Driveへの保存に失敗しました。');
        } finally {
            setIsPushing(false);
        }
    };

    const handlePull = async () => {
        const result = await ensureConnected(true);
        if (result !== 'ready') return;
        setIsPulling(true);
        setErrorMessage(null);
        try {
            const remote = await loadSettingsFromDrive();
            if (!remote) {
                setErrorMessage('Google Driveに保存された設定がまだありません。先に「Driveに保存」を実行してください。');
                return;
            }
            replaceDocument(remote.data);
            setLastPulledAt(Date.now());
        } catch (err: any) {
            setErrorMessage(err?.message || 'Driveからの読込に失敗しました。');
        } finally {
            setIsPulling(false);
        }
    };

    const handleDisconnect = () => {
        disconnectDrive();
        setStatus('disconnected');
        setEmail(null);
        setLastPushedAt(null);
        setLastPulledAt(null);
        setErrorMessage(null);
        setPendingConflict(null);
    };

    const handleResolveConflict = async (choice: 'local' | 'drive') => {
        if (!pendingConflict) return;
        setIsResolvingConflict(true);
        try {
            if (choice === 'local') {
                await saveSettingsToDrive(appDocument);
                setLastPushedAt(Date.now());
            } else {
                replaceDocument(pendingConflict.remoteData);
                setLastPulledAt(Date.now());
            }
            setPendingConflict(null);
        } catch (err: any) {
            setErrorMessage(err?.message || '設定の反映に失敗しました。');
        } finally {
            setIsResolvingConflict(false);
        }
    };

    const handleAddResearcher = (email: string) => {
        if (researcherRoster.includes(email)) return;
        persistRoster([...researcherRoster, email]);
    };

    const handleRemoveResearcher = (email: string) => {
        if (!window.confirm(`「${email}」を担当から外します。Google Drive側の共有権限は解除されません。よろしいですか？`)) return;
        persistRoster(researcherRoster.filter(e => e !== email));
    };

    const handleOverwriteResearcher = async (researcherEmail: string) => {
        if (!window.confirm(`現在の全ての媒体プリセットで、「${researcherEmail}」のDrive設定ファイルを上書きします。よろしいですか？`)) return;
        const result = await ensureConnected(false);
        if (result === 'error') return;
        setIsTeamSyncBusy(true);
        setErrorMessage(null);
        try {
            await overwriteResearcherSettings(researcherEmail, appDocument.presets as MediaPreset[]);
        } catch (err: any) {
            setErrorMessage(err?.message || '設定の上書きに失敗しました。');
        } finally {
            setIsTeamSyncBusy(false);
        }
    };

    const handleShareWithAgent = async (agentEmail: string) => {
        const result = await ensureConnected(false);
        if (result === 'error') return;
        setIsTeamSyncBusy(true);
        setErrorMessage(null);
        try {
            await sharePersonalSettingsFile(agentEmail, appDocument);
            setSharedWithAgentEmail(agentEmail);
            localStorage.setItem(SHARED_WITH_AGENT_EMAIL_STORAGE_KEY, agentEmail);
        } catch (err: any) {
            setErrorMessage(err?.message || '共有設定に失敗しました。');
        } finally {
            setIsTeamSyncBusy(false);
        }
    };

    if (!configured) return null;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => (status === 'connected' ? setIsOpen(o => !o) : handleConnectClick())}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                <DriveIcon className="w-4 h-4" />
                <span className="hidden sm:inline">
                    {status === 'connected' ? (email || '接続済み') : status === 'connecting' ? '接続中...' : 'Driveと連携'}
                </span>
                {status === 'connected' && <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-[26rem] max-w-[90vw] max-h-[80vh] overflow-y-auto z-50 bg-white dark:bg-gray-950 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                        {status === 'connected' ? (
                            <div className="space-y-5">
                                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold">接続中: {email}</p>
                                    <p>Driveへの最終保存: {formatTimestamp(lastPushedAt)}</p>
                                    <p>Driveからの最終読込: {formatTimestamp(lastPulledAt)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePush}
                                        disabled={isPushing || isPulling}
                                        className="flex-1 px-3 py-2 text-xs font-bold rounded-md text-cyan-600 dark:text-cyan-400 border border-cyan-500/50 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 disabled:opacity-50"
                                    >
                                        {isPushing ? '保存中...' : 'Driveに保存'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handlePull}
                                        disabled={isPushing || isPulling}
                                        className="flex-1 px-3 py-2 text-xs font-bold rounded-md text-cyan-600 dark:text-cyan-400 border border-cyan-500/50 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 disabled:opacity-50"
                                    >
                                        {isPulling ? '読込中...' : 'Driveから読み込む'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDisconnect}
                                        className="px-3 py-2 text-xs font-semibold rounded-md text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500"
                                    >
                                        切断
                                    </button>
                                </div>

                                {errorMessage && (
                                    <p className="text-xs text-red-500">{errorMessage}</p>
                                )}

                                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                                    <TeamSyncPanel
                                        researcherRoster={researcherRoster}
                                        onAddResearcher={handleAddResearcher}
                                        onRemoveResearcher={handleRemoveResearcher}
                                        onOverwriteResearcher={handleOverwriteResearcher}
                                        sharedWithAgentEmail={sharedWithAgentEmail}
                                        onShareWithAgent={handleShareWithAgent}
                                        isBusy={isTeamSyncBusy}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Googleアカウントと連携すると、媒体プリセット一式をあなたのGoogleドライブに保存したり、担当リサーチャー/エージェントと共有できます。ローカル環境でも従来通り連携なしで使えます。
                                </p>
                                {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
                                <button
                                    type="button"
                                    onClick={handleConnectClick}
                                    disabled={status === 'connecting'}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-md bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50"
                                >
                                    {status === 'connecting' ? '接続中...' : 'Googleでログイン / Driveと連携'}
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {pendingConflict && (
                <DriveConflictModal
                    isBusy={isResolvingConflict}
                    onUseLocal={() => handleResolveConflict('local')}
                    onUseDrive={() => handleResolveConflict('drive')}
                    onCancel={() => setPendingConflict(null)}
                />
            )}
        </div>
    );
};

export default DriveConnectButton;
