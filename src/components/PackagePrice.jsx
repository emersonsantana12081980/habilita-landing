import React from "react";
import { packagePricing, splitInstallments } from "../lib/package-pricing";
import { money } from "../store-data";
export function PackagePrice({ pack }) {
  const { cash, total, count, demo } = packagePricing(pack);
  const split = splitInstallments(total, count);
  return (
    <div className="my-5 border-y border-slate-100 py-5">
      {demo && (
        <p className="mb-3 inline-block rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
          Valores fictícios para visualização
        </p>
      )}
      <p className="text-sm text-slate-600">Parcelado no cartão</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-green-800">
        <span className="text-xl">{count}x</span>{" "}
        {money(Math.ceil(total / count) / 100)}
      </p>
      {split?.higher > 0 && (
        <p className="mt-2 text-xs text-slate-600">
          {split.higher} parcelas de {money((split.base + 1) / 100)} e{" "}
          {count - split.higher} de {money(split.base / 100)}.
        </p>
      )}
      <p className="mt-2 text-xs text-slate-600">
        Total parcelado: {money(total / 100)}
      </p>
      <p className="mt-4 text-base text-slate-700">
        ou <strong>{money(cash / 100)} à vista</strong>
      </p>
    </div>
  );
}
