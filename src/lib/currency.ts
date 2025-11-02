export function formatCurrency(
  amount: number,
  locale: string = 'en-US',
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function calculateTotal(
  dailyRate: number,
  days: number,
  fees: Array<{ name: string; amount: number }> = [],
  deposit: number = 0
): { subtotal: number; feesTotal: number; deposit: number; total: number } {
  const subtotal = dailyRate * days;
  const feesTotal = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const total = subtotal + feesTotal + deposit;

  return { subtotal, feesTotal, deposit, total };
}
