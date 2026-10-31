export function formatMoney(value: number): string {
  return `$${Number(value).toFixed(2)}`;
}

export function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
