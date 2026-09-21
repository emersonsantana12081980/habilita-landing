import React from "react";

export function Brand() {
  return (
    <a
      href="/"
      className="flex shrink-0 items-center gap-2.5"
      aria-label="Habilita mais, início"
    >
      <span className="brand-symbol">
        <img src="/brand.png" alt="" width="1536" height="1024" />
      </span>
      <span>
        <span className="block text-[25px] font-black italic tracking-tight leading-none">
          HABILITA<span className="text-green-600">+</span>
        </span>
        <span className="mt-1 block text-[8px] font-semibold tracking-[.22em] uppercase">
          Instrutores autônomos
        </span>
      </span>
    </a>
  );
}
