export default function AppleSpinner({
  size = 28,
  className = "",
  label = "Loading",
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {Array.from({ length: 12 }).map((_, index) => (
        <span
          key={index}
          className="apple-spinner-bar"
          style={{
            transform: `rotate(${index * 30}deg)`,
            animationDelay: `${index * 0.083 - 1}s`,
          }}
        />
      ))}
    </div>
  );
}