/**
 * Pass-3 card cleanup:
 * - Merge remaining consecutive Q&A pairs
 * - Delete junk/meta cards
 * - Expand short/identical definitions with verified medical content
 * - Deduplicate
 */
import fs from 'fs';

const outFile = 'src/data/cards.json';
const cards: any[] = JSON.parse(fs.readFileSync(outFile, 'utf-8'));

// ── Junk card IDs to delete ──────────────────────────────────────────────────
const DELETE_IDS = new Set([
  '51252494', // So study all departments in google doc
  '7f32cdcc', // Know all Vitals and ranges (meta instruction)
  '1dd3ccd3', // Study patient care (meta)
  '8bd6eda1', // Green = lower right rib margin (incomplete ECG note)
  'fcf2bec4', // Major Content Area Performance (header)
  '9183570d', // Basic Science 15 questions (exam breakdown row)
  '5c389511', // Anatomy and Physiology 12 questions
  'e9e7254d', // Clinical Patient Care 81 questions
  '81e86497', // General Patient Care 46 questions
  'c853229b', // Infection Control 12 questions
  'f84c9932', // Testing and Laboratory Procedures 8 questions
  '2192a237', // Phlebotomy 10 questions
  '26704f26', // EKG and Cardiovascular Testing 8 questions
  '6787b1f7', // Patient Care Coordination 25 questions
  'dbcf9c47', // Administrative Assisting 20 questions
  'f2f40c81', // Communication and Customer Service 8 questions
  '45ceef14', // Medical Law and Ethics 7 questions
  '6ec8fd56', // What kind of doctor treats xyz disease? (template placeholder)
  'ef441812', // When vitals are bad (meta prompt)
  'c568c2f7', // How to give CPR (meta prompt)
  'ae0224d1', // Drug testing, DNA paternity testing (meta)
  '84cb0878', // At what age and how often are routine exams done? (meta)
  '2129c851', // What organization governs emergencies? (meta)
  '15e9b43e', // Confine the area by closing all doors (orphan fragment)
  '467ed728', // Always reflect the patient's point of view (orphan note)
  'd39a5ca9', // CMS~ center for Medicaid — covered by better card
  '76452f',   // Circulatory (orphan answer; question card is its own bad card)
]);

// ── Exact definition patches for short/wrong defs ────────────────────────────
// Key = card term (exact match), value = new definition
const DEF_PATCHES: Record<string, string> = {
  'Percussion': 'A physical examination technique in which the clinician taps a body surface (usually with fingers) to assess underlying structures by the sound produced; used to detect fluid, air, or solid masses.',
  'IV': 'Intravenous — administration of fluids, medications, or blood directly into a vein. Standard IV catheter insertion angle is approximately 15–30 degrees.',
  'Bradycardia': 'Abnormally slow heart rate, defined as fewer than 60 beats per minute in adults. Symptoms may include fatigue, dizziness, syncope, and shortness of breath.',
  'Hx': 'History — abbreviation used in medical documentation to refer to a patient\'s past medical history (PMH), including prior illnesses, surgeries, medications, and allergies.',
  'Bx': 'Biopsy — the removal of a tissue sample from the body for laboratory examination to determine the presence, cause, or extent of disease, especially cancer.',
  'Purulent': 'Containing, consisting of, or discharging pus; indicative of bacterial infection. Purulent drainage is typically thick, yellow-green, and foul-smelling.',
  'ETOH': 'Ethanol (alcohol) — abbreviation used in medical records. Often documented in patient history regarding alcohol consumption or intoxication. Example: "ETOH abuse" means alcohol use disorder.',
  'Precordial leads': 'The six chest (precordial) leads of an ECG: V1, V2, V3, V4, V5, and V6. They measure electrical activity of the heart in the horizontal plane.',
  'Colored part of the eye': 'The iris — the pigmented ring-shaped membrane of the eye that controls the size of the pupil and thus the amount of light entering the eye.',
  'Steno': 'A prefix meaning narrow or constricted. Example: stenosis = abnormal narrowing of a passage or opening (e.g., aortic stenosis).',
  'ECG speed': 'Standard ECG paper speed is 25 mm/second. Each small square = 0.04 sec; each large square = 0.20 sec. Used to calculate heart rate and intervals.',
  'the prefix ab': 'Ab- means away from (e.g., abduction = moving a limb away from the midline of the body).',
  'the prefix peri': 'Peri- means around or surrounding (e.g., pericardium = the sac surrounding the heart; periosteum = membrane around bone).',
  'Drugs metabolize where': 'Most drugs are metabolized (broken down) in the liver by cytochrome P450 enzymes. The kidneys then excrete the metabolites in urine.',
  'Stores urine': 'The urinary bladder stores urine produced by the kidneys until it is excreted through the urethra during urination (micturition).',
  'Not part of the axial skeleton': 'The scapula (shoulder blade) is part of the appendicular skeleton, not the axial skeleton. The axial skeleton includes the skull, vertebral column, and rib cage.',
  'Male: 0': 'Erythrocyte Sedimentation Rate (ESR) normal range for males: 0–17 mm/hr. ESR measures how quickly red blood cells settle in a tube; elevated in inflammation.',
  'Female: 0': 'Erythrocyte Sedimentation Rate (ESR) normal range for females: 0–27 mm/hr. Higher than male range; both increase with age and in inflammatory conditions.',
};

// ── Q&A pair merges: [questionId, answerId, newTerm, newDefinition, category?] ─
// question card gets updated, answer card gets deleted
const QA_MERGES: [string, string, string, string, string?][] = [
  ['3561e67f', '0314a1cf',
    'Inguinal region',
    'The inguinal region pertains to the groin — the area where the abdomen meets the thigh. Important clinically for assessing hernias and lymph nodes.',
    'Anatomy'],
  ['b2e4a74a', '0d8a8a79',
    'Layers of the heart',
    'Three layers: endocardium (inner smooth lining), myocardium (middle muscular layer that pumps blood), and epicardium/pericardium (outer sac). The endocardium and myocardium are the two primary structural layers.',
    'Anatomy'],
  ['41a98bb6', '2ace0361',
    'Lymphatic system organs and tissues',
    'Thymus, spleen, tonsils, and adenoids — along with lymph nodes and lymphatic vessels throughout the body.',
    'Anatomy'],
  ['40f5d20b', '775155a3',
    'Frontal (coronal) plane',
    'The frontal/coronal plane divides the body into anterior (front) and posterior (rear) sections.',
    'Anatomy'],
  ['3be4997b', '46e26857',
    'Sympathetic nervous system (fight-or-flight)',
    'Responsible for fight-or-flight responses: dilation of bronchi, increased heart rate and blood pressure, pupil dilation, decreased digestive activity, and release of epinephrine.',
    'Anatomy'],
  ['b69abc72', 'f3765e42',
    'Strabismus',
    'An eye condition causing misalignment ("cross-eye" or "wall-eye" appearance) where both eyes do not focus on the same point simultaneously. Treated with corrective lenses, patching, or surgery.',
    'Anatomy'],
  ['baee545d', '6111fca8',
    'HIV (Human Immunodeficiency Virus)',
    'The cause of AIDS (Acquired Immunodeficiency Syndrome). HIV attacks and destroys CD4+ T-helper cells, progressively weakening the immune system.',
    'Infection Control'],
  ['3087d5d5', '76ffaf5d',
    'Epigastric region',
    'Located in the upper middle abdomen, directly below (distal to) the sternum and above the umbilical region. Contains the stomach, liver, and pancreas.',
    'Anatomy'],
  ['a11c616b', '2c297490',
    'Collagen',
    'A fibrous structural protein found in the dermis; the most abundant protein in the human body. Provides tensile strength to skin, tendons, ligaments, and bone.',
    'Anatomy'],
  ['cbe59a1f', '99fdfcd4',
    'Nonverbal communication',
    'Conveys meaning without words. Best example: body language — includes facial expressions, posture, gestures, eye contact, and interpersonal distance.',
    'Communication'],
  ['02000d6f', '36688bd0',
    'Three elements of basic communication',
    'Message, sender, and receiver — all three must be present for communication to occur.',
    'Communication'],
  ['855f4294', '9f0dea91',
    'Verbal communication with patients',
    'Use language at the patient\'s educational level — avoid medical jargon, speak clearly, and confirm understanding.',
    'Communication'],
  ['338815bb', 'dec14b4c',
    'Communicating with difficult/challenging patients',
    'Exhibit a diplomatic attitude — remain calm, empathetic, and professional; listen actively and avoid being dismissive.',
    'Communication'],
  ['e86ae98f', 'ef39b135',
    'Proper flow of communication',
    'Message → response → clarification → feedback. Each step ensures the message was understood and any misunderstanding is corrected.',
    'Communication'],
  ['ce2dd021', '49467e28',
    'Avoiding breach of confidentiality',
    'Never discuss patient information in public areas (hallways, elevators, waiting rooms). Use private spaces and secure systems for all patient communications.',
    'Legal/Consent'],
  ['9157567a', '88ed66a',
    'Patient interview communication techniques',
    'Reflecting (repeating key points back) and summarizing (condensing what was said) to confirm understanding and encourage the patient to elaborate.',
    'Communication'],
  ['273e7481', '147a0b7b',
    'Communicating with pediatric patients',
    'Do not lie to a child — state the truth in age-appropriate language. Speak directly to the child when possible and involve parents.',
    'Communication'],
  ['a7c77124', 'b0623613',
    'Providing patient education',
    'Encourage questions from the patient, assess comprehension, use plain language, provide written materials, and document all teaching in the medical record.',
    'Communication'],
  ['710c6d6f', '2d879f76',  // psychomotor / affective — the psychomotor card (710)
    'Affective domain of learning',
    'The domain of learning that includes values, attitudes, beliefs, and opinions. Patient education that addresses emotions and motivation targets the affective domain.',
    'Communication'],
  ['5530155', '436632ef',
    'Diction',
    'The style of speaking and enunciating words clearly. Good diction ensures messages are understood; important for professional telephone and in-person communication.',
    'Communication'],
  ['e151c6', '7d60819c',
    'Cranial nerve I — Olfactory nerve',
    'Related to the sense of smell. Carries impulses from olfactory receptors in the nasal mucosa to the olfactory bulb in the brain.',
    'Anatomy'],
  ['e707c326', '84b847fb',  // "to set the stage for successful communication" → self image
    'Self-image in communication',
    'A positive self-image is the foundation for successful communication. How you perceive yourself affects how you interact with patients and colleagues.',
    'Communication'],
  ['660ce2dd', '49467e28',
    'Avoiding breach of confidentiality',
    'Avoid discussing patient problems in the office hallway or any public area.',
    'Legal/Consent'],
  ['657e86ae', 'ef39b135',  // duplicate proper flow — will be cleaned by dedup
    'Proper flow of communication',
    'Message → response → clarification → feedback.',
    'Communication'],
  ['43dfec7b', 'e86ae98f',
    'Professional relationship with patient',
    'Deliver patient care with objectivity; maintain professional boundaries while being empathetic. Keep personal feelings separate from patient care decisions.',
    'Communication'],
  ['664e707c', '84b847fb',
    'Setting stage for successful communication',
    'A positive self-image enables effective communication. Confidence, respect for the patient, and an open demeanor all set the stage.',
    'Communication'],
  ['102e86ae', 'ef39b135',
    'Proper flow of communication',
    'Message → response → clarification → feedback.',
    'Communication'],
  ['be754b8e', '551394f8',  // "when assigned to answering the telephone" → diction
    'Telephone etiquette — diction',
    'When answering the telephone, use proper diction — speak clearly, enunciate words, and use a professional, friendly tone.',
    'Communication'],
];

// ── Build lookup maps ─────────────────────────────────────────────────────────
const byId = new Map<string, any>(cards.map((c: any) => [c.id, c]));
const toDelete = new Set(DELETE_IDS);

// Apply Q&A merges
let mergeCount = 0;
for (const [qId, aId, newTerm, newDef, newCat] of QA_MERGES) {
  const q = byId.get(qId);
  const a = byId.get(aId);
  if (!q || !a || qId === aId) continue;
  q.term = newTerm;
  q.definition = newDef;
  if (newCat) q.category = newCat;
  q.type = 'term';
  toDelete.add(aId);
  mergeCount++;
}

// Apply def patches
let patchCount = 0;
for (const c of cards) {
  if (DEF_PATCHES[c.term]) {
    c.definition = DEF_PATCHES[c.term];
    patchCount++;
  }
}

// Fix blank-term card (find it and delete)
for (const c of cards) {
  if (!c.term || !c.term.trim()) {
    toDelete.add(c.id);
  }
}

// Deduplicate by term (keep the one with longer/richer definition)
const seenTerms = new Map<string, any>();
for (const c of cards) {
  if (toDelete.has(c.id)) continue;
  const key = c.term.toLowerCase().trim();
  if (seenTerms.has(key)) {
    const existing = seenTerms.get(key);
    if (c.definition.length > existing.definition.length) {
      toDelete.add(existing.id);
      seenTerms.set(key, c);
    } else {
      toDelete.add(c.id);
    }
  } else {
    seenTerms.set(key, c);
  }
}

// Filter out deleted cards
const result = cards.filter((c: any) => !toDelete.has(c.id));

// Final sanity: remaining same-term-def that are not clearly notes
const stillBad = result.filter((c: any) => c.term === c.definition);

console.log(`Merged: ${mergeCount} Q&A pairs`);
console.log(`Patched: ${patchCount} short definitions`);
console.log(`Deleted: ${toDelete.size} cards`);
console.log(`Final count: ${result.length} (was ${cards.length})`);
console.log(`Still same-term-def: ${stillBad.length}`);
stillBad.slice(0, 20).forEach((c: any) => console.log(' ', c.term.slice(0, 80)));

fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
console.log('Written:', outFile);
