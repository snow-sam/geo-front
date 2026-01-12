"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function StarRating({
  value = 0,
  onChange,
  maxStars = 5,
  size = "md",
  disabled = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleClick = (rating: number) => {
    if (disabled) return;
    onChange?.(rating);
  };

  const handleMouseEnter = (rating: number) => {
    if (disabled) return;
    setHoverValue(rating);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const displayValue = hoverValue ?? value;

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: maxStars }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayValue;

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            disabled={disabled}
            className={cn(
              "transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"
            )}
            aria-label={`${starValue} de ${maxStars} estrelas`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors duration-150",
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-slate-500 hover:text-amber-300"
              )}
            />
          </button>
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-sm text-slate-400">
          {value}/{maxStars}
        </span>
      )}
    </div>
  );
}







