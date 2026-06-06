/**
 * Validates a UAE phone number.
 * Standard format should contain 9 digits starting with 5 (after removing country code or leading 0).
 * Valid prefixes for UAE mobile: 50, 52, 54, 55, 56, 58.
 */
export function validateUaePhone(phone: string): boolean {
  // Strip non-numeric characters
  const cleanNum = phone.replace(/\D/g, "");
  
  // If it starts with 971, strip it to check the main body
  let localBody = cleanNum;
  if (cleanNum.startsWith("971")) {
    localBody = cleanNum.slice(3);
  } else if (cleanNum.startsWith("0")) {
    localBody = cleanNum.slice(1);
  }
  
  // Needs to be exactly 9 digits long and start with 5
  if (localBody.length !== 9 || !localBody.startsWith("5")) {
    return false;
  }
  
  // Valid second digit prefixes in UAE (0, 2, 4, 5, 6, 8)
  const secondDigit = localBody[1];
  return ["0", "2", "4", "5", "6", "8"].includes(secondDigit);
}

/**
 * Standardizes a phone number into +971 5X XXX XXXX format for WhatsApp and database storage.
 */
export function formatUaePhoneForDb(phone: string): string {
  const cleanNum = phone.replace(/\D/g, "");
  let localBody = cleanNum;
  
  if (cleanNum.startsWith("971")) {
    localBody = cleanNum.slice(3);
  } else if (cleanNum.startsWith("0")) {
    localBody = cleanNum.slice(1);
  }
  
  return `+971${localBody}`;
}

/**
 * Formats a UAE phone number into a visually pleasing readable layout: +971 50 123 4567
 */
export function formatUaePhoneReadable(phone: string): string {
  const formatted = formatUaePhoneForDb(phone);
  if (!formatted.startsWith("+971")) return phone;
  
  const body = formatted.slice(4); // the part after +971 (9 digits starting with 5)
  if (body.length === 9) {
    return `+971 5${body[1]} ${body.slice(2, 5)} ${body.slice(5)}`;
  }
  return formatted;
}

/**
 * Calculates countdown details from an ISO deadline string.
 */
export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function calculateCountdown(deadlineIso: string): CountdownResult {
  const deadline = new Date(deadlineIso).getTime();
  const now = new Date().getTime();
  const timeDifference = deadline - now;

  if (timeDifference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

/**
 * Helper to display AED currency beautifully
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Generates a random secure booking ID in format CBB-XXXXX
 */
export function generateBookingId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "CBB-";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
