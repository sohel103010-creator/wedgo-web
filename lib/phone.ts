// International phone handling — E.164 normalization (+<country><number>)

export const COUNTRY_CODES: { code: string; name: string; flag: string }[] = [
  { code: "880", name: "বাংলাদেশ", flag: "🇧🇩" },
  { code: "91", name: "ভারত", flag: "🇮🇳" },
  { code: "92", name: "পাকিস্তান", flag: "🇵🇰" },
  { code: "966", name: "সৌদি আরব", flag: "🇸🇦" },
  { code: "971", name: "আরব আমিরাত", flag: "🇦🇪" },
  { code: "974", name: "কাতার", flag: "🇶🇦" },
  { code: "965", name: "কুয়েত", flag: "🇰🇼" },
  { code: "968", name: "ওমান", flag: "🇴🇲" },
  { code: "973", name: "বাহরাইন", flag: "🇧🇭" },
  { code: "60", name: "মালয়েশিয়া", flag: "🇲🇾" },
  { code: "65", name: "সিঙ্গাপুর", flag: "🇸🇬" },
  { code: "44", name: "যুক্তরাজ্য", flag: "🇬🇧" },
  { code: "1", name: "যুক্তরাষ্ট্র/কানাডা", flag: "🇺🇸" },
  { code: "61", name: "অস্ট্রেলিয়া", flag: "🇦🇺" },
  { code: "39", name: "ইতালি", flag: "🇮🇹" },
  { code: "33", name: "ফ্রান্স", flag: "🇫🇷" },
  { code: "49", name: "জার্মানি", flag: "🇩🇪" },
  { code: "34", name: "স্পেন", flag: "🇪🇸" },
];

/** Compose full international number from country code + local part. */
export function composePhone(cc: string, local: string): string {
  const digits = (local || "").replace(/\D/g, "").replace(/^0+/, "");
  const code = (cc || "880").replace(/\D/g, "") || "880";
  return `+${code}${digits}`;
}

/** Normalize any user-typed phone into E.164. `cc` is the selected country code. */
export function normalizePhone(input: string, cc?: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) {
    return "+" + raw.slice(1).replace(/\D/g, "");
  }
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  // Already includes a known country code (e.g. 8801712345678)
  for (const c of COUNTRY_CODES) {
    if (c.code.length > 1 && digits.startsWith(c.code)) return "+" + digits;
  }
  return composePhone(cc || "880", digits);
}

/** Legacy BD format ("017...") for accounts created before E.164. */
export function legacyVariants(e164: string): string[] {
  const out: string[] = [];
  if (e164.startsWith("+880")) out.push("0" + e164.slice(4));
  out.push(e164.replace(/^\+/, ""));
  return out;
}
