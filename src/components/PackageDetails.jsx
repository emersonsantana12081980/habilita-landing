import React from "react";
import { Check, CreditCard, Barcode } from "lucide-react";
import { money } from "../store-data";
import { lessonLabel } from "../data/packages";

export function PackageDetails({ pack, dark = false }) {
  const muted = dark ? "text-slate-300" : "text-slate-500";
  return (
    <div>
      <ul
        className={`space-y-3 text-sm leading-6 ${dark ? "text-slate-100" : "text-slate-700"}`}
      >
        {[
          lessonLabel(pack),
          pack.examVehicle &&
            (pack.category === "A+B"
              ? "Carro e moto para o exame"
              : "Veículo para o exame"),
          pack.freeRetest && "Reteste grátis",
        ]
          .filter(Boolean)
          .map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <Check size={18} className="mt-1 shrink-0 text-green-500" />
              <span>{item}</span>
            </li>
          ))}
      </ul>
      {pack.freeRetest && (
        <div
          className={`mt-4 rounded-xl border p-3 text-xs leading-5 ${dark ? "border-white/15 text-slate-300" : "border-slate-200 text-slate-600"}`}
        >
          <p className="font-bold">Condições do reteste grátis</p>
          <p className="mt-1 whitespace-pre-line">
            {pack.retestTerms ||
              "Antes de contratar, confirme com o instrutor o que está incluído no reteste, o prazo de utilização e eventuais taxas ou custos adicionais."}
          </p>
        </div>
      )}
      <div
        className={`my-5 border-t pt-5 ${dark ? "border-white/15" : "border-slate-100"}`}
      >
        <span className={`block text-xs ${muted}`}>À vista</span>
        <p
          className={`mt-1 text-4xl font-extrabold tracking-tight ${dark ? "text-yellow-300" : "text-slate-900"}`}
        >
          {money(pack.price)}
        </p>
      </div>
      <div className={`space-y-2 text-sm ${muted}`}>
        {pack.cardInstallments > 0 && (
          <p className="flex items-center gap-2">
            <CreditCard size={17} className="shrink-0" />
            {pack.cardInstallments}x no cartão de crédito
          </p>
        )}
        {pack.boletoInstallments > 0 && (
          <p className="flex items-center gap-2">
            <Barcode size={17} className="shrink-0" />
            {pack.boletoInstallments}x no boleto
          </p>
        )}
        {(pack.cardInstallments > 0 || pack.boletoInstallments > 0) && (
          <p className="pt-1 text-xs leading-5">
            Consulte as condições de parcelamento.
          </p>
        )}
      </div>
    </div>
  );
}
