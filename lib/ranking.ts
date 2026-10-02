import type { Item } from './data';
const weights = { High: 3, Medium: 2, Low: 1 };
export function rankItems(items: Item[]) {
  return [...items].sort((a, b) => weights[b.priority] - weights[a.priority] || a.deadline.localeCompare(b.deadline) || a.id.localeCompare(b.id));
}
export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function deadlineFlag(item: Pick<Item, 'status' | 'deadline'>, date = today()) {
  if (item.status === 'Done') return 'none';
  if (item.deadline < date) return 'overdue';
  const end = new Date(date + 'T00:00:00Z');
  end.setUTCDate(end.getUTCDate() + 7);
  return item.deadline <= end.toISOString().slice(0, 10) ? 'soon' : 'none';
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z'));
}
