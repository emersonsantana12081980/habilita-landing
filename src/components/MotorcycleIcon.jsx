import React from "react";

export function MotorcycleIcon({ size = 24, strokeWidth = 1.5, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 80"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="25" cy="57" r="16" />
      <circle cx="96" cy="57" r="16" />
      <path d="M25 57 44 34h24l-9 23H25l20-13 14 13M68 34l14-5 14 28M77 17h10l9 40M82 29l12-2-3-9h-9M39 30H24l-8-5M44 34l-5-4M45 34l7-9h17l9 8M11 39l15-8M45 61h22" />
    </svg>
  );
}
