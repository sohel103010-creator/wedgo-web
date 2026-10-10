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
