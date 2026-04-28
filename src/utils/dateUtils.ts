export const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

export const formatTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
};

export const getDaysUntil = (date: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const timeDifference = targetDate.getTime() - today.getTime();
  return Math.ceil(timeDifference / (1000 * 3600 * 24));
};

export const isOverdue = (date: Date): boolean => {
  return getDaysUntil(date) < 0;
};

export const isDueToday = (date: Date): boolean => {
  return getDaysUntil(date) === 0;
};

export const isDueSoon = (date: Date, days: number = 7): boolean => {
  const daysUntil = getDaysUntil(date);
  return daysUntil >= 0 && daysUntil <= days;
};

export const getWeekStart = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const getMonthName = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { month: 'long' };
  return date.toLocaleDateString('en-US', options);
};

export const getYearName = (date: Date): string => {
  return date.getFullYear().toString();
};
