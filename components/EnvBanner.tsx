/**
 * Barra visibile solo in QA/test/staging.
 * Imposta in .env / build: NEXT_PUBLIC_APP_ENVIRONMENT=qa | test | staging
 * oppure NEXT_PUBLIC_SHOW_QA_BANNER=1
 */
function shouldShowEnvBanner(): boolean {
  const flag = process.env.NEXT_PUBLIC_SHOW_QA_BANNER;
  if (flag === "1" || flag === "true") return true;

  const env = process.env.NEXT_PUBLIC_APP_ENVIRONMENT?.trim().toLowerCase();
  return env === "qa" || env === "test" || env === "staging";
}

export default function EnvBanner() {
  if (!shouldShowEnvBanner()) return null;

  return (
    <div
      role="status"
      aria-label="Ambiente di test"
      className="relative z-[100] border-b border-amber-700/25 bg-amber-500 px-4 py-2 text-center text-sm font-semibold tracking-wide text-amber-950 shadow-sm dark:border-amber-400/20 dark:bg-amber-600 dark:text-amber-50"
    >
      Ambiente QA / TEST
    </div>
  );
}
