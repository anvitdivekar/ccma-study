/**
 * Fixes two categories of broken cards:
 * 1. Q&A pairs split across two cards (merges them: term=answer, def=question)
 * 2. Open-ended questions / notes with no real answer (provides correct answers)
 *
 * Run: npx tsx scripts/fix-cards.ts
 */
import fs from 'fs';
import path from 'path';

const outFile = path.join('src', 'data', 'cards.json');
const cards: any[] = JSON.parse(fs.readFileSync(outFile, 'utf-8'));

const QUESTION_RE = /\b(is|means|pertains to|are|called|defined as|known as|refers to)\s*\??$/i;

// ── Step 1: Merge Q&A pairs ────────────────────────────────────────────────
const merged: any[] = [];
let mergedCount = 0;
let i = 0;
while (i < cards.length) {
  const a = cards[i];
  const b = cards[i + 1];
  const aIsQ = a.term === a.definition && QUESTION_RE.test(a.term.trim());
  const bIsA = b && b.term === b.definition && !QUESTION_RE.test(b.term.trim()) && b.term.length < 100;
  if (aIsQ && bIsA) {
    // Merge: term = answer, definition = question phrasing (cleaned up)
    const question = a.term.trim().replace(/\s*\??\s*$/, '').replace(/^the (term|word|suffix|prefix)\s+/i, '').replace(/\s+(is|means|pertains to|are|called)$/, '');
    merged.push({
      ...b,
      term: b.term.trim(),
      definition: question.charAt(0).toUpperCase() + question.slice(1),
      type: 'term',
      category: b.category === 'General' ? a.category : b.category,
    });
    mergedCount++;
    i += 2;
  } else {
    merged.push(a);
    i++;
  }
}

console.log(`✅ Merged ${mergedCount} Q&A pairs`);

// ── Step 2: Patch open-ended / broken standalone cards ─────────────────────
// Map from term (or partial term) → correct definition
const PATCHES: Record<string, { term?: string; definition: string; type?: string; category?: string }> = {
  // Infection / color of infection signs
  'Know the signs of infections in term of color': {
    term: 'Signs of infection by color',
    definition: 'Red = inflammation/early infection; Yellow/Green = purulent (pus); Gray/Black = necrosis/gangrene; Orange = some fungal infections; Purple/Blue = bruising or deep tissue infection. Any non-clear/non-serous drainage warrants concern.',
    category: 'Infection Control',
  },
  // Tube inversion note
  'invert': {
    term: 'Blood tube inversion',
    definition: 'Blood collection tubes must be gently inverted (not shaken) to mix the additive with blood. Shaking causes hemolysis (RBC destruction). Number of inversions varies by tube: Yellow 8-10, Blue 2-4, Red 5, Green 8-10, Lavender/White 8-10, Gray 8.',
    category: 'Blood Draw',
  },
  // Infant length
  'Baby only have length not height': {
    term: 'Measuring infant length',
    definition: 'Infants have length (not height) because they cannot stand. Most important step: hold down the knee to fully extend the leg for an accurate measurement.',
    category: 'Vital Signs',
  },
  // Order of draw mnemonic
  '(young boys really get lovely wholesome girls)': {
    term: 'Order of draw mnemonic',
    definition: 'Young Boys Really Get Lovely Wholesome Girls → Yellow, Blue, Red, Green, Lavender, White, Gray — the correct order of draw for whole blood collection.',
    type: 'mnemonic',
    category: 'Blood Draw',
  },
  // Microhematocrit
  'Microhematocrit machine also separate the blood into components': {
    term: 'Microhematocrit machine',
    definition: 'Spins capillary tubes at high speed to separate blood into components: plasma (top), buffy coat (WBCs/platelets), and packed red cells (bottom). Used to determine hematocrit percentage.',
    category: 'Blood Draw',
  },
  // Allergies in RED
  'Allergies always written in RED': {
    term: 'Documenting allergies',
    definition: 'Allergies must always be documented in RED ink (or prominently highlighted in red in EMR/EHR) to ensure they are immediately visible to all healthcare providers and prevent adverse reactions.',
    category: 'Legal/Consent',
  },
  // Scheduling
  'Scheduling~ modified booking, double booking, etc.': {
    term: 'Appointment scheduling types',
    definition: 'Modified booking: scheduled appointments with built-in flexibility. Double booking: two patients scheduled at same time slot. Wave scheduling: multiple patients at start of each hour. Open booking: first-come first-served. Cluster: group similar appointments together.',
    category: 'Administrative',
  },
  // Insurance types
  'Insurance~ Medicaid /medicare/champva/tricare/blue cross shield/ 1199': {
    term: 'Health insurance types',
    definition: 'Medicaid: government insurance for low-income individuals. Medicare: federal insurance for 65+ or disabled. CHAMPVA: VA health program for dependents of disabled veterans. TRICARE: military health coverage. Blue Cross Blue Shield: private insurance. 1199: union health insurance fund.',
    category: 'Administrative',
  },
  // Needles/gauge/angle
  'Needles/gauge/angle/technique': {
    term: 'Injection needle gauge & angle',
    definition: 'Intradermal (ID): ¼–½ inch, 26 gauge, 5–15°. Subcutaneous (SQ): ¼–½ inch, 25 gauge, 45°. Intramuscular (IM): 1–3 inch, 21–23 gauge, 90°. Intravenous (IV): 25°.',
    category: 'Medications',
  },
  // BAC/BAL
  'Bac/bal blood alcohol content /level': {
    term: 'BAC / BAL',
    definition: 'Blood Alcohol Content/Level. Legal limit: 0.08% in most US states. Collected in gray-top tube (sodium fluoride/potassium oxalate). Chain of custody required when collected for legal/forensic purposes.',
    category: 'Blood Draw',
  },
  // Parkinson
  'Parkinson Disease how can one identify the disease along with somatic tremors': {
    term: 'Parkinson disease identification',
    definition: 'Identified by: resting tremor (pill-rolling), rigidity, bradykinesia (slow movement), and postural instability. On ECG, somatic tremors from Parkinson\'s appear as irregular baseline artifact. Patient must be relaxed and still during ECG recording.',
    category: 'ECG/EKG',
  },
  // Study infection transmission
  'Study infection transmission cycle': {
    term: 'Chain of infection',
    definition: '6 links: (1) Infectious agent (pathogen), (2) Reservoir (where it lives), (3) Portal of exit (how it leaves), (4) Mode of transmission (contact/droplet/airborne/vector), (5) Portal of entry (how it enters new host), (6) Susceptible host. Breaking any link stops infection.',
    category: 'Infection Control',
  },
  // Normal blood sugar
  'Normal blood sugar levels': {
    term: 'Normal blood glucose ranges',
    definition: 'Fasting: 70–99 mg/dL. Post-meal (2hr): <140 mg/dL. Pre-diabetes fasting: 100–125 mg/dL. Diabetes: ≥126 mg/dL fasting or ≥200 mg/dL random. HbA1c normal: <5.7%; pre-diabetes: 5.7–6.4%; diabetes: ≥6.5%.',
    category: 'Endocrine/Diabetes',
  },
  // TB/Mantoux
  'TB aka Mantoux Tuberculin skin test': {
    term: 'TB / Mantoux tuberculin skin test',
    definition: 'Intradermal injection of purified protein derivative (PPD) on the inner forearm. Read 48–72 hours later. Positive: induration (raised bump, not just redness) ≥10 mm (≥5 mm in immunocompromised). Positive result requires follow-up chest X-ray.',
    category: 'Infection Control',
  },
  // GTT
  'GTT can be obtained by a drink, capillary puncture such as the glucometer or A1C': {
    term: 'GTT (Glucose Tolerance Test)',
    definition: 'Glucose Tolerance Test. Patient fasts overnight, baseline glucose drawn, then drinks 75g glucose solution. Blood drawn at 1hr and 2hr intervals. Can also use glucometer via capillary puncture. Normal 2hr result: <140 mg/dL. ≥200 mg/dL = diabetes.',
    category: 'Endocrine/Diabetes',
  },
  // Disinfect
  'Disinfect = free of germs': {
    term: 'Disinfect',
    definition: 'Process of eliminating most pathogenic microorganisms (but not necessarily spores) from surfaces. Disinfect = free of most germs. Sterilize = free of ALL microorganisms including spores. Sanitize = reduce to safe levels.',
    category: 'Infection Control',
  },
  // Bronchitis
  'Bronchitis': {
    term: 'Bronchitis',
    definition: 'Inflammation of the bronchial tubes. Acute: usually viral, productive cough, resolves in 3 weeks. Chronic: COPD-related, cough with mucus ≥3 months/year for 2+ years. Treatment: bronchodilators, rest, fluids. MA role: peak flow measurement, nebulizer treatments.',
    category: 'Respiratory',
  },
  // Vasodilator
  'Vasodilator': {
    term: 'Vasodilator',
    definition: 'Drug or substance that causes widening (dilation) of blood vessels, lowering blood pressure and increasing blood flow. Examples: nitroglycerin (angina), ACE inhibitors, calcium channel blockers. Opposite: vasoconstrictor (narrows vessels, raises BP).',
    category: 'Medications',
  },
  // q4h
  'very 4 hours': {
    term: 'q4h',
    definition: 'Every 4 hours (from Latin "quaque 4 hora"). Common medication dosing abbreviation. Related: qh = every hour, q6h = every 6 hours, q8h = every 8 hours, BID = twice daily, TID = three times daily, QID = four times daily.',
    category: 'Medical Abbreviations',
  },
  // Suture removal
  'Suture removal': {
    term: 'Suture removal timing',
    definition: 'Face/neck: 3–5 days. Scalp: 7–10 days. Trunk/extremities: 7–10 days. Joints/hands: 10–14 days. Removed with suture removal scissors and forceps. MA role: remove per physician order, document, apply steri-strips if needed.',
    category: 'Clinical Procedures',
  },
  // Radiation
  'Prolonged exposure to radiation 🡪 can result in cancer': {
    term: 'Radiation exposure risk',
    definition: 'Prolonged or repeated radiation exposure can result in cancer (especially leukemia, thyroid cancer). Precautions: lead apron/shield for patients, MA steps out of room during X-rays, dosimeter badge worn by staff to track cumulative exposure.',
    category: 'OSHA/Safety',
    category2: 'Infection Control',
  },
  // Holter monitor blank
  'Holter monitor –': {
    term: 'Holter monitor',
    definition: 'Portable ECG device worn for 24–48 hours to continuously record heart rhythm. Patient keeps a diary of activities and symptoms. Used to detect intermittent arrhythmias not captured on a standard 12-lead ECG. MA role: apply electrodes, instruct patient on diary keeping.',
    category: 'ECG/EKG',
  },
  // ECG electrode colors
  'Electrodes color': {
    term: 'ECG electrode placement colors',
    definition: 'Limb leads: RA=White, LA=Black, RL=Green, LL=Red. Mnemonic: "White on right, smoke (black) over fire (red), green=ground." Chest leads V1–V6: Red, Yellow, Green, Blue, Orange, Violet (left to right).',
    category: 'ECG/EKG',
  },
  // Intervals
  'Intervals': {
    term: 'ECG intervals (normal values)',
    definition: 'PR interval: 0.12–0.20 sec (3–5 small boxes). QRS complex: <0.12 sec (<3 small boxes). QT interval: 0.36–0.44 sec. ST segment: isoelectric (flat). Each small box = 0.04 sec; each large box = 0.20 sec.',
    category: 'ECG/EKG',
  },
  // Systolic/diastolic
  'Systolic/diastolic': {
    term: 'Systolic vs. diastolic BP',
    definition: 'Systolic (top number): pressure when heart contracts/pumps. Diastolic (bottom number): pressure when heart relaxes between beats. Normal: <120/<80 mmHg. Hypertension stage 1: 130–139/80–89. Stage 2: ≥140/≥90. Hypertensive crisis: >180/>120.',
    category: 'Vital Signs',
  },
  // Holter diary
  'Holter monitor, journals/diary. Off monitor, stay on monitor, telemetry monitor': {
    term: 'Holter monitor patient instructions',
    definition: 'Patient keeps diary of daily activities and symptoms (chest pain, palpitations, dizziness) with exact times. Must stay on monitor — no showering/bathing (water damages electrodes). Telemetry: hospital-based continuous remote cardiac monitoring via wireless transmitter.',
    category: 'ECG/EKG',
  },
  // 9 quadrants
  'The 9 quadrants': {
    term: 'The 9 abdominal regions',
    definition: 'Right hypochondriac, Epigastric, Left hypochondriac (top row); Right lumbar, Umbilical, Left lumbar (middle row); Right iliac (inguinal), Hypogastric (pubic), Left iliac (inguinal) (bottom row). Used to describe location of organs and pain.',
    category: 'Anatomy & Terminology',
  },
  // Individual quadrant names
  'R/L hypochondriac': {
    term: 'Right/Left hypochondriac region',
    definition: 'Upper right and upper left abdominal regions, below the cartilage of the ribs. Right contains: liver, gallbladder, right kidney. Left contains: stomach, spleen, left kidney.',
    category: 'Anatomy & Terminology',
  },
  'Epigastric': {
    term: 'Epigastric region',
    definition: 'Central upper abdominal region, between the hypochondriac regions. Contains: stomach, liver (part), pancreas (part). Pain here can indicate gastritis, GERD, peptic ulcer, or cardiac event (referred pain).',
    category: 'Anatomy & Terminology',
  },
  'R/L lumbar': {
    term: 'Right/Left lumbar region',
    definition: 'Middle right and left abdominal regions (flank areas). Right contains: ascending colon, right kidney. Left contains: descending colon, left kidney. Flank pain often indicates kidney issues.',
    category: 'Anatomy & Terminology',
  },
  'Umbilical': {
    term: 'Umbilical region',
    definition: 'Central abdominal region surrounding the navel (umbilicus). Contains: small intestines, transverse colon. Umbilical pain can indicate appendicitis (early), intestinal obstruction, or hernia.',
    category: 'Anatomy & Terminology',
  },
  'R/L iliac': {
    term: 'Right/Left iliac (inguinal) region',
    definition: 'Lower right and left abdominal regions. Right iliac contains: appendix, cecum — RLQ pain = appendicitis (McBurney\'s point). Left iliac contains: sigmoid colon. Also site of inguinal hernia.',
    category: 'Anatomy & Terminology',
  },
  'hypogastric': {
    term: 'Hypogastric (pubic) region',
    definition: 'Central lower abdominal region below the umbilical region. Contains: urinary bladder, uterus (females), sigmoid colon. Pain here may indicate UTI, bladder infection, or reproductive organ issues.',
    category: 'Anatomy & Terminology',
  },
  // Maslow
  'Suppression, depression, regression, grieve, anger, denial,': {
    term: 'Defense mechanisms / grief stages',
    definition: 'Kübler-Ross grief stages: Denial, Anger, Bargaining, Depression, Acceptance (DABDA). Defense mechanisms: suppression (conscious blocking), repression (unconscious), regression (child-like behavior), denial (refusing reality). Maslow\'s hierarchy: Physiological → Safety → Love/Belonging → Esteem → Self-Actualization.',
    category: 'Psychology',
  },
  // ECG calculations
  '** ECG calculations. 1500/number of small boxes……. 300/number of large boxes..': {
    term: 'ECG heart rate calculation',
    definition: 'Method 1: 1500 ÷ number of small boxes between R waves = HR (bpm). Method 2: 300 ÷ number of large boxes between R waves = HR (bpm). Method 3: Count QRS complexes in 6-second strip × 10 = HR. Normal HR: 60–100 bpm.',
    category: 'ECG/EKG',
  },
  // EKG artifacts
  'EKG artifacts , one example would be somatic tremors': {
    term: 'EKG artifacts',
    definition: 'Somatic tremor: irregular baseline from patient movement/shaking (e.g., Parkinson\'s, shivering). 60-cycle (AC) interference: thick fuzzy baseline from electrical equipment. Wandering baseline: gradual baseline drift from poor electrode contact or breathing. Fix: reposition electrodes, ask patient to relax, remove interfering devices.',
    category: 'ECG/EKG',
  },
  // Urine/stool
  '* cannot mix urine with stool for stool test because the sterile urine will kill': {
    term: 'Stool specimen collection precaution',
    definition: 'Do NOT mix urine with stool specimen — sterile urine will kill fecal bacteria needed for culture/sensitivity testing. Collect stool in a dry, clean container. Instruct patient to urinate first, then collect stool.',
    category: 'Microbiology',
  },
  // Sperm collection
  '* sperm collected in a STERILE cup must be tested within 2 hours/body temp': {
    term: 'Semen specimen collection',
    definition: 'Collected in a sterile cup, must be transported at body temperature (kept warm, e.g., under arm) and tested within 2 hours of collection. Used for semen analysis (count, motility, morphology). Refrigeration kills sperm.',
    category: 'Microbiology',
  },
  // Sputum
  '* sputum samples are sent to microbiology reference labs': {
    term: 'Sputum specimen handling',
    definition: 'Sputum (mucus from deep in lungs, not saliva) sent to microbiology/reference lab for culture & sensitivity. Best collected in morning before eating. Patient takes deep breath, coughs deeply, spits into sterile container. Used to diagnose TB, pneumonia, bronchitis.',
    category: 'Microbiology',
  },
  // N95
  '* N95 respirator mask used when near patients with airborne pathogens for ex: Te': {
    term: 'N95 respirator mask',
    definition: 'Required PPE for airborne precautions (TB, measles, varicella/chickenpox, COVID-19). Filters ≥95% of airborne particles. Must be fit-tested. Surgical masks only protect against droplet transmission, NOT airborne. OSHA requires N95 for airborne pathogens.',
    category: 'Infection Control',
  },
  // Black/White electrode placement
  'Black = left manubrial border of sternum': {
    term: 'ECG limb lead placement — LA (Left Arm)',
    definition: 'Black electrode = Left Arm (LA). Placed on left manubrial border of sternum or left wrist/arm. Mnemonic: "Smoke (black) rises on the left." White=RA (right arm), Black=LA (left arm), Red=LL (left leg), Green=RL (right leg/ground).',
    category: 'ECG/EKG',
  },
  'White = right manubrial border of sternum': {
    term: 'ECG limb lead placement — RA (Right Arm)',
    definition: 'White electrode = Right Arm (RA). Placed on right manubrial border of sternum or right wrist/arm. Mnemonic: "White on right." White=RA, Black=LA, Red=LL, Green=RL (ground).',
    category: 'ECG/EKG',
  },
  // Holter diary instruction
  'Patients must document everything they do that day': {
    term: 'Holter monitor patient diary',
    definition: 'During Holter monitoring, patients must log all activities (exercise, meals, sleep, stress) and any symptoms (chest pain, palpitations, dizziness, shortness of breath) with exact times. The diary is correlated against ECG recordings to identify triggers for arrhythmias.',
    category: 'ECG/EKG',
  },
  // Precordium
  'Precordium': {
    term: 'Precordium',
    definition: 'The region of the chest wall overlying the heart and lower thorax. Chest (precordial) leads V1–V6 are placed across the precordium. V1: right sternal border 4th ICS; V2: left sternal border 4th ICS; V3: between V2 and V4; V4: 5th ICS midclavicular line; V5: anterior axillary line; V6: midaxillary line.',
    category: 'ECG/EKG',
  },
  // Maslow hierarchy
  'Hierarchy of Maslow': {
    term: "Maslow's Hierarchy of Needs",
    definition: '5 levels (bottom to top): (1) Physiological — air, water, food, sleep; (2) Safety — security, employment, health; (3) Love/Belonging — relationships, friendship; (4) Esteem — confidence, achievement, respect; (5) Self-Actualization — reaching full potential. Must meet lower needs before higher ones.',
    category: 'Psychology',
  },
  // PR interval
  'PR = .012': {
    term: 'PR interval normal value',
    definition: 'Normal PR interval: 0.12–0.20 seconds (3–5 small boxes on ECG paper). Prolonged PR (>0.20 sec) = 1st degree heart block. Short PR (<0.12 sec) = pre-excitation (WPW syndrome). Measured from start of P wave to start of QRS.',
    category: 'ECG/EKG',
  },

  // ── Anatomy floating answer cards ────────────────────────────────────────
  'away from': { term: 'Abduction / Ab-', definition: 'Ab- prefix means "away from." Abduction = movement away from the midline. Opposite: adduction (toward midline). Example: lifting arm out to the side = abduction.', category: 'Anatomy & Terminology' },
  'around': { term: 'Peri-', definition: 'Prefix meaning "around" or "surrounding." Examples: pericardium (around the heart), periosteum (around bone), peripheral (around the outer edge).', category: 'Anatomy & Terminology' },
  'face and neck': { term: 'Cervicofacial', definition: 'Pertaining to the face and neck. Cervico- = neck; facial = face. Example: cervicofacial liposuction removes fat from neck and jaw area.', category: 'Anatomy & Terminology' },
  'nose and throat': { term: 'Rhinolaryngeal / Rhinopharyngeal', definition: 'Pertaining to the nose and throat. Rhino- = nose; pharynx = throat. ENT (ear, nose, and throat) specialist also called otolaryngologist.', category: 'Anatomy & Terminology' },
  'diaphragm': { term: 'Diaphragm', definition: 'Dome-shaped muscle separating thoracic (chest) and abdominal cavities. Primary muscle of breathing — contracts and flattens during inhalation (increases thoracic volume), relaxes during exhalation. Also: contraceptive barrier device.', category: 'Anatomy & Terminology' },
  'sebaceous': { term: 'Sebaceous glands', definition: 'Oil-secreting glands in the skin, usually attached to hair follicles. Secrete sebum (oil) that lubricates skin and hair, prevents drying. Overactivity causes acne. Located everywhere except palms and soles.', category: 'Anatomy & Terminology' },
  'red bone marrow': { term: 'Red bone marrow', definition: 'Site of hematopoiesis (blood cell production). Produces RBCs, WBCs, and platelets. Found in spongy bone of sternum, ribs, vertebrae, pelvis, and ends of long bones. Yellow bone marrow stores fat and is found in shaft of long bones.', category: 'Anatomy & Terminology' },
  'ischium': { term: 'Ischium', definition: 'The lower and posterior part of the hip bone (os coxae). Part of the pelvic girdle. The ischial tuberosity ("sitting bone") bears weight when seated. The three parts of the hip bone: ilium (top), ischium (back-bottom), pubis (front).', category: 'Musculoskeletal' },
  'spleen': { term: 'Spleen', definition: 'Largest lymphoid organ, located in the left upper quadrant (LUQ). Functions: filters blood, destroys old/damaged RBCs, stores blood, immune response (produces lymphocytes/antibodies). Splenomegaly = enlarged spleen. Ruptured spleen = emergency.', category: 'Anatomy & Terminology' },
  'larynx': { term: 'Larynx', definition: 'Voice box. Located between pharynx and trachea. Contains vocal cords (vocalis). Epiglottis covers larynx during swallowing to prevent aspiration. Laryngitis = inflammation. Laryngoscopy = visual exam.', category: 'Anatomy & Terminology' },
  'anaerobic': { term: 'Anaerobic', definition: 'Living or occurring without oxygen. Anaerobic bacteria cause infections in deep wounds (e.g., C. difficile, tetanus, gas gangrene). Anaerobic specimens must be collected without exposure to air and transported in special anaerobic transport media.', category: 'Microbiology' },
  'renal pelvis': { term: 'Renal pelvis', definition: 'Funnel-shaped structure at the center of the kidney that collects urine from the calyces and funnels it into the ureter. Pyelonephritis = infection of renal pelvis and kidney. Pyeloplasty = surgical repair.', category: 'Urinalysis' },
  'Perineum': { term: 'Perineum', definition: 'Diamond-shaped region between the thighs. In females: area between vaginal opening and anus. In males: area between scrotum and anus. Site of perineal lacerations during childbirth (episiotomy). Important for perineal care in catheter patients.', category: 'Anatomy & Terminology' },
  'ectopic': { term: 'Ectopic pregnancy', definition: 'Fertilized egg implants outside the uterus, most commonly in the fallopian tube. Signs: sharp one-sided pelvic pain, vaginal bleeding, positive HCG. Medical emergency — can cause tube rupture and internal hemorrhage. Treated with methotrexate or surgery.', category: 'OB/GYN' },
  'isotonic': { term: 'Isotonic solution', definition: 'Solution with same osmolarity as blood (0.9% normal saline, lactated Ringer\'s). Does not cause cells to shrink or swell. Hypotonic: less concentrated — cells swell. Hypertonic: more concentrated — cells shrink (crenation). Used in IV fluids.', category: 'Medications' },
  'pericardium': { term: 'Pericardium', definition: 'Double-layered fibrous sac surrounding the heart. Outer layer: fibrous pericardium (anchors heart). Inner layer: serous pericardium (visceral and parietal). Pericardial fluid lubricates heart movement. Pericarditis = inflammation; pericardial effusion = fluid buildup.', category: 'Anatomy & Terminology' },
  'xiphoid process': { term: 'Xiphoid process', definition: 'Small cartilaginous extension at the inferior (bottom) tip of the sternum. Landmark for CPR hand placement (hands on lower half of sternum, ABOVE the xiphoid to avoid liver laceration). Ossifies in adulthood.', category: 'Anatomy & Terminology' },
  'deltoid': { term: 'Deltoid muscle', definition: 'Large triangular muscle of the shoulder. Primary IM injection site in adults (deltoid IM: 1–3 inch, 23 gauge, 90°). Landmark: 2–3 finger widths below the acromion process. Can give 1–2 mL. Not used for infants/toddlers (underdeveloped).', category: 'Medications' },
  'afferent neurons': { term: 'Afferent neurons (sensory)', definition: 'Carry nerve impulses FROM sensory receptors TO the brain/spinal cord. Mnemonic: Afferent = Arrive (to CNS). Efferent neurons = Exit (from CNS to muscles/glands). Interneurons connect afferent and efferent in the spinal cord.', category: 'Anatomy & Terminology' },
  'ventricles': { term: 'Cardiac ventricles', definition: 'Lower two chambers of the heart. Right ventricle: pumps deoxygenated blood to lungs via pulmonary artery. Left ventricle: pumps oxygenated blood to body via aorta (thicker wall, higher pressure). Ventricular fibrillation = life-threatening arrhythmia requiring AED/defibrillation.', category: 'Cardiovascular' },
  'olfactory nerve': { term: 'Olfactory nerve (CN I)', definition: 'Cranial nerve I. Responsible for sense of smell. Sensory fibers pass through the cribriform plate of the ethmoid bone to the olfactory bulb. Loss of smell = anosmia (can occur with COVID-19, head trauma, or zinc deficiency).', category: 'Anatomy & Terminology' },
  'pituitary gland': { term: 'Pituitary gland', definition: '"Master gland" located at the base of the brain in the sella turcica. Anterior pituitary: secretes TSH, FSH, LH, ACTH, GH, prolactin. Posterior pituitary: releases ADH (antidiuretic hormone) and oxytocin. Controlled by hypothalamus.', category: 'Endocrine/Diabetes' },
  'superior vena cava': { term: 'Superior vena cava (SVC)', definition: 'Large vein that drains deoxygenated blood from the upper body (head, neck, arms, thorax) into the right atrium. Inferior vena cava (IVC) drains lower body. Together = venae cavae. SVC syndrome: compression causing facial swelling, seen in lung cancer.', category: 'Cardiovascular' },
  'phagocytosis': { term: 'Phagocytosis', definition: 'Process by which white blood cells (especially neutrophils and macrophages) engulf and destroy pathogens, dead cells, and debris. "Cell eating." Key immune defense. Neutrophils are first responders; macrophages are long-term phagocytes.', category: 'Infection Control' },
  'pharynx': { term: 'Pharynx', definition: 'Throat — muscular tube connecting nasal/oral cavities to larynx and esophagus. Three sections: nasopharynx (behind nose), oropharynx (behind mouth), laryngopharynx (connects to larynx/esophagus). Site of tonsils, adenoids. Pharyngitis = strep throat.', category: 'Anatomy & Terminology' },
  'pneumothorax': { term: 'Pneumothorax', definition: 'Air in the pleural space (between lung and chest wall) causing lung collapse. Types: spontaneous (tall thin individuals), traumatic (penetrating injury), tension (life-threatening — air accumulates under pressure). Signs: sudden chest pain, dyspnea, absent breath sounds. Emergency.', category: 'Respiratory' },
  'epiglottis': { term: 'Epiglottis', definition: 'Leaf-shaped cartilaginous flap that covers the larynx during swallowing to prevent food/liquid from entering the airway. Epiglottitis: life-threatening inflammation (bacterial, esp. H. influenzae type B) — "tripod position," drooling, stridor. Emergency.', category: 'Anatomy & Terminology' },
  'small intestine': { term: 'Small intestine', definition: 'Primary site of nutrient absorption (~20 feet long). Three sections: duodenum (first 12 inches — receives bile/pancreatic enzymes), jejunum (middle), ileum (terminal — absorbs B12, bile salts). Villi increase surface area. Connects stomach to large intestine.', category: 'GI/Digestive' },
  'duodenum': { term: 'Duodenum', definition: 'First and shortest section of the small intestine (~12 inches/"12 fingers" wide). Receives chyme from stomach, bile from common bile duct, and pancreatic enzymes. Site of most peptic ulcers. Duodenoscopy = visual examination with scope.', category: 'GI/Digestive' },
  'testes and ovaries': { term: 'Gonads (testes & ovaries)', definition: 'Primary reproductive organs. Testes (male): produce sperm and testosterone. Ovaries (female): produce eggs (ova) and estrogen/progesterone. Also function as endocrine glands. FSH stimulates follicle development in ovaries; LH triggers ovulation.', category: 'OB/GYN' },
  'femur': { term: 'Femur', definition: 'Thigh bone — longest, strongest bone in the body. Connects hip (acetabulum) to knee (tibia/patella). Femoral artery runs medially — venipuncture landmark in emergencies. Femoral neck fractures common in elderly osteoporosis patients. Distal end has medial/lateral condyles.', category: 'Musculoskeletal' },
  'abdominal aorta': { term: 'Abdominal aorta', definition: 'Section of the descending aorta below the diaphragm, supplying blood to abdominal organs. Bifurcates at L4 into left and right common iliac arteries. Abdominal aortic aneurysm (AAA): bulging — risk of rupture, medical emergency. Screened via ultrasound.', category: 'Cardiovascular' },
  'amenorrhea': { term: 'Amenorrhea', definition: 'Absence of menstrual flow. Primary: no period by age 16. Secondary: cessation after normal cycles for ≥3 months. Causes: pregnancy (first rule out), stress, extreme weight loss/gain, PCOS, thyroid disorders, hyperprolactinemia. A (without) + meno (menses) + rrhea (flow).', category: 'OB/GYN' },
  'mitral valve': { term: 'Mitral valve (bicuspid valve)', definition: 'Two-leaflet valve between left atrium and left ventricle. Prevents backflow during left ventricular contraction. Mitral valve prolapse (MVP): most common valve disorder. Mitral stenosis: narrowing. Mitral regurgitation: leaking. Heart sound S1 ("lub") = mitral and tricuspid closing.', category: 'Cardiovascular' },
  'pulmonary artery': { term: 'Pulmonary artery', definition: 'Only artery in the body that carries deoxygenated blood. Exits the right ventricle, carries deoxygenated blood to the lungs for gas exchange. Pulmonary veins (4) carry oxygenated blood back to the left atrium — only veins carrying oxygenated blood.', category: 'Cardiovascular' },
  'aneurysm': { term: 'Aneurysm', definition: 'Abnormal bulging/weakening of an artery wall. Common sites: aorta (AAA), brain (berry aneurysm — causes subarachnoid hemorrhage if ruptured). Signs of rupture: sudden severe "thunderclap" headache (brain), severe abdominal/back pain (aorta). Medical emergency.', category: 'Cardiovascular' },
  'ileum': { term: 'Ileum', definition: 'Terminal section of the small intestine (last ~11 feet). Absorbs vitamin B12, bile salts, and remaining nutrients. Connects to large intestine at ileocecal valve. Crohn\'s disease commonly affects terminal ileum. Ileostomy: surgical opening of ileum to abdominal wall.', category: 'GI/Digestive' },
  'urethra': { term: 'Urethra', definition: 'Tube carrying urine from bladder to outside. Female: ~4 cm (shorter — higher UTI risk). Male: ~20 cm (also carries semen). Urethritis: inflammation (often STI). Catheter inserted through urethra for urinary drainage. Urethral meatus = external opening.', category: 'Urinalysis' },
  'endometrium': { term: 'Endometrium', definition: 'Inner lining of the uterus. Thickens under estrogen influence each cycle to prepare for implantation; sheds during menstruation (no pregnancy). Endometriosis: endometrial tissue outside uterus. Endometritis: inflammation. Endometrial cancer: most common GYN cancer.', category: 'OB/GYN' },
  'etiology': { term: 'Etiology', definition: 'The cause or origin of a disease or condition. Etiology of hypertension: often idiopathic (unknown); secondary causes include kidney disease, adrenal tumors. Knowing etiology guides treatment. Unknown etiology = idiopathic.', category: 'Medical Abbreviations' },
  'psoriasis': { term: 'Psoriasis', definition: 'Chronic autoimmune skin condition causing rapid skin cell turnover, resulting in thick, silvery-white scaly plaques on red patches. Commonly affects elbows, knees, scalp. Not contagious. Triggers: stress, infections, medications. Treated with topical steroids, biologics.', category: 'Dermatology' },
  'maxilla': { term: 'Maxilla', definition: 'Upper jaw bone. Largest bone of the face. Forms the hard palate, floor of orbit, and upper teeth socket. Paired bones that fuse in the midline. Fractures from facial trauma. Maxillary sinuses are the largest paranasal sinuses.', category: 'Anatomy & Terminology' },
  'clavicle': { term: 'Clavicle', definition: 'Collarbone. Connects sternum (breastbone) to scapula (shoulder blade). Most commonly fractured bone in the body (fall on outstretched hand or direct blow). "S"-shaped bone. Landmark for subclavian central line insertion.', category: 'Musculoskeletal' },
  'abduction': { term: 'Abduction', definition: 'Movement of a limb away from the midline of the body. Opposite: adduction (toward midline). Example: raising arm to the side = shoulder abduction. Hip abductors prevent Trendelenburg gait. Prefix: ab- = away from.', category: 'Anatomy & Terminology' },
  'cerebellum': { term: 'Cerebellum', definition: '"Little brain" at the back of the skull. Controls coordination, balance, and fine motor movements. Damage: ataxia (poor coordination), dysmetria, intention tremor. NOT responsible for consciousness (that\'s the cerebral cortex). Cerebrum = higher functions; cerebellum = coordination.', category: 'Anatomy & Terminology' },
  'cochlea': { term: 'Cochlea', definition: 'Snail-shaped structure in the inner ear responsible for hearing (converting sound vibrations to nerve impulses). Contains hair cells on the basilar membrane. Damage to cochlear hair cells causes sensorineural hearing loss (permanent). Connected to auditory nerve (CN VIII).', category: 'Ear/ENT' },
  'pancreas': { term: 'Pancreas', definition: 'Dual-function gland. Endocrine: islets of Langerhans — beta cells secrete insulin (lowers glucose), alpha cells secrete glucagon (raises glucose). Exocrine: secretes digestive enzymes (amylase, lipase, protease) into duodenum. Pancreatitis: inflammation, severe epigastric pain radiating to back.', category: 'Endocrine/Diabetes' },
  'thyroid gland': { term: 'Thyroid gland', definition: 'Butterfly-shaped gland in the neck. Produces T3 (triiodothyronine) and T4 (thyroxine) — regulate metabolism. Also produces calcitonin (lowers calcium). Hypothyroidism: low hormone, weight gain, fatigue, cold intolerance. Hyperthyroidism: high hormone, weight loss, tachycardia. TSH from pituitary controls thyroid.', category: 'Endocrine/Diabetes' },
  'sinoatrial node': { term: 'Sinoatrial (SA) node', definition: 'Natural pacemaker of the heart. Located in the right atrium. Generates electrical impulses at 60–100 bpm. Signal travels: SA node → AV node → Bundle of His → Purkinje fibers → ventricular contraction. Sinus rhythm = normal heart rhythm originating from SA node.', category: 'Cardiovascular' },
  'ascending aorta': { term: 'Ascending aorta', definition: 'First segment of the aorta, rising from the left ventricle. Gives rise to right and left coronary arteries (heart\'s own blood supply). Continues as aortic arch, then descending aorta. Aortic stenosis (valve narrowing) affects blood leaving ascending aorta.', category: 'Cardiovascular' },
  'uremia': { term: 'Uremia', definition: 'Buildup of waste products (urea, creatinine) in the blood due to kidney failure. Signs: fatigue, nausea, confusion, "uremic frost" (crystallized urea on skin), metallic taste. Treated with dialysis. Uremic pericarditis is a complication.', category: 'Urinalysis' },
  'quadriceps femoris': { term: 'Quadriceps femoris', definition: 'Group of 4 muscles on the anterior thigh: rectus femoris, vastus lateralis, vastus medialis, vastus intermedius. Function: extend the knee, flex the hip. Vastus lateralis = IM injection site for infants/toddlers. "Quad" = 4.', category: 'Anatomy & Terminology' },
  'brachial artery': { term: 'Brachial artery', definition: 'Main artery of the upper arm. Used for blood pressure measurement (stethoscope placed over brachial artery in antecubital fossa). Palpated on medial aspect of arm. Emergency BP site. Brachial pulse used in infant CPR.', category: 'Vital Signs' },
  'antigen': { term: 'Antigen', definition: 'Any substance (protein, polysaccharide, toxin) that triggers an immune response. Foreign antigens stimulate antibody production by B lymphocytes. ABO blood type antigens on RBC surface determine blood type. Antigen-antibody reaction = basis of blood typing, allergy, and infection response.', category: 'Lab Values' },
  'fibula': { term: 'Fibula', definition: 'Slender lateral bone of the lower leg. Does NOT bear significant weight (tibia does). Important as lateral ankle stability. "Fibula fracture" common in ankle sprains. Fibula is the thinner of the two lower leg bones. Fib- = fiber, small.', category: 'Musculoskeletal' },
  'cecum': { term: 'Cecum', definition: 'Blind pouch at the start of the large intestine, in the right iliac fossa (RIF). Appendix attaches to the cecum. Ileocecal valve connects ileum to cecum. Appendicitis: inflammation of appendix (pain begins periumbilical → migrates to RIF/McBurney\'s point).', category: 'GI/Digestive' },
  'kyphosis': { term: 'Kyphosis', definition: 'Excessive posterior curvature of the thoracic spine — "hunchback." Common in elderly osteoporosis. Distinguished from scoliosis (lateral curve) and lordosis (excessive lumbar curve/"swayback"). Can restrict breathing if severe. Seen from the side.', category: 'Musculoskeletal' },
  'Keratin': { term: 'Keratin', definition: 'Fibrous structural protein that forms hair, nails, and the outer layer (stratum corneum) of skin. Makes skin waterproof and protective. Keratinocytes are the main cells of the epidermis. Nails = hardened keratin plates protecting the fingertips.', category: 'Dermatology' },
  'presbyopia': { term: 'Presbyopia', definition: 'Age-related farsightedness — loss of near vision due to lens stiffening (typically after age 40). Cannot focus on close objects. Treated with reading glasses or bifocals. Distinguished from hyperopia (structural farsightedness from birth) and myopia (nearsightedness).', category: 'Ophthalmology' },
  'Prostate': { term: 'Prostate gland', definition: 'Walnut-sized gland in males, surrounds the urethra below the bladder. Produces fluid that nourishes and transports sperm. BPH (benign prostatic hyperplasia): common enlargement in older men → urinary retention, frequency. PSA test screens for prostate cancer. Digital rectal exam (DRE) for assessment.', category: 'Anatomy & Terminology' },
  'bartholin': { term: 'Bartholin glands', definition: 'Two small glands located on either side of the vaginal opening. Secrete mucus to lubricate the vagina. Bartholin cyst/abscess: duct blockage causing painful swelling, treated with warm soaks or incision and drainage.', category: 'OB/GYN' },
  'Pituitary': { term: 'Pituitary hormones', definition: 'Anterior: GH (growth), TSH (thyroid-stimulating), ACTH (adrenal-stimulating), FSH (follicle-stimulating), LH (luteinizing), prolactin (milk production). Posterior: ADH/vasopressin (water retention), oxytocin (uterine contraction, bonding). Controlled by hypothalamus via releasing hormones.', category: 'Endocrine/Diabetes' },
  'greenstick, closed': { term: 'Fracture types: greenstick & closed', definition: 'Greenstick: incomplete fracture where bone bends and cracks (does not break all the way through) — common in children whose bones are more flexible. Closed (simple): bone broken but skin intact. Open (compound): bone pierces skin — infection risk. Comminuted: bone shattered into fragments.', category: 'Musculoskeletal' },
  'fallopian tube': { term: 'Fallopian tubes (uterine tubes)', definition: 'Two tubes connecting ovaries to uterus (~4 inches each). Fimbriae sweep egg from ovary into tube after ovulation. Fertilization normally occurs in the ampulla of the fallopian tube. Ectopic pregnancy most common here. Salpingitis = infection (often PID from STI).', category: 'OB/GYN' },
  'nephron': { term: 'Nephron', definition: 'Functional filtering unit of the kidney (~1 million per kidney). Components: glomerulus (filtration), Bowman\'s capsule, proximal convoluted tubule, loop of Henle, distal convoluted tubule, collecting duct. Produces urine by filtration, reabsorption, and secretion. GFR measures kidney function.', category: 'Urinalysis' },
  'hypothalamus': { term: 'Hypothalamus', definition: 'Region of the brain controlling the pituitary gland via releasing hormones. Regulates: body temperature (thermoregulation), hunger, thirst, sleep, circadian rhythm, and autonomic functions. Links nervous and endocrine systems. Controls "fight or flight" via sympathetic nervous system.', category: 'Endocrine/Diabetes' },
  'aldosterone': { term: 'Aldosterone', definition: 'Mineralocorticoid hormone produced by adrenal cortex. Increases sodium (and water) reabsorption and potassium excretion by kidneys → raises blood pressure. Regulated by renin-angiotensin-aldosterone system (RAAS). Hyperaldosteronism (Conn\'s syndrome): hypertension + hypokalemia.', category: 'Endocrine/Diabetes' },
  'erythrocyte': { term: 'Erythrocyte (RBC)', definition: 'Red blood cell. Biconcave disc, no nucleus, lives ~120 days. Contains hemoglobin (Hgb) which carries oxygen. Normal count: males 4.5–5.5 million/µL; females 4.0–5.0 million/µL. Produced in red bone marrow. Destroyed by spleen/liver. Anemia = low RBC/Hgb.', category: 'Lab Values' },
  'carbon dioxide': { term: 'Carbon dioxide (CO2) transport', definition: 'Waste gas produced by cellular metabolism. Transported in blood three ways: (1) dissolved in plasma (~7%), (2) bound to hemoglobin as carbaminohemoglobin (~23%), (3) as bicarbonate ions HCO3- (~70%). Exhaled by lungs. Elevated CO2 = hypercapnia; decreased = hypocapnia.', category: 'Respiratory' },
  'GERD': { term: 'GERD (Gastroesophageal Reflux Disease)', definition: 'Chronic condition where stomach acid flows back (reflux) into the esophagus, causing heartburn, regurgitation, and esophageal damage. Treated with lifestyle changes, antacids, H2 blockers (Zantac), or PPIs (omeprazole). Complications: Barrett\'s esophagus, esophageal cancer.', category: 'GI/Digestive' },
  'SOAP notes:': { term: 'SOAP notes', definition: 'Standard medical documentation format. S = Subjective (what patient says/reports). O = Objective (what provider observes/measures — vitals, exam findings). A = Assessment (diagnosis/impression). P = Plan (treatment, labs, referrals, follow-up). Used in all clinical notes.', category: 'Legal/Consent' },
  'RACE:': { term: 'RACE — Fire emergency protocol', definition: 'R = Rescue (rescue people in danger). A = Alarm (pull fire alarm, call 911). C = Contain (close doors to contain fire/smoke). E = Extinguish/Evacuate (use fire extinguisher if safe, or evacuate). PASS for extinguisher: Pull pin, Aim, Squeeze, Sweep.', category: 'OSHA/Safety' },
  'Chain of Infection': { term: 'Chain of infection', definition: '6 links: (1) Infectious agent, (2) Reservoir (source — human, animal, environment), (3) Portal of exit (cough, wound, feces), (4) Mode of transmission (contact/droplet/airborne/vector/vehicle), (5) Portal of entry (mucous membranes, breaks in skin, GI tract, respiratory tract), (6) Susceptible host. Breaking any link stops spread.', category: 'Infection Control' },
  'Rx': { term: 'Rx', definition: 'Prescription. From Latin "recipe" (take). Written at top of prescription orders. Rx = prescription drug (requires physician order). OTC = over-the-counter (no prescription needed). Rx also used as abbreviation for "treatment" in general medical context.', category: 'Medical Abbreviations' },
  'Hx': { term: 'Hx', definition: 'Medical history. Includes: chief complaint, history of present illness (HPI), past medical history (PMH), family history (FH), social history (SH), allergies, medications, review of systems (ROS). Collected during patient intake by MA. Also used standalone: Hx = history.', category: 'Medical Abbreviations' },
  'Penis aka shaft': { term: 'Penis anatomy', definition: 'Male external reproductive/urinary organ. Parts: root (attached to pelvis), shaft (body/corpus), glans (tip — most sensitive). Urethra runs through the shaft. Foreskin (prepuce) covers glans if uncircumcised. Erectile tissue: corpus cavernosa (2) and corpus spongiosum (1, surrounding urethra).', category: 'Anatomy & Terminology' },
  'Vagina aka Vulva': { term: 'Vagina vs. Vulva', definition: 'Vagina: internal muscular canal connecting uterus to outside (~3–4 inches). Vulva: external female genitalia — includes labia majora, labia minora, clitoris, urethral opening, vaginal opening, and Bartholin glands. Common mistake: "vagina" often used colloquially for the entire region, but vulva = external anatomy.', category: 'OB/GYN' },
  'Clitoris, urethra, vaginal canal': { term: 'Female external anatomy structures', definition: 'Vulva structures (anterior to posterior): Mons pubis → Clitoris (erectile tissue, highly sensitive) → Urethral meatus (urine) → Vaginal opening/introitus → 2 Bartholin glands (lubrication) → Perineum → Anus. The urethra and vagina are SEPARATE openings (important for catheterization).', category: 'OB/GYN' },
};


let patchedCount = 0;
const result = merged.map((card: any) => {
  if (card.term !== card.definition) return card; // already good

  // Try exact term match
  for (const [key, patch] of Object.entries(PATCHES)) {
    if (card.term.trim().toLowerCase().startsWith(key.toLowerCase().slice(0, 30))) {
      patchedCount++;
      return {
        ...card,
        term: patch.term ?? card.term,
        definition: patch.definition,
        type: patch.type ?? card.type,
        category: patch.category ?? card.category,
      };
    }
  }
  return card;
});

const stillBad = result.filter((c: any) => c.term === c.definition).length;

fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
console.log(`\n✅ Fixed cards:`);
console.log(`   Merged Q&A pairs   : ${mergedCount}`);
console.log(`   Patched definitions : ${patchedCount}`);
console.log(`   Still term=def      : ${stillBad} (note/mnemonic cards that are self-contained)`);
