"use client";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "lg";
};

export default function StarRating({ value, onChange, size = "sm" }: StarRatingProps) {
  const interactive = Boolean(onChange);
  const textSize = size === "lg" ? "text-2xl" : "text-sm";

  return (
    <div className={`flex gap-1 ${textSize} ${interactive ? "cursor-pointer" : ""}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange?.(n)}
          className={n <= value ? "text-or" : "text-bordure"}
        >
          ★
        </span>
      ))}
    </div>
  );
}
