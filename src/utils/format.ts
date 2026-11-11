// The UI renders whole-dollar amounts as "$2,500"; the API returns prices as strings ("2500")
export function formatPrice(amount: number | string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(amount));
}
