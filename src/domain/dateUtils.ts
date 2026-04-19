export const formatLocalDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const startOfWeekMonday = (value: Date): Date => {
  const date = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};

export const addDays = (value: Date, amount: number): Date => {
  const date = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  date.setDate(date.getDate() + amount);
  return date;
};

export const startOfMonth = (value: Date): Date => {
  return new Date(value.getFullYear(), value.getMonth(), 1);
};

export const endOfMonth = (value: Date): Date => {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0);
};

export const toDayStartMs = (value: Date): number => {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0).getTime();
};

export const toDayEndMs = (value: Date): number => {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999).getTime();
};
