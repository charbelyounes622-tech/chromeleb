export const UNIT_PRICE_CENTS = 1600;
export const DELIVERY_CENTS = 500;
export const FREE_DELIVERY_AT = 3;

export function calculateTotals(itemCount: number) {
  const safeCount = Math.max(0, Math.floor(itemCount));
  const subtotalCents = safeCount * UNIT_PRICE_CENTS;
  const deliveryCents =
    safeCount > 0 && safeCount < FREE_DELIVERY_AT ? DELIVERY_CENTS : 0;
  return {
    itemCount: safeCount,
    subtotalCents,
    deliveryCents,
    totalCents: subtotalCents + deliveryCents,
  };
}
