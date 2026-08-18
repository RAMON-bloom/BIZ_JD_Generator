declare global {
  interface Window {
    google?: any;
  }
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let gisScriptPromise: Promise<void> | null = null;

export const loadGisScript = (): Promise<void> => {
  if (gisScriptPromise) return gisScriptPromise;
  gisScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Servicesの読み込みに失敗しました。'));
    document.head.appendChild(script);
  });
  return gisScriptPromise;
};
