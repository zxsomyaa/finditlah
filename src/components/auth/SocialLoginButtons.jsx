const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
    <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A11.99 11.99 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z" />
    <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0 7.31 0 3.26 2.69 1.26 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z" />
  </svg>
)

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor" aria-hidden="true">
    <path d="M16.36 1.05c.1 1.02-.28 2.02-.9 2.75-.63.75-1.66 1.33-2.66 1.25-.12-1 .34-2.05.95-2.73.68-.76 1.82-1.32 2.61-1.27ZM19.9 17.4c-.5 1.15-.74 1.66-1.38 2.68-.9 1.42-2.16 3.2-3.73 3.21-1.39.02-1.75-.9-3.63-.9-1.89 0-2.29.88-3.68.92-1.57.06-2.77-1.53-3.67-2.94-2.01-3.14-2.55-6.83-1.13-9.75.79-1.63 2.2-2.66 3.7-2.68 1.37-.03 2.66.92 3.5.92.83 0 2.4-1.14 4.05-.97.69.03 2.63.28 3.87 2.08-.1.06-2.3 1.34-2.28 4 .03 3.18 2.79 4.24 2.82 4.25-.02.07-.44 1.5-1.44 2.98Z" />
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="#1877F2" aria-hidden="true">
    <path d="M24 12.07C24 5.66 18.63.5 12 .5S0 5.66 0 12.07c0 5.79 4.39 10.6 10.13 11.43v-8.09H7.08v-3.34h3.05V9.41c0-2.99 1.79-4.64 4.53-4.64 1.31 0 2.68.23 2.68.23v2.92h-1.51c-1.49 0-1.95.92-1.95 1.86v2.22h3.32l-.53 3.34h-2.79v8.09C19.61 22.67 24 17.86 24 12.07Z" />
  </svg>
)

/** @param {{ note?: string }} props */
export default function SocialLoginButtons({ note = "Social login is coming soon" }) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled
        title={note}
        className="w-full flex items-center justify-center gap-2.5 bg-foreground text-background py-3 rounded-xl font-semibold opacity-60 cursor-not-allowed"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled
          title={note}
          className="flex items-center justify-center gap-2 border border-input bg-background py-2.5 rounded-xl text-sm font-medium text-foreground opacity-60 cursor-not-allowed"
        >
          <AppleIcon />
          Apple
        </button>
        <button
          type="button"
          disabled
          title={note}
          className="flex items-center justify-center gap-2 border border-input bg-background py-2.5 rounded-xl text-sm font-medium text-foreground opacity-60 cursor-not-allowed"
        >
          <FacebookIcon />
          Facebook
        </button>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with email</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  )
}
