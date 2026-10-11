// Compatibility score calculator
export function calcCompatibility(me: any, other: any): number {
  let score = 50; // base

  // Age difference (closer = higher)
  if (me.age && other.age) {
    const diff = Math.abs(me.age - other.age);
    if (diff <= 2) score += 15;
    else if (diff <= 5) score += 10;
    else if (diff <= 10) score += 5;
  }

  // Same district
  if (me.district && other.district && me.district === other.district) score += 10;

  // Same religion
  if (me.religion && other.religion && me.religion === other.religion) score += 10;

  // Education level match (simple)
  if (me.education && other.education) score += 5;

  // Marital status match
  if (me.marital_status && other.marital_status && me.marital_status === other.marital_status) score += 5;

  // Ghar jamai compatibility
  if (me.ghar_jamai && other.ghar_jamai) {
    // male wants + female wants, or both don't want
    if ((me.ghar_jamai.includes("চাই") && other.ghar_jamai.includes("লাগবে")) ||
        (me.ghar_jamai.includes("না") && other.ghar_jamai.includes("না"))) score += 5;
  }

  return Math.min(99, Math.max(10, score));
}

export type BreakdownRow = { key: string; bn: string; en: string; points: number; max: number; note: string };

// Per-factor breakdown of the compatibility score ("why X% match?")
export function compatBreakdown(me: any, other: any): BreakdownRow[] {
  const rows: BreakdownRow[] = [];

  let agePts = 0, ageNote = "";
  if (me.age && other.age) {
    const diff = Math.abs(me.age - other.age);
    if (diff <= 2) agePts = 15;
    else if (diff <= 5) agePts = 10;
    else if (diff <= 10) agePts = 5;
    ageNote = `±${diff} বছর`;
  }
  rows.push({ key: "age", bn: "বয়সের মিল", en: "Age closeness", points: agePts, max: 15, note: ageNote });

  const distOk = !!(me.district && other.district && me.district === other.district);
  rows.push({ key: "district", bn: "একই জেলা", en: "Same district", points: distOk ? 10 : 0, max: 10, note: other.district || "" });

  const relOk = !!(me.religion && other.religion && me.religion === other.religion);
  rows.push({ key: "religion", bn: "একই ধর্ম", en: "Same religion", points: relOk ? 10 : 0, max: 10, note: "" });

  const eduOk = !!(me.education && other.education);
  rows.push({ key: "education", bn: "শিক্ষা", en: "Education", points: eduOk ? 5 : 0, max: 5, note: "" });

  const marOk = !!(me.marital_status && other.marital_status && me.marital_status === other.marital_status);
  rows.push({ key: "marital", bn: "বৈবাহিক অবস্থা", en: "Marital status", points: marOk ? 5 : 0, max: 5, note: "" });

  let gjOk = false;
  if (me.ghar_jamai && other.ghar_jamai) {
    gjOk = (me.ghar_jamai.includes("চাই") && other.ghar_jamai.includes("লাগবে")) ||
           (me.ghar_jamai.includes("না") && other.ghar_jamai.includes("না"));
  }
  rows.push({ key: "gharjamai", bn: "ঘর জামাই সম্মতি", en: "Ghar jamai agreement", points: gjOk ? 5 : 0, max: 5, note: "" });

  return rows;
}
