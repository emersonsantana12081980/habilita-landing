export function packagePricing(pack) {
  const cash = pack.price_cents ?? Math.round(Number(pack.price || 0) * 100);
  const saved = pack.card_total_cents ?? pack.cardTotalCents;
  const hasSaved = Number.isSafeInteger(saved) && saved > 0;
  const total = hasSaved ? saved : Math.round((cash * 1.2) / 12) * 12;
  const count = hasSaved
    ? (pack.card_installments ?? pack.cardInstallments ?? 12)
    : 12;
  return {
    cash,
    total,
    count,
    demo: !hasSaved || (pack.pricing_demo ?? pack.pricingDemo ?? false),
  };
}
export function splitInstallments(total, count) {
  if (
    !Number.isSafeInteger(total) ||
    total < 1 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 12
  )
    return null;
  return { base: Math.floor(total / count), higher: total % count, count };
}
