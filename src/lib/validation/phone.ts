const UKRAINIAN_PHONE_PATTERN = /^\+380\d{9}$/;

export function normalizeUkrainianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("00380")
    ? `+${digits.slice(2)}`
    : digits.startsWith("380")
      ? `+${digits}`
      : digits.startsWith("0")
        ? `+38${digits}`
        : value.startsWith("+")
          ? `+${digits}`
          : null;

  return normalized && UKRAINIAN_PHONE_PATTERN.test(normalized) ? normalized : null;
}
