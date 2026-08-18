
import React, { useEffect, useRef, useState } from 'react';
import {
    initGoogleSignIn,
    renderGoogleSignInButton,
    isGoogleLoginConfigured,
    GoogleUser,
} from '../services/googleAuthService';
import SparklesIcon from './icons/SparklesIcon';

interface GoogleLoginProps {
    onLoginSuccess: (idToken: string, user: GoogleUser | null) => void;
}

const GoogleLogin: React.FC<GoogleLoginProps> = ({ onLoginSuccess }) => {
    const buttonRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const configured = isGoogleLoginConfigured();

    useEffect(() => {
        if (!configured) return;
        let cancelled = false;

        initGoogleSignIn((idToken, user) => {
            if (!cancelled) onLoginSuccess(idToken, user);
        })
            .then(() => {
                if (!cancelled && buttonRef.current) {
                    renderGoogleSignInButton(buttonRef.current);
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Googleサインインの初期化に失敗しました。');
                }
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [configured]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-sm bg-white dark:bg-gray-950 shadow-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <SparklesIcon className="w-7 h-7 text-cyan-500" />
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">JD Scout Handler</h1>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                    @bloom-firm.com のGoogleアカウントでログインしてください
                </p>

                {configured ? (
                    <div className="flex justify-center" ref={buttonRef} />
                ) : (
                    <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
                        Google Client IDが未設定のため、ログインできません。管理者に <code>VITE_GOOGLE_CLIENT_ID</code> の設定を依頼してください。
                    </p>
                )}

                {error && (
                    <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
            </div>
        </div>
    );
};

export default GoogleLogin;
