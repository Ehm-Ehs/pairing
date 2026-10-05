/**
 * Formats a phone number to full international format with digits only (no '+' or leading zeros).
 * Local Nigerian numbers get the 234 country code. e.g. "+234 801 234 5678" -> "2348012345678"
 */
export const formatWhatsAppPhone = (phone: string): string => {
  if (!phone) return "";
  let digits = phone.replace(/\D+/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = "234" + digits.substring(1);
  } else if (digits.length === 10 && /^[789]/.test(digits)) {
    digits = "234" + digits;
  }
  return digits.replace(/^0+/, "");
};
