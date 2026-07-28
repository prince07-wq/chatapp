export default function Card({ children, className = "" }) {
  return (
    <div
      className={`
        rounded-card
        bg-paper
        dark:bg-zinc-900
        shadow-lg
        p-8
        ${className}
      `}
    >
      {children}
    </div>
  );
}