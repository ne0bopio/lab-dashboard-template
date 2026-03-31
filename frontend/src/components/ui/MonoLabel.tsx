export function MonoLabel({ children, color = "#8899aa", className = "" }: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`mono-label ${className}`}
      style={{ color }}
    >
      {children}
    </span>
  );
}
