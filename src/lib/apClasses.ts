/* Leander ISD AP catalog — preset classes for the picker.
 *
 * This is the College Board AP course list as commonly offered across LISD high
 * schools (Vandegrift, Vista Ridge, Cedar Park, Rouse, Leander, Glenn). Offerings
 * vary campus to campus and year to year — treat it as a fast-entry shortcut, not
 * as an authoritative schedule. Anything missing can still be typed by hand.
 *
 * `grade` is the year the course is *typically* taken, not a requirement.
 * `sequence` marks whether the course expects an earlier AP under its belt.
 */

export type Subject =
  | "English"
  | "Math & CS"
  | "Science"
  | "Social Studies"
  | "World Languages"
  | "Fine Arts";

export type Sequence = "Start here" | "Builds on another AP";

export interface PresetClass {
  code: string;
  name: string;
  subject: Subject;
  grade: 9 | 10 | 11 | 12;
  sequence: Sequence;
}

/** Hue offset per subject, so classes in the same subject read as a family
 *  inside the monochromatic palette. Stays within the ±90 the tint slider allows. */
export const SUBJECT_TINT: Record<Subject, number> = {
  "English": -75,
  "Fine Arts": -50,
  "Math & CS": -25,
  "Science": 0,
  "Social Studies": 40,
  "World Languages": 75,
};

export const AP_CLASSES: PresetClass[] = [
  // English
  { code: "AP LANG",     name: "English Language and Composition",   subject: "English", grade: 11, sequence: "Start here" },
  { code: "AP LIT",      name: "English Literature and Composition", subject: "English", grade: 12, sequence: "Start here" },
  { code: "AP SEM",      name: "Seminar (Capstone)",                 subject: "English", grade: 10, sequence: "Start here" },
  { code: "AP RSCH",     name: "Research (Capstone)",                subject: "English", grade: 11, sequence: "Builds on another AP" },

  // Math & CS
  { code: "AP PRECALC",  name: "Precalculus",                        subject: "Math & CS", grade: 10, sequence: "Start here" },
  { code: "AP CALC AB",  name: "Calculus AB",                        subject: "Math & CS", grade: 11, sequence: "Start here" },
  { code: "AP CALC BC",  name: "Calculus BC",                        subject: "Math & CS", grade: 12, sequence: "Builds on another AP" },
  { code: "AP STAT",     name: "Statistics",                         subject: "Math & CS", grade: 11, sequence: "Start here" },
  { code: "AP CSP",      name: "Computer Science Principles",        subject: "Math & CS", grade: 9,  sequence: "Start here" },
  { code: "AP CSA",      name: "Computer Science A",                 subject: "Math & CS", grade: 11, sequence: "Start here" },

  // Science
  { code: "AP BIO",      name: "Biology",                            subject: "Science", grade: 11, sequence: "Start here" },
  { code: "AP CHEM",     name: "Chemistry",                          subject: "Science", grade: 11, sequence: "Start here" },
  { code: "AP ENVSCI",   name: "Environmental Science",              subject: "Science", grade: 11, sequence: "Start here" },
  { code: "AP PHYS 1",   name: "Physics 1: Algebra-Based",           subject: "Science", grade: 10, sequence: "Start here" },
  { code: "AP PHYS 2",   name: "Physics 2: Algebra-Based",           subject: "Science", grade: 11, sequence: "Builds on another AP" },
  { code: "AP PHYS C-M", name: "Physics C: Mechanics",               subject: "Science", grade: 12, sequence: "Builds on another AP" },
  { code: "AP PHYS C-EM",name: "Physics C: Electricity & Magnetism", subject: "Science", grade: 12, sequence: "Builds on another AP" },

  // Social Studies
  { code: "AP HUG",      name: "Human Geography",                    subject: "Social Studies", grade: 9,  sequence: "Start here" },
  { code: "AP WHAP",     name: "World History: Modern",              subject: "Social Studies", grade: 10, sequence: "Start here" },
  { code: "AP EURO",     name: "European History",                   subject: "Social Studies", grade: 10, sequence: "Start here" },
  { code: "APUSH",       name: "United States History",              subject: "Social Studies", grade: 11, sequence: "Start here" },
  { code: "AP PSYCH",    name: "Psychology",                         subject: "Social Studies", grade: 11, sequence: "Start here" },
  { code: "AP GOV",      name: "U.S. Government and Politics",       subject: "Social Studies", grade: 12, sequence: "Start here" },
  { code: "AP COMPGOV",  name: "Comparative Government and Politics",subject: "Social Studies", grade: 12, sequence: "Start here" },
  { code: "AP MACRO",    name: "Macroeconomics",                     subject: "Social Studies", grade: 12, sequence: "Start here" },
  { code: "AP MICRO",    name: "Microeconomics",                     subject: "Social Studies", grade: 12, sequence: "Start here" },

  // World Languages
  { code: "AP SPAN LANG",name: "Spanish Language and Culture",       subject: "World Languages", grade: 11, sequence: "Start here" },
  { code: "AP SPAN LIT", name: "Spanish Literature and Culture",     subject: "World Languages", grade: 12, sequence: "Builds on another AP" },
  { code: "AP FREN",     name: "French Language and Culture",        subject: "World Languages", grade: 11, sequence: "Start here" },
  { code: "AP GERM",     name: "German Language and Culture",        subject: "World Languages", grade: 11, sequence: "Start here" },
  { code: "AP CHIN",     name: "Chinese Language and Culture",       subject: "World Languages", grade: 11, sequence: "Start here" },
  { code: "AP LATIN",    name: "Latin",                              subject: "World Languages", grade: 11, sequence: "Start here" },

  // Fine Arts
  { code: "AP ARTHIST",  name: "Art History",                        subject: "Fine Arts", grade: 10, sequence: "Start here" },
  { code: "AP MUSTHEO",  name: "Music Theory",                       subject: "Fine Arts", grade: 10, sequence: "Start here" },
  { code: "AP DRAW",     name: "Drawing",                            subject: "Fine Arts", grade: 11, sequence: "Start here" },
  { code: "AP 2D ART",   name: "2-D Art and Design",                 subject: "Fine Arts", grade: 11, sequence: "Start here" },
  { code: "AP 3D ART",   name: "3-D Art and Design",                 subject: "Fine Arts", grade: 11, sequence: "Start here" },
];

export type SortMode = "subject" | "grade" | "az" | "sequence";

export const SORT_MODES: { id: SortMode; label: string }[] = [
  { id: "subject",  label: "Subject" },
  { id: "grade",    label: "Grade" },
  { id: "az",       label: "A–Z" },
  { id: "sequence", label: "Prereq" },
];

const SUBJECT_ORDER: Subject[] = [
  "English", "Math & CS", "Science", "Social Studies", "World Languages", "Fine Arts",
];

/** Filter by query, then bucket into ordered groups for the chosen sort mode. */
export function groupClasses(
  list: PresetClass[],
  mode: SortMode,
): { label: string; items: PresetClass[] }[] {
  const byName = (a: PresetClass, b: PresetClass) => a.name.localeCompare(b.name);

  if (mode === "az") {
    return [{ label: "All courses", items: [...list].sort(byName) }];
  }

  if (mode === "grade") {
    return ([9, 10, 11, 12] as const)
      .map((g) => ({
        label: `${g}th grade — typical`,
        items: list.filter((c) => c.grade === g).sort(byName),
      }))
      .filter((g) => g.items.length > 0);
  }

  if (mode === "sequence") {
    return (["Start here", "Builds on another AP"] as Sequence[])
      .map((s) => ({ label: s, items: list.filter((c) => c.sequence === s).sort(byName) }))
      .filter((g) => g.items.length > 0);
  }

  return SUBJECT_ORDER
    .map((s) => ({ label: s, items: list.filter((c) => c.subject === s).sort(byName) }))
    .filter((g) => g.items.length > 0);
}
