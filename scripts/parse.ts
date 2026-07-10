#!/usr/bin/env node
/**
 * Usage: npx tsx scripts/parse.ts [source-data.txt]
 * Outputs: src/data/cards.json
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const srcFile = process.argv[2] ?? 'source-data.txt';
const outFile = path.join('src', 'data', 'cards.json');

const raw = fs.readFileSync(srcFile, 'utf-8');

// ── Category inference ────────────────────────────────────────────────────────
const CATEGORY_RULES: [RegExp, string][] = [
  // Infection Control / OSHA
  [/\b(OSHA|PPE|glove|mask|gown|sharps|bloodborne|biohazard|spill|steril|aseptic|disinfect|sanitiz|hand hygiene|standard precaution|nosocomial|isolation|quarantine|transmission|pathogen|microorganism|aerobic|anaerobic|streptococ|bacteria|virus|fungal|antiseptic|sanitation|quality control|MSDS|SDS|hazard)/i, 'Infection Control'],
  // Blood Draw / Phlebotomy
  [/\b(phlebotom|venipuncture|tube|draw order|butterfly|gauge|vacutainer|EDTA|SST|heparin|blood draw|specimen collect|hemolysis|hematoma|capillary|lancet|heel stick|PKU|ABG|centrifuge|microhematocrit|sodium citrate|inversion|fist|pump|tourniquet|antecubital|order of draw|yellow tube|blue tube|red tube|green tube|lavender|gray tube|gold tube|SPS|sodium fluoride)/i, 'Blood Draw'],
  // Vital Signs
  [/\b(vital sign|blood pressure|pulse|respiration|oxygen sat|SpO2|sphygmo|thermometer|tympanic|axillary|oral temp|Korotkoff|systolic|diastolic|hypertension|hypotension|tachycardia|bradycardia|tachypnea|bradypnea|apnea|fever|pyrexia|afebrile|temperature|anthropometric|height|weight|BMI|peak flow|spirometer)/i, 'Vital Signs'],
  // ECG/EKG
  [/\b(ECG|EKG|electrocard|lead|electrode|artifact|rhythm|atrial|ventricular|sinus|QRS|T wave|P wave|somatic tremor|wandering baseline|60 cycle|interference|cardioversion|defibrillat|pacemaker|fibrillat|flutter|tachycard|bradycard|ST segment|PR interval)/i, 'ECG/EKG'],
  // Urinalysis
  [/\b(urin|urinalysis|specific gravity|ketone|nitrite|dipstick|sediment|cast|catheter|midstream|clean catch|renal|kidney|nephr|bladder|cystitis|hematuria|proteinuria|glucosuria|pyuria|cholecystolithiasis|nephrolithiasis)/i, 'Urinalysis'],
  // Patient Positioning / Transfer
  [/\b(position|supine|prone|Fowler|Trendelenburg|lateral|recumbent|draping|wheelchair|Sims|lithotomy|dorsal|knee chest|body mechanic|transfer|lift|Hoyer|mechanical lift|sling|ambulate|gait|antiemboli|compression sock|sequential compression|DVT|edema)/i, 'Patient Positioning'],
  // Legal / Consent / Privacy
  [/\b(consent|HIPAA|privacy|confidential|legal|liability|scope of practice|ethics|advance directive|living will|POLST|power of attorney|malpractice|negligence|tort|libel|slander|defamation|chain of custody|Bill of Rights|Privacy Act|EMR|EHR|correcting error|cross out|initial)/i, 'Legal/Consent'],
  // Regulatory Bodies
  [/\b(AAMA|AMT|NCCT|NPI|CMS|CDC|CLIA|FDA|DEA|ADA|APA|CLSI|DOL|department of labor|regulatory|accredit|certification|licensure|waived test|controlled substance|Schedule II|narcotic|DEA number)/i, 'Regulatory Bodies'],
  // Medications / Pharmacology / Injections
  [/\b(medication|drug|dose|route|side effect|contraindic|pharmacol|prescription|OTC|narcotic|administer|injection|intradermal|subcutaneous|intramuscular|intravenous|subq|IM route|ID route|IV route|gauge needle|needle angle|Prozac|Albuterol|vasodilat|antiemetic|emetic|analgesic|antibiotic|insulin|epinephrine|nitroglycerin|schedule|dispensing)/i, 'Medications'],
  // Cardiovascular / Emergency
  [/\b(cardiac|cardiovascular|heart|CVA|stroke|TIA|myocardial|infarct|angina|shock|syncope|faint|CPR|AED|BLS|code|resuscit|pulse|circulation|artery|vein|blood clot|embol|thrombus|thrombosis|DVT|hemostasis|coagulat|clot|hemorrhage|hemothorax|hemostatic)/i, 'Cardiovascular'],
  // Respiratory
  [/\b(respirat|lung|pulmonary|asthma|bronch|pneumon|COPD|oxygen|O2|CO2|inhaler|nebulizer|peak flow|spirometer|SOB|dyspnea|apnea|hypox|cyanotic|cyanosis|tachypnea|breath|airway|sputum|ABG|pleural)/i, 'Respiratory'],
  // Endocrine / Diabetes
  [/\b(diabetes|diabetic|insulin|glucose|glyc|A1C|HbA1c|GTT|glucometer|blood sugar|hypoglycemic|hyperglycemic|endocrin|thyroid|TSH|FSH|LH|hormone|pancrea|adrenal|pituitary|diabetes insipidus)/i, 'Endocrine/Diabetes'],
  // OB/GYN / Reproductive
  [/\b(obstetric|gynecol|pregnan|prenatal|postnatal|trimester|menstrual|menses|amenorrhea|LMP|HCG|pregnancy test|pap smear|cervic|uterus|ovary|ovarian|vulva|vagina|Bartholin|mammograph|breast|prostate|STI|STD|contraceptive|birth control)/i, 'OB/GYN'],
  // Eyes / Ears / Sensory
  [/\b(Snellen|Ishihara|visual acuity|color blind|ophthalm|otoscope|audiometer|hearing test|ear canal|\bAS\b|\bAU\b|\bAD\b|\bOD\b|\bOS\b|\bOU\b)/i, 'Sensory Screening'],
  // Medical Abbreviations / Shorthand
  [/\b(BID|TID|QID|PRN|NPO|STAT|C&S|\bHx\b|\bSx\b|\bBx\b|\bTx\b|\bDx\b|\bRx\b|qh\b|q4h|q6h|AC\b|PC\b|\bHS\b|\bPO\b|\bSL\b|MMR|ETOH|WNL|ENT\b|VDRL|HEENT|PMH|ROS|HPI|abbreviation|shorthand)/i, 'Medical Abbreviations'],
  // Anatomy / Medical Terminology
  [/\b(prefix|suffix|root word|medical term|itis\b|emia\b|ology\b|oscopy\b|ostomy\b|ectomy\b|plasty\b|phleb|cyte\b|ICD|CPT|diagnosis|anatomy|physiology|muscle|bone|organ|tissue|nerve|spine|hepatic|gastro|nephro|dermat|cardio|neuro|endo|oph\b|rhin|stomat)/i, 'Anatomy & Terminology'],
  // Lab Values / Tests
  [/\b(lab value|reference range|normal range|CBC|BMP|CMP|lipid panel|HbA1c|PT\b|INR|platelet|WBC|RBC|hemoglobin|hematocrit|ESR|BUN|creatinine|sodium|potassium|chloride|electrolyte|culture|sensitivity|VDRL|Hemoccult|occult blood|guaiac)/i, 'Lab Values'],
  // Microbiology / Specimen
  [/\b(microbiology|culture|sensitivity|bacteria|organism|gram stain|aerobic|anaerobic|fungal|pathogen|reference lab|specimen|sputum|wound|swab|stool|feces|fecal)/i, 'Microbiology'],
  // Skin / Dermatology
  [/\b(skin|dermat|wound|suture|lacerat|incision|abrasion|contusion|ecchymosis|rash|lesion|alopecia|pediculosis|lice|vitiligo|pigment|integument|decubitus|pressure ulcer|purulent|exudate)/i, 'Dermatology'],
  // Scheduling / Admin
  [/\b(scheduling|booking|appointment|check.in|check.out|insurance|Medicaid|Medicare|CHAMPVA|Tricare|Blue Cross|billing|coding|referral|prior auth|co.pay|deductible|EOB|EHR|EMR|front desk|receptionist|greet)/i, 'Administrative'],
  // Holter / ECG extended
  [/\b(Holter|telemetry|precordium|manubrial|sternum|lead placement|chest lead|limb lead|electrode color|PR interval|QT interval|baseline|60-cycle|somatic)/i, 'ECG/EKG'],
  // Eye disorders
  [/\b(presbyopia|hyperopia|myopia|astigmat|cataract|glaucoma|macular|retina|conjunctiv|strabismus|diplopia|amblyopia|color blind|visual field|pupil|iris|cornea|colored part of the eye)/i, 'Ophthalmology'],
  // Ear disorders
  [/\b(otitis|tympan|eardrum|cochlea|vestibul|vertigo|tinnitus|cerumen|ear wax|hearing loss|audiogram)/i, 'Ear/ENT'],
  // Immunizations / Vaccines
  [/\b(vaccine|vaccin|immuniz|DTAP|pertussis|tetanus|MMR|measles|mumps|rubella|hepatitis B|flu shot|influenza|Tdap|polio|varicella|HPV|booster|titer)/i, 'Immunizations'],
  // Psychology / Behavior
  [/\b(Maslow|hierarchy|psycholog|behavior|grief|denial|anger|bargain|depress|accept|suppress|repress|regression|coping|mental health|anxiety|stress)/i, 'Psychology'],
  // GI / Digestive
  [/\b(digestive|gastrointestinal|GI\b|liver|cirrhosis|bile|gallbladder|sigmoid|colonoscopy|endoscopy|Hemoccult|stool|feces|nausea|emesis|vomit|ground emesis|emetic|antiemetic|uvula|esophag|stomach|intestin|colon|rectum|hepat|pancrea|spleen|splenomeg)/i, 'GI/Digestive'],
  // Musculoskeletal
  [/\b(skeleton|skeletal|axial|appendicular|lordosis|scoliosis|kyphosis|fracture|orthoped|musculoskeletal|tendon|ligament|cartilage|joint|arthritis|osteo|bursitis|tenodyn|quadrant|abdominal region|hypochondriac|epigastric|lumbar|umbilical|iliac|hypogastric)/i, 'Musculoskeletal'],
  // Blood types / Hematology
  [/\b(blood type|blood group|universal donor|universal recipient|Rh factor|antigen|antibody|hemoconcentration|hemoglobin|hematocrit|aphresis|autologous|homologous|transfusion|type and cross)/i, 'Hematology'],
  // CPR / Emergency
  [/\b(CPR|AED|BLS|ACLS|code blue|code pink|emergency|first aid|Heimlich|rescue breath|compression|defibrillat|resuscitat)/i, 'Emergency/CPR'],
  // Medical procedures / office
  [/\b(suture|lacerat|wound care|dressing|bandage|splint|cast|biopsy|spirometer|peak flow|nebuliz|denture|sigmoidoscopy|catheter|enema|irrigat|instillation|CPX|comprehensive physical|CPOE|quality assurance)/i, 'Clinical Procedures'],
];

function inferCategory(text: string): string {
  for (const [re, cat] of CATEGORY_RULES) if (re.test(text)) return cat;
  return 'General';
}

// ── Separator detection ───────────────────────────────────────────────────────
// Matches: "Term – def", "Term - def", "Term — def", "Term: def"
const SEP_RE = /^(.+?)\s*[–—\-]{1,2}\s*(.+)$/;
const COLON_RE = /^([A-Z][^:]{2,40}):\s*(.+)$/;

// Mnemonic heuristic: short all-caps sequence followed by explanation
const MNEMONIC_RE = /^([A-Z]{2,}(?:\s+[A-Z]+)*)\s*[-–—:]\s*(.+)/;

interface RawCard {
  id: string;
  term: string;
  definition: string;
  type: 'term' | 'note' | 'mnemonic';
  category: string;
  difficulty: 'unrated';
}

const cards: RawCard[] = [];
let noteCount = 0;
let termCount = 0;
let mnemonicCount = 0;

// Lines to skip — document headers, contact info, page markers
const SKIP_RE = /^(CCMA Review|medcareinfos|www\.|http|Page \d|Chapter \d+\s*$|\d+\s*$|study guide|table of contents|\.{3,})/i;

const lines = raw.split(/\r?\n/);
let i = 0;

while (i < lines.length) {
  const line = lines[i].trim();
  i++;
  if (!line) continue;
  if (SKIP_RE.test(line)) continue;

  // Mnemonic: e.g. "NLMEB – Never let monkeys eat bananas"
  const mnemonicMatch = line.match(MNEMONIC_RE);
  if (mnemonicMatch && mnemonicMatch[1].length <= 10) {
    // Consume continuation lines (indented or non-separator lines)
    let def = mnemonicMatch[2].trim();
    while (i < lines.length && lines[i].match(/^\s+/)) {
      def += ' ' + lines[i].trim();
      i++;
    }
    cards.push({
      id: crypto.randomUUID(),
      term: mnemonicMatch[1].trim(),
      definition: def,
      type: 'mnemonic',
      category: inferCategory(line),
      difficulty: 'unrated',
    });
    mnemonicCount++;
    continue;
  }

  // Term – definition
  const sepMatch = line.match(SEP_RE) ?? line.match(COLON_RE);
  if (sepMatch) {
    let [, term, def] = sepMatch;
    // Consume wrapped continuation lines
    while (i < lines.length) {
      const next = lines[i];
      if (!next.trim() || next.match(SEP_RE) || next.match(MNEMONIC_RE)) break;
      if (next.match(/^\s+/) || !next.match(/^[A-Z]/)) {
        def += ' ' + next.trim();
        i++;
      } else break;
    }
    cards.push({
      id: crypto.randomUUID(),
      term: term.trim(),
      definition: def.trim(),
      type: 'term',
      category: inferCategory(term + ' ' + def),
      difficulty: 'unrated',
    });
    termCount++;
    continue;
  }

  // Fallback: note card
  let note = line;
  while (i < lines.length && lines[i].match(/^\s+/)) {
    note += ' ' + lines[i].trim();
    i++;
  }
  cards.push({
    id: crypto.randomUUID(),
    term: note.slice(0, 80),
    definition: note,
    type: 'note',
    category: inferCategory(note),
    difficulty: 'unrated',
  });
  noteCount++;
}

fs.writeFileSync(outFile, JSON.stringify(cards, null, 2));

console.log(`\n✅ Parsed ${cards.length} cards → ${outFile}`);
console.log(`   📝 Terms/definitions : ${termCount}`);
console.log(`   🧠 Mnemonics         : ${mnemonicCount}`);
console.log(`   📌 Notes/fallbacks   : ${noteCount}`);
console.log('\nCategory breakdown:');
const cats: Record<string, number> = {};
for (const c of cards) cats[c.category] = (cats[c.category] ?? 0) + 1;
Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([cat, n]) => console.log(`   ${cat}: ${n}`));
