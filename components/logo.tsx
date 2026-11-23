// The TrustCare logo: a small shield mark and the lowercase wordmark.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21.5s7.5-3.6 7.5-9.4V5.4L12 2.5 4.5 5.4v6.7c0 5.8 7.5 9.4 7.5 9.4z" />
        <path d="M12 8.2v6.6M8.7 11.5h6.6" />
      </svg>
      <span className="text-[1.3rem] font-medium tracking-[-0.03em]">trustcare</span>
    </span>
  );
}
