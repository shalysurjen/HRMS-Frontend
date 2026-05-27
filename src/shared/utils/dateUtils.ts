export const toLocalISOString = (date: Date | null): string => {
  if (!date) return "";
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Formats a Date object or ISO string to "DD MMM YYYY" (e.g., 17 Apr 2026)
 */
export const formatDateDisplay = (dateInput: Date | string | null): string => {
  if (!dateInput) return "";

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  // Check if the date is valid to prevent "Invalid Date" strings
  if (isNaN(date.getTime())) return "";

  const day = date.getDate();
  const year = date.getFullYear();
  
  // Array of short month names
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  const monthName = months[date.getMonth()];

  return `${day} ${monthName} ${year}`;
};