export function ProgressBar({
  value,
  total,
  color = "green",
}: {
  value: number;
  total: number;
  color?: "green" | "score";
}) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  const scoreColor =
    pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-400";
  const fillColor = color === "score" ? scoreColor : "bg-green-500";
  return (
    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${fillColor} transition-all duration-300`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
