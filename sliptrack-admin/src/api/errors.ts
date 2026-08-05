// GlobalExceptionHandler on the backend returns either {"message": "..."} (most
// errors) or {"polje": "poruka"} field-violation maps (400 validation errors).
export function extractErrorMessage(err: unknown, fallback = "Nešto je pošlo po zlu"): string {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!data) {
    return (err as Error)?.message ?? fallback;
  }
  if (typeof data.message === "string") {
    return data.message;
  }
  const firstFieldError = Object.values(data).find((v) => typeof v === "string");
  return (firstFieldError as string) ?? fallback;
}
