// Une tirelire stylisée : une pièce qui tombe dans une fente
export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#1b1f27" />
      <rect x="9" y="7" width="14" height="3" rx="1.5" fill="#f4b942" />
      <circle cx="16" cy="19" r="7.5" fill="none" stroke="#f4b942" strokeWidth="2.6" />
      <path d="M16 15.5v7M13.5 17.5h5" stroke="#4fd1a5" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
