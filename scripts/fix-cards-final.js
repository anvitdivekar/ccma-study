// Final comprehensive card quality pass
// Run: node --input-type=commonjs < scripts/fix-cards-final.js
'use strict';
const fs = require('fs');
const path = require('path');
const outFile = '/Users/anvitdivekar/ccma-study/src/data/cards.json';
const cards = JSON.parse(fs.readFileSync(outFile, 'utf-8'));

// ── IDs to delete (Q-fragments with companion cards, meta study notes, junk) ──
const DELETE_IDS = new Set([
  // ── META JUNK from first half ────────────────────────────────────────────
  'c0579042', // Study calculations, lbs to oz...
  'c48cb2df', // Study stress test, chapter 1...

  // ── META STUDY NOTES from second half ───────────────────────────────────
  '7200611b', // Be able to describe each procedure...
  '88f325d9', // Forget about the numerical values...
  '343b3318', // Know vitamins and minerals...
  'e9f0de9c', // Know your medications
  'be3737fc', // What pathogen causes each disease...
  'ff2743d8', // Know your medical terminology...
  '73f19ca3', // Use your medical terminology...
  'e2413421', // What supplies would you need...
  'b757403f', // What position to be in...
  '9a0b6e0b', // Know each quadrant...
  '39e61c00', // How to write a letter in...
  '52ce3a86', // Know the exact purpose of ICD...
  'd58eb99c', // Study the administrative section...
  '09e590c0', // Know different organizations...
  'e213b5cf', // ACO vs PCMH...
  'aa32b7b6', // Summary Major Content Area header
  '191354b2', // Under HIPAA EX (junk)

  // ── Q-fragments that have proper companion cards ─────────────────────────
  '53f8a5ff', // "the process that does not require oxygen..." → companion: Anaerobic [2b3133b6]
  '5dd29742', // "a pregnancy that develops outside the uterine cavity..." → Ectopic pregnancy [b5410c4f]
  '2b59f6c5', // "a term that describes a solution that has the same concentration..." → Isotonic [bedf2095]
  '7f848325', // "a major muscle in the body that assists in raising the arm..." → Deltoid [b5fa0d1e]
  '109dcc97', // "cells that carry or transmit impulses toward the CNS..." → Afferent neurons [5cbfd1de]
  '5bd7a3a6', // "the blood vessel that brings blood from the head..." → SVC [2af5998f]
  '038aa588', // "The process in which white blood cells take in and destroy..." → Phagocytosis [5be2f331]
  'dc1e2904', // "an accumulation of air in the pleural space..." → Pneumothorax [dbf52e59]
  'e09804e8', // "the tube that permits urine to pass from the bladder..." → Urethra [0727baf1]
  'c387316c', // "the study of the cause of any disease..." → Etiology [a8a6fa71]
  '95b6622e', // "the chronic skin condition characterized by a red flat area..." → Psoriasis [7edaf04c]
  '9488d2cb', // "the bone that is part of the shoulder girdle..." → Clavicle [c191155c]
  '3ae0d19a', // "the type of joint motion that allows movement away from the midline..." → Abduction [f0daaa22]
  '1241dbf0', // "the portion of the brain that aids in the coordination..." → Cerebellum [1970a393]
  '51e536c5', // "a condition resulting from renal failure and causing high levels of BUN..." → Uremia [148354ac]
  '103cbaa9', // "the muscle located on the anterior thigh..." → Quadriceps [cab3f2ec]
  'a6c502a8', // "an excessive curvature in the thoracic portion..." → Kyphosis [4d4d5dbd]
  'fb8c98e7', // "which of the following is a protein found in the epidermis..." → Keratin [5d5953de]
  'a820b754', // "which of the following glands are located on the sides of vaginal opening..." → Bartholin [3b32f3d9]
  '9f4b1d26', // "a fracture of the radius characterized by bending of the bone..." → Greenstick [a84ae824]
  '4913700a', // "a condition causing a back flow of stomach acid..." → GERD [cb53b90c]
  '8bf995b3', // "when a person generalizes the behavior or characteristic..." → Stereotyping [86dee4a1]
  '320bfbf0', // "communicating with someone who is grieving..." → Denial [b3cbaf5c]
  '3f99c120', // "which of the following is an example of behavior that demonstrates open nonverbal..." → Open nonverbal [6f75c1cf]
  '1c7838ae', // "when an individual is overemphasizing certain behaviors..." → Compensating [d28638db]
  '6b586ade', // "physiologic needs are the most basic..." → Maslow's hierarchy [30555c54]
  'bef29816', // "to encourage further comments from a patient..." → Reflecting [34826b28]
  'd8136152', // "deliver patient care that allows you to continue to provide objective..." → Professional relationship [43dfec7b]
  '5ecd52bf', // "the progression of a person's needs from basic survival..." → Maslow's [30555c54]
  '131f473a', // "which of the following is an issue that becomes predominant during the adolescent..." → Self-image [84b847fb]
  'df90bec5', // "the process of acquiring info from a patient..." → Assessment [4cc6919d]
  '5eef37c6', // "when evaluating a patient's progress...noncompliance..." → Patient refusing [bc4958c9]
  '39049f20', // "when developing written patient educational materials..." → Patient cognitive level [d47374c2]
  'f038c930', // "to provide patient education for a patient who is blind..." → Braille materials [de722c5b]
  '0da2e2da', // "a team approach to patient education..." → Multidisciplinary [47d8e375]
  '053836b2', // "when asked to provide dietary information..." → National Dairy Council [5ef55dab]
  '86dc9420', // "a national accrediting body..." → NCQA [24867016]
  '381d29b5', // "the process used to carry out the agreed teaching plan..." → Implementation [27cae1e1]
  'a0e3fdc5', // "a patient who needs info about drug addiction..." → Substance abuse [6554282b]
  '99463ac4', // "if a diabetic patient is reluctant to learn how to give insulin..." → Patient reluctant [646a1de1]
  'cb8a493a', // "of the following which patient is the least likely to respond to learning..." → Patient condescending [2065acfc]
  'ef54eb75', // "the following which is the most important for the person who is performing patient education" → Documenting [3cafc365]
  '867ddca6', // "the domain of learning that includes values attitudes and opinions..." → Affective domain [2d879f76]
  '7daa357b', // "when answering phones during a busy time of day..." → Will you please hold [7732b4fc]
  '948a93e6', // "which of the following is a phone call that ordinarily does not require the party to speak directly to the physician" → Pharmacist call [445d8851]
  '2b5935bb', // "the transmission of hard copy of a written document through a phone line..." → Fax [ba4586f4]
  '2f9f3e6c', // "the physician has asked you to contact a patient to schedule a return office visit..." → Contacting unreachable [c7100fcf]
  '2562253c', // "when assigned to work in the reception area..." → Answer by third ring [2cb7006f]
  'd63c6c6d', // "which of the following is an appropriate standard opening for an incoming call..." → Greeting [e534d1e5]
  'eba1cbda', // "when you are focusing on the conversation of the telephone call..." → Active listening [54d855ad]
  '5e77f900', // "when an unidentified callers insists on speaking with the physician..." → Tell caller physician is with patient [aae96857]
  '89797faf', // "telephone calls that the medical assistant...may handle..." → list [82dff21a]
  'c8d97ed1', // "when setting up the appointment book by crossing off times..." → Appointment matrix [a3d4178e]
  '17ff1a8b', // "if the physician is delayed in arriving at the office..." → Managing patient wait times [f48f27e9]
  '4a08582e', // "when a specific number of patients usually four is scheduled at the beginning of the same hour..." → Wave scheduling [1c5153e6]
  '6a6a5dc6', // "the abbreviation used in scheduling to designate a patient who has never been seen..." → NP [bdda6439]
  '9014c035', // "a patient calls and requests an appointment immediately..." → Scheduling triage question [5e3c3615]
  '7b04edd1', // "setting up the matrix of the appointment book..." → duties list [companion: Medical office scheduling duties 3d01c35e]
  'c1f6f05d', // 'a "walk' (truncated) → Walk-in patient [c5bffd44]
  'd74380a1', // "when a patient needs a return appointment to discuss laboratory or x-ray..." → [86a329e7]
  'ed13797c', // "when filling numerically using the terminal digit filing method..." → Numeric filing [e24eab58]
  '1c40180c', // "when a paper medical record is in use a folder inserted on the shelf..." → Out guide [0a42e7e0]
  'e22df01a', // "if filing using reverse chronological order..." → Chronological order [33204e30]
  '9774119a', // "determining the organization of the medical record and sequence of filing is dependent on" → Medical record system [6d508025]
  'bbb88b52', // "set the appointments at the same time on the same day of the week..." → companion is Setting a series [b9d028b7]
  '8ef23c4d', // "to maintain telephone confidentiality the medical assistant must" — merge with [b2cff5cd]

  // ── FIRE RACE sub-cards (companion is RACE card [897ce689]) ─────────────
  '27bd5027', // Rescue all patients...
  '8ec5ead4', // Alarm by pulling the closest fire pull...
  'e272cc96', // Extinguish the fire...
]);

// ── Patches by card ID ────────────────────────────────────────────────────────
const PATCHES = {
  // ── First-half fixes ─────────────────────────────────────────────────────
  '69f82f1d': {
    term: 'Hematoma — management',
    definition: 'A hematoma is a collection of blood outside blood vessels caused by blunt trauma or injury. Treatment: apply direct pressure to control bleeding. If associated with swelling/edema, apply ice for 20 minutes on/off. Elevate the affected limb. Do NOT apply heat acutely. Monitor for expanding hematoma requiring medical evaluation.',
  },
  'ffc24cc0': {
    term: 'Hemolysis (specimen)',
    definition: 'Breakdown (lysis) of red blood cells, releasing hemoglobin into the serum — causes the serum to appear pink/red. Can occur when: shaking a blood collection tube instead of gently inverting it, using a needle that is too small, or poor venipuncture technique. Hemolyzed specimens cause falsely elevated potassium, AST, and LDH. Must be recollected.',
  },
  'be7cbc35': {
    term: 'Infant measurement — length vs. height',
    definition: 'Infants and children under 2 years are measured lying down (recumbent length), NOT standing height. Standing height is only used for children who can stand (2+ years). Recumbent length is always longer than standing height (by ~1 cm). Most important measurement for infants: length and weight to track on growth charts.',
  },
  '13943211': {
    term: 'Manual blood pressure — procedure',
    definition: 'Measure BP using a sphygmomanometer and stethoscope. Steps: (1) Patient seated, arm at heart level. (2) Apply cuff 2–3 cm above antecubital fossa. (3) Palpate brachial artery; inflate to ~30 mmHg above where pulse disappears. (4) Deflate at 2–3 mmHg/sec; first Korotkoff sound = systolic, last sound = diastolic. Normal: <120/<80 mmHg.',
  },
  '67a0c394': {
    term: 'CCMA duties (Certified Clinical Medical Assistant)',
    definition: 'Clinical duties include: taking vital signs (BP, HR, RR, temp, O2 sat, pain), patient intake/triage, specimen collection (blood, urine, throat), performing EKG, administering medications/injections, performing CLIA-waived lab tests, assisting with minor procedures. Administrative duties include: scheduling appointments, managing patient records, billing/coding, phone triage, and patient education.',
  },
  '3b3941b4': {
    term: 'TSH (Thyroid Stimulating Hormone)',
    definition: 'Hormone released by the anterior pituitary gland that stimulates the thyroid to produce T3 and T4. Normal range: ~0.4–4.0 mIU/L. Elevated TSH = hypothyroidism (thyroid is underactive; pituitary works harder). Low TSH = hyperthyroidism (too much T3/T4 suppresses pituitary). Primary test for screening thyroid function.',
  },
  '5d1cef73': {
    term: 'Parkinson Disease',
    definition: 'Chronic progressive neurodegenerative disorder caused by loss of dopamine-producing neurons in the substantia nigra. Classic symptoms: resting tremor ("pill-rolling"), rigidity, bradykinesia (slowness), postural instability. Gait: shuffling, festinating. Facial masking. Managed with levodopa/carbidopa. No cure; disease progresses over time.',
  },
  '87f5ed49': {
    term: 'GTT (Glucose Tolerance Test)',
    definition: 'Glucose Tolerance Test — screens for gestational diabetes and prediabetes. Patient fasts 8–12 hours, then ingests a glucose solution. Blood glucose drawn at intervals (typically 1, 2, and 3 hours). GTT can also be done with a capillary puncture (glucometer) for 1-hour screening. A1C measures average blood glucose over 2–3 months; it is separate from GTT. Abnormal 2-hr value: ≥200 mg/dL.',
  },
  '9dca3df0': {
    term: 'Hemoccult (guaiac) test',
    definition: 'Fecal occult blood test (FOBT) that detects hidden (occult) blood in stool using guaiac paper cards. A chemical reaction turns the card blue if blood is present. Used to screen for colorectal cancer and GI bleeding. Patient must avoid red meat, aspirin, and vitamin C before testing. Positive result requires further workup (colonoscopy).',
  },
  'c3b1df09': {
    term: 'PR interval (ECG)',
    definition: 'Time from the beginning of the P wave to the beginning of the QRS complex — represents atrial depolarization and AV node conduction delay. Normal PR interval: 0.12–0.20 seconds (3–5 small boxes at 25 mm/sec). Prolonged PR (>0.20 sec) = first-degree AV block. Short PR = pre-excitation (e.g., WPW syndrome).',
  },
  '065c93f3': {
    term: 'QRS complex (ECG)',
    definition: 'Represents ventricular depolarization — electrical activation of both ventricles. Normal duration: 0.04–0.10 seconds (1–2.5 small boxes at 25 mm/sec). Wide QRS (>0.12 sec) = bundle branch block, ventricular rhythm, or hyperkalemia. QRS immediately follows the PR interval on the ECG tracing.',
  },
  '7acbab04': {
    term: 'Tissue biopsy',
    definition: 'Removal of a small sample of living tissue for microscopic examination to detect disease. Types: excisional (removes entire lesion), incisional (removes part), needle (core or fine-needle aspiration). Tissue biopsy specimens are sent to the histology (pathology) department where they are processed, sectioned, stained, and examined by a pathologist for diagnosis.',
  },
  '8d2ff1b6': {
    term: 'ECG augmented and precordial leads',
    definition: 'Augmented limb leads: aVR (right arm), aVL (left arm), aVF (left foot/inferior). Precordial (chest) leads V1–V6 placed across the chest. Together with limb leads I, II, III, these form the standard 12-lead ECG. Electrode placement: RA (right arm), LA (left arm), RL (right leg — ground), LL (left leg).',
  },

  // ── Second-half fixes ────────────────────────────────────────────────────
  'ed07e007': {
    term: 'Lacrimal apparatus (function)',
    definition: 'The lacrimal apparatus produces and drains tears to lubricate and protect the eye. It includes the lacrimal gland (produces tears), lacrimal ducts, lacrimal sac, and nasolacrimal duct (drains tears into the nose). Tears contain lysozyme (antibacterial), mucus, and water. Lacrimal gland is located in the superolateral orbit.',
  },
  '25a5c234': {
    term: 'Peristalsis',
    definition: 'Involuntary wave-like muscular contractions of the smooth muscle in the walls of the digestive tract that propel food from the esophagus through the intestines. Controlled by the enteric nervous system. Absent bowel sounds may indicate ileus (obstruction). Reverse peristalsis = vomiting. Also occurs in the ureters (moving urine to bladder).',
  },
  'b61611a3': {
    term: 'pH',
    definition: 'Measure of acidity or alkalinity of a solution on a scale of 0–14. pH 7.0 = neutral. Below 7.0 = acidic. Above 7.0 = alkaline (basic). Normal blood pH: 7.35–7.45. Acidosis (<7.35): respiratory (high CO2) or metabolic (low HCO3). Alkalosis (>7.45): respiratory (low CO2) or metabolic (high HCO3). pH is maintained by buffer systems, lungs, and kidneys.',
  },
  '22bb4196': {
    term: 'Artery → arteriole → capillary (blood flow sequence)',
    definition: 'Blood flows from large arteries → arterioles → capillaries (where gas/nutrient exchange occurs) → venules → veins → heart. Arteries carry blood AWAY from the heart under high pressure. Capillaries are the smallest vessels (one cell thick) — site of O2/CO2 exchange. Veins carry blood TOWARD the heart under low pressure.',
  },
  '2f8de85f': {
    term: 'Lymphangitis',
    definition: 'Inflammation of the lymphatic vessels, usually caused by a bacterial infection (typically Streptococcus). Appears as red streaks extending from an infected wound toward regional lymph nodes. Signs: red streaks, warmth, tenderness, fever, chills. A serious condition — can progress to septicemia if untreated. Treated with IV antibiotics.',
  },
  '48249623': {
    term: 'Rugae (stomach)',
    definition: 'Large longitudinal folds (wrinkles) in the mucosal lining of the stomach that allow it to expand when food enters. When the stomach is empty, rugae are prominent; they flatten as the stomach fills. The small intestine has villi (not rugae) for nutrient absorption.',
  },
  '9a47bd04': {
    term: 'Edema',
    definition: 'Abnormal accumulation of excessive fluid in the intercellular (interstitial) space causing swelling. Pitting edema: pressing leaves an indentation. Causes: heart failure, kidney disease, liver disease, venous insufficiency, hypoalbuminemia, lymphatic obstruction. Measured 1+ to 4+. Treated with diuretics and treating the underlying cause.',
  },
  '7909a7f2': {
    term: 'Retroperitoneal space',
    definition: 'The anatomical space behind (posterior to) the peritoneum in the abdominal cavity. Structures located in the retroperitoneal space: kidneys (and ureters), adrenal glands, aorta, inferior vena cava, pancreas (tail is intraperitoneal), and parts of the duodenum and colon. Retroperitoneal hematoma can occur with kidney trauma.',
  },
  'c7c3b9b4': {
    term: 'Hydronephrosis',
    definition: 'Distension (swelling) of the renal pelvis and calyces due to obstruction of urine outflow from the kidney. Causes: kidney stones, ureteral stricture, BPH, tumor, pregnancy. Signs: flank pain, decreased urine output. Diagnosed by ultrasound. Untreated hydronephrosis can lead to permanent kidney damage and renal failure.',
  },
  '44973b54': {
    term: 'hCG (Human Chorionic Gonadotropin)',
    definition: 'Hormone produced by the trophoblast cells of the placenta shortly after implantation. Detected in blood and urine — basis for pregnancy tests. Maintains the corpus luteum (which produces progesterone) in early pregnancy. Also elevated in ectopic pregnancy and gestational trophoblastic disease. Doubles every 48–72 hours in a normal early pregnancy.',
  },
  'e7c1ccdf': {
    term: 'Albumin',
    definition: 'The most abundant plasma protein, synthesized by the liver. Functions: (1) maintains oncotic (osmotic) pressure — keeps fluid in blood vessels; (2) transports hormones, drugs, fatty acids, and bilirubin. Low albumin (hypoalbuminemia) causes edema and ascites. NOT responsible for clotting — clotting depends on fibrinogen and clotting factors. Normal: 3.5–5.0 g/dL.',
  },
  '7b170849': {
    term: 'Emphysema',
    definition: 'A chronic obstructive pulmonary disease (COPD) characterized by permanent destruction of alveolar walls and enlargement of air spaces, reducing surface area for gas exchange. Primarily caused by long-term smoking. Signs: barrel chest, pursed-lip breathing, hyperresonance on percussion, dyspnea. Diagnosed with pulmonary function tests (reduced FEV1/FVC). "Pink puffer" phenotype.',
  },
  '64232cd6': {
    term: 'Cirrhosis',
    definition: 'Chronic, progressive degenerative disease of the liver in which normal liver tissue is replaced by fibrotic scar tissue, impairing liver function. Causes: chronic alcohol abuse (most common in US), hepatitis B/C, NASH (non-alcoholic steatohepatitis). Complications: portal hypertension, esophageal varices, ascites, hepatic encephalopathy, hepatorenal syndrome, liver cancer.',
  },
  '7a21387d': {
    term: 'Visceral layer (membrane)',
    definition: 'The layer of a serous membrane that is attached directly to the surface of an internal organ. The visceral layer contrasts with the parietal layer (lines the cavity wall). Example: visceral pleura covers the lung surface; parietal pleura lines the chest wall. Visceral peritoneum covers the abdominal organs; parietal peritoneum lines the abdominal cavity.',
  },
  'ee6b213d': {
    term: 'Degenerative (disease)',
    definition: 'Term describing a disorder in which tissues progressively break down or deteriorate over time, reducing function. Examples: osteoarthritis (cartilage degeneration), Alzheimer\'s disease (neurodegeneration), macular degeneration (retinal deterioration). Degenerative diseases are often chronic, progressive, and age-related. Treatment focuses on slowing progression and managing symptoms.',
  },
  '5cbf83e6': {
    term: 'Rh factor (blood typing)',
    definition: 'An antigen (protein) on the surface of red blood cells. People are either Rh-positive (have the antigen, ~85%) or Rh-negative (do not). An Rh-negative mother pregnant with an Rh-positive fetus can develop anti-Rh antibodies — causing hemolytic disease of the newborn (erythroblastosis fetalis) in subsequent pregnancies. Prevented with RhoGAM injection.',
  },
  '4b81f7d4': {
    term: 'Acquired natural active immunity',
    definition: 'Immunity that develops when the body contracts (is infected by) a disease and produces its own antibodies in response. Long-lasting protection. Distinguished from: artificial active immunity (vaccines), natural passive immunity (maternal antibodies via placenta/breast milk), and artificial passive immunity (injected antibodies/antitoxins). The most durable form of immunity.',
  },
  'e94e911f': {
    term: 'Tuberculosis (TB)',
    definition: 'Communicable infectious disease of the lungs caused by Mycobacterium tuberculosis — a rod-shaped bacterium. Transmitted via airborne droplets (coughing, sneezing). Symptoms: chronic productive cough, hemoptysis, night sweats, fever, weight loss. Diagnosed with PPD (Mantoux) skin test, chest X-ray, and sputum culture. Treated with combination antibiotics (RIPE: rifampin, isoniazid, pyrazinamide, ethambutol) for 6–9 months. Airborne precautions required.',
  },
  '824576ff': {
    term: "Crohn's disease",
    definition: "Chronic inflammatory bowel disease (IBD) that can affect any part of the GI tract from mouth to anus, most commonly the terminal ileum and colon. Characterized by transmural inflammation (all layers), skip lesions, and cobblestone mucosa. Symptoms: abdominal pain, diarrhea, weight loss, fever, bloody stool. Complications: fistulas, strictures, malabsorption. Treated with 5-ASA drugs, steroids, biologics. Distinguished from ulcerative colitis (colon only, mucosal).",
  },
  '59240b0b': {
    term: 'Liver — detoxification function',
    definition: 'One major function of the liver is to detoxify harmful substances including alcohol, drugs, and metabolic waste products. The liver uses cytochrome P450 enzymes to metabolize drugs and convert ammonia (from protein breakdown) to urea for excretion. Other liver functions: bile production, glucose storage (glycogen), protein synthesis (albumin, clotting factors), and fat metabolism.',
  },
  '9760275c': {
    term: 'Intracellular fluid (ICF)',
    definition: 'Fluid contained within body cells — the largest fluid compartment, comprising approximately 60–65% of total body water (~40% of body weight). Contains high concentrations of potassium (K+) and phosphate. Separated from extracellular fluid (ECF) by the cell membrane. ICF is regulated by osmosis. Electrolyte imbalances (e.g., hyponatremia) shift fluid between compartments.',
  },
  'a3a0c0af': {
    term: 'Key electrolytes — sodium and potassium',
    definition: 'Sodium (Na+) and potassium (K+) are the two most important electrolytes in the body. Sodium: primary extracellular cation; regulates fluid balance and osmolarity (normal 136–145 mEq/L). Potassium: primary intracellular cation; essential for cardiac and muscle function (normal 3.5–5.0 mEq/L). Imbalances cause serious cardiac arrhythmias and neuromuscular dysfunction.',
  },
  '28451e93': {
    term: 'Gestation',
    definition: 'The period of pregnancy — from fertilization/conception to birth. Normal human gestation: approximately 40 weeks (280 days) from the first day of the last menstrual period (LMP). Divided into three trimesters of approximately 13 weeks each. "Gestational age" refers to the number of weeks since the LMP. Term pregnancy: 37–42 weeks. Preterm: <37 weeks. Post-term: >42 weeks.',
  },
  '8a476f2f': {
    term: 'Vertebral column — regions (superior to inferior)',
    definition: 'The vertebral column has 5 regions from top to bottom: (1) Cervical — 7 vertebrae (neck, C1–C7); (2) Thoracic — 12 vertebrae (T1–T12, articulate with ribs); (3) Lumbar — 5 vertebrae (L1–L5, largest); (4) Sacral — 5 fused vertebrae forming the sacrum; (5) Coccygeal — 4 fused vertebrae forming the coccyx (tailbone). Total: 33 vertebrae (26 after fusion).',
  },
  'e1c10129': {
    term: 'Diabetic retinopathy',
    definition: 'Damage to the blood vessels of the retina (back of the eye) caused by chronically elevated blood glucose in diabetes. Leading cause of blindness in working-age adults. Stages: non-proliferative (microaneurysms, hemorrhages) → proliferative (new fragile blood vessels grow → bleeding, retinal detachment). Screened with annual dilated fundus exam. Prevented by tight glucose and blood pressure control.',
  },
  '887fc604': {
    term: 'Type 2 diabetes mellitus (non-insulin-dependent)',
    definition: 'Chronic metabolic disorder characterized by insulin resistance (cells do not respond to insulin) and relative insulin deficiency. Unlike Type 1, the pancreas still produces insulin. Risk factors: obesity, sedentary lifestyle, family history, age >45. Treated with lifestyle changes, oral medications (metformin), and insulin if needed. Complications: neuropathy, retinopathy, nephropathy, cardiovascular disease.',
  },
  '5ff17046': {
    term: 'Communicating with a sight-impaired patient',
    definition: 'Key principle: always announce yourself and tell the patient each time before you touch them. Speak directly to the patient, not to a companion. Identify yourself by name at each encounter. Guide rather than pull — offer your arm for assistance. Use verbal descriptions in place of visual cues. Provide educational materials in braille, large print, or audio format.',
  },
  '09554154': {
    term: 'Communicating with a hearing-impaired patient',
    definition: 'Key principles: face the patient directly (they may lip-read), speak slowly and distinctly at a normal pace, do not shout. Reduce background noise. Use written notes or a whiteboard when needed. If the patient uses sign language, arrange an interpreter. Ensure hearing aids are working. Check comprehension by asking the patient to repeat back key information.',
  },
  'c812dfbd': {
    term: 'Open-ended question (patient interview)',
    definition: 'A question that requires more than a yes/no answer, encouraging the patient to describe in their own words. Example: "Can you describe your pain?" or "Tell me about your symptoms." Contrast with closed-ended questions ("Is the pain sharp?"). Open-ended questions gather richer information and are used at the beginning of a patient interview. Companion to the "reflecting" technique.',
  },
  'c655ed85': {
    term: 'Communicating with a non-English-speaking patient',
    definition: 'When a professional interpreter is unavailable, use gestures and body language to demonstrate information. Avoid relying on family members (especially children) as interpreters for clinical information — use professional medical interpreters. Speak slowly and simply. Use visual aids, diagrams, and translated materials when possible. Document language barrier and interpreter use in the chart.',
  },
  '3c7f0fa1': {
    term: 'Prejudice (healthcare)',
    definition: 'Holding a preconceived, usually unfavorable opinion about a person based on their affiliation with a specific group (race, culture, religion, gender, etc.) — rather than individual assessment. Prejudice in healthcare leads to unequal treatment and poorer patient outcomes. Healthcare providers must recognize their own biases and deliver care objectively and respectfully to every patient.',
  },
  '81655cfc': {
    term: 'Nonverbal communication — positioning with patients',
    definition: 'Sit at the patient\'s level (eye-to-eye) and maintain appropriate eye contact to demonstrate attentiveness and respect. Leaning slightly forward shows engagement. Maintain culturally appropriate distance (~3–4 feet). Avoid crossed arms (closed posture). Mirror the patient\'s posture to build rapport. Body language should convey openness, empathy, and interest.',
  },
  '1776375e': {
    term: 'Reinforcing verbal instructions — written instructions',
    definition: 'The best way to reinforce verbal patient instructions is to also provide written instructions for the patient to take home. Research shows patients forget up to 80% of verbal instructions. Written materials should use plain language (5th–6th grade reading level), include key points, be culturally appropriate, and be reviewed with the patient before they leave.',
  },
  'c430e909': {
    term: 'Documenting receipt of patient education materials',
    definition: 'Best practice: have the patient sign a document (or the chart form) verifying they received written educational materials. This signature is placed in the patient\'s chart. Documents what was taught, that materials were provided, and confirms the patient received them. Protects the practice legally and demonstrates compliance with patient education standards.',
  },
  '336e836d': {
    term: 'Patient signature for educational materials',
    definition: 'Have the patient sign a document to be placed in their chart verifying receipt of written educational materials. This documents that the patient received the materials, protects the practice legally, and is required by many accreditation bodies as proof that patient education occurred during the visit.',
  },
  'a42a60c2': {
    term: 'Privacy (patient education environment)',
    definition: 'An environment conducive to patient learning is characterized by privacy — a private, quiet space without interruptions or observers. Patients are more likely to ask questions, disclose sensitive information, and engage with education when they feel their privacy is protected. Ensure doors are closed and conversations cannot be overheard.',
  },
  '7ac1261f': {
    term: 'First step in patient education program development',
    definition: 'The first step in developing a patient educational program is to identify the purpose and topic — what the patient needs to learn and why. Subsequent steps: assess the patient\'s learning needs/barriers, plan the content and method, implement (teach), and evaluate comprehension. This mirrors the nursing process (assess, plan, implement, evaluate).',
  },
  'c1bd28a8': {
    term: 'Implementing patient educational materials',
    definition: 'Patient educational materials are best implemented when they are discussed with the patient (not simply handed to them). Walk through the key points, invite questions, and use the teach-back method to confirm understanding. Materials handed over without discussion are far less effective and unlikely to improve patient compliance.',
  },
  '613627c7': {
    term: 'Cognitive domain of learning',
    definition: 'The domain of learning related to comprehension — thinking, knowledge, understanding, and the application of information. Includes memorization of facts, understanding concepts, and applying knowledge to new situations. Bloom\'s taxonomy describes 6 levels: remember, understand, apply, analyze, evaluate, create. Contrasts with affective (values/attitudes) and psychomotor (skills) domains.',
  },
  '76496043': {
    term: 'Purpose of patient education',
    definition: 'The overall purpose of patient education is to improve patient health by increasing knowledge, promoting healthy behaviors, improving self-management of chronic conditions, and increasing compliance with treatment plans. Effective patient education leads to better outcomes, fewer hospitalizations, and empowered patients who actively participate in their care.',
  },
  '1e868221': {
    term: 'Positive emotional outlook (factor in patient learning)',
    definition: 'One of the most important factors that promotes patient learning. A patient with a positive emotional outlook, motivation, and readiness to learn will engage more effectively with educational content. Other positive factors: family support, good health literacy, manageable pain/anxiety level, and trust in the healthcare team. Barriers: fear, denial, pain, depression, language differences.',
  },
  '77e00ed5': {
    term: 'Ensuring patient follow-up appointment compliance',
    definition: 'To ensure a patient follows up for evaluation of a prescribed treatment plan: provide the patient with a written appointment slip containing the date, time, location, and purpose of the follow-up. Verbal reminders alone are insufficient. Call patients to confirm upcoming appointments. Document missed appointments and make re-scheduling efforts. Use tickler files for tracking follow-ups.',
  },
  'f58a9e7e': {
    term: 'Evaluating patient understanding of educational information',
    definition: 'The best way to evaluate patient understanding is to ask for feedback — use the teach-back method: ask the patient to repeat instructions in their own words ("Can you show me how you will take this medication?"). Simply asking "Do you understand?" is ineffective. Observe return demonstration for psychomotor skills. Document the patient\'s level of comprehension.',
  },
  'e2057624': {
    term: 'Family support (positive learning factor)',
    definition: 'Having family or caregiver support is one of the strongest positive contributors to patient learning and treatment compliance. Family members can reinforce instructions at home, assist with medication management, provide encouragement, and attend educational sessions. Include family/caregivers in patient education when the patient consents.',
  },
  '6c6cdd10': {
    term: 'Screening telephone calls (routine vs. emergent)',
    definition: 'A key clinical skill for medical assistants: determine which calls are routine (non-emergent) versus those requiring immediate physician attention. Routine: appointment requests, billing questions, prescription refill verification. Emergent: chest pain, difficulty breathing, severe bleeding, altered consciousness, suicidal ideation — these require immediate physician notification or instruction to call 911.',
  },
  '6bd0cc05': {
    term: 'Screening telephone calls — primary purpose',
    definition: 'The primary purpose of screening telephone calls is to manage the physician\'s time by routing only necessary calls to the physician. The medical assistant handles routine matters (scheduling, billing, refill authorizations per physician standing orders) and identifies calls that require the physician\'s direct input. Effective screening protects patient safety and office efficiency.',
  },
  '0ef57912': {
    term: 'Software (computer)',
    definition: 'A computer program that tells the computer what to do — the instructions and code that enable hardware to perform specific tasks. Types: operating system software (Windows, macOS), application software (EHR, word processing, scheduling), and utility software. In medical offices, EHR software (Electronic Health Records) is the primary application used for patient records, billing, and scheduling.',
  },
  '4608eb86': {
    term: 'HIPAA — federal regulation for patient information (computers)',
    definition: 'The federal government enacted the Health Insurance Portability and Accountability Act (HIPAA) as a standard practice for confidentiality and release of patient information, including electronic records. The Privacy Rule (PHI) and Security Rule (ePHI) are found in the Code of Federal Regulations (CFR). The abbreviation HIPAA is used in the Federal Register to identify these standards.',
  },
  '36436b67': {
    term: 'HIPAA computer security requirements',
    definition: 'To comply with HIPAA requirements when using office computers: (1) Change passwords frequently and use strong passwords; (2) Protect computers from unauthorized access with appropriate security software/firewalls; (3) Ensure computer screens are not visible to unauthorized persons (screen privacy filters); (4) Log off or lock the computer when leaving the workstation. Never share login credentials.',
  },
  'e976dee4': {
    term: 'HIPAA computer security — required practices',
    definition: 'HIPAA-required computer security practices include: change passwords frequently; protect computers from illegal access with appropriate security devices (firewalls, antivirus); ensure computer screens are not in view of unauthorized persons; turn off or lock the computer when not in use. Violations can result in fines up to $50,000 per violation and criminal penalties.',
  },
  'aae96857': {
    term: 'Unidentified caller requesting physician — procedure',
    definition: 'When an unidentified caller insists on speaking with the physician, the medical assistant should politely inform the caller that the physician is currently with a patient, and ask for their name and callback number so the call can be returned. This protects the physician\'s time, maintains patient confidentiality, and screens potential non-urgent calls appropriately.',
  },
  'eabae3f4': {
    term: 'Emergency telephone call — keeping caller on the line',
    definition: 'During a telephone emergency, keep the caller on the line while contacting emergency medical services (911) on another phone line if the office has multiple lines. This ensures the caller remains calm, you can continue gathering information, and emergency dispatch can hear what is happening if needed. Never place an emergency caller on hold.',
  },
  '82dff21a': {
    term: 'Telephone calls the medical assistant may handle',
    definition: 'Medical assistant/administrative specialist may handle: (1) Refilling prescriptions already authorized by the physician; (2) Scheduling procedures at other medical facilities; (3) Answering patient billing/financial statement questions; (4) Confirming appointment times. Calls requiring physician involvement: lab result interpretation, medical advice, prescription changes, and emergencies.',
  },
  '1fa0e105': {
    term: 'New patient appointment — information to collect',
    definition: 'When scheduling a new patient by telephone, collect: (1) Full legal name and date of birth; (2) Address and phone number; (3) Chief complaint/reason for visit; (4) Insurance provider name, ID number, and group number; (5) Referring physician (if applicable); (6) Preferred appointment time. Inform the patient to arrive early to complete new patient paperwork.',
  },
  'acce3fbf': {
    term: 'Scheduling special procedures — least important concern',
    definition: 'When scheduling special procedures, the patient\'s insurance copayment amount is the least important concern at the scheduling stage — the focus is on clinical appropriateness, availability, and patient preparation. Insurance authorization and copay collection are administrative concerns addressed separately, not primary factors when choosing the time/location of a procedure.',
  },
  '71fa8b11': {
    term: 'Setting a return appointment — best practice',
    definition: 'When setting a return appointment for a patient, offer the patient a specific time and date rather than asking them to call back. Offering a specific slot increases compliance. Confirm the appointment verbally, provide a written appointment slip, and document the scheduled return visit in the patient\'s record.',
  },
  '14f3f8b3': {
    term: 'Scheduling inpatient surgery — information not needed beforehand',
    definition: 'When calling a hospital to schedule inpatient surgery, information NOT necessary to have before the call: the patient\'s insurance copayment amount. The hospital requires: patient name, DOB, diagnosis/procedure, surgeon\'s name and contact, insurance authorization number, and requested date/time. Copay details are handled at admission, not during scheduling.',
  },
  '86a329e7': {
    term: 'Lab results — scheduling return visit',
    definition: 'When a patient needs a return appointment to discuss lab or X-ray results with the physician, first call the lab or radiology department to determine when results will be available, then schedule the return visit based on that date. Scheduling the appointment before results are available may result in an incomplete consultation.',
  },
  'ad595394': {
    term: 'Patient flow analysis — primary purpose',
    definition: 'The primary purpose of a patient flow analysis is to determine the efficiency of the practice — how patients move through the office from arrival to discharge. Analyzes wait times, bottlenecks, staff utilization, and appointment patterns. Results guide scheduling improvements, staffing adjustments, and workflow redesign to reduce wait times and increase throughput.',
  },
  '85e4b4cf': {
    term: 'Scheduling inpatient procedure — admission vs. procedure date',
    definition: 'When scheduling an inpatient procedure, the admission is scheduled separately from the actual procedure to allow the patient to complete pre-admission testing, medical evaluation, and necessary consents before the procedure date. This ensures the patient is cleared medically (labs, EKG, anesthesia consult) and that paperwork is complete before the surgery day.',
  },
  'e2040c6c': {
    term: 'Adding reports to patient chart — physician initials',
    definition: 'Before inserting reports or documents into a patient\'s chart, ensure that the physician has initialed (reviewed) all reports. The physician\'s initials confirm the report was reviewed and acknowledged. Reports should be filed in reverse chronological order (most recent on top). Never file unsigned/unreviewed reports — the physician must initial first.',
  },
  '08dd96b8': {
    term: 'Correcting an error in a patient\'s chart',
    definition: 'Proper procedure to correct a medical record error: draw a single line through the error, write "error" above it, add your initials and the date of correction, then document the correct information. NEVER use correction fluid (White-Out), erase, or obliterate the original entry. The original entry must remain legible. If electronic, use the designated correction/addendum function.',
  },
  '0f5bf068': {
    term: 'Ownership of medical records',
    definition: 'The pages of the medical record (the physical/electronic chart) are the property of the physician or healthcare organization. However, the information contained within belongs to the patient, who has the legal right to access and obtain copies of their records under HIPAA. Patients can request copies; there may be a reasonable fee for copying. Records must be retained per state law (typically 7–10 years).',
  },
  'bc177f0b': {
    term: 'Indexing rules for alphabetic filing',
    definition: 'In alphabetical filing: (1) File by last name first, then first name, then middle initial; (2) Treat hyphenated names as one continuous name (ignore the hyphen); (3) Prefixes (Mc, Mac, O\') are filed as spelled; (4) Numbers in names are spelled out and filed alphabetically; (5) Titles (Dr., Jr.) are filed last and ignored for indexing purposes. Nothing comes before something.',
  },
  '656': {
    term: 'Screening telephone calls — purpose',
    definition: 'The primary purpose of screening telephone calls in a medical office is to manage the physician\'s time by routing only necessary calls to the physician, while the medical assistant handles routine matters.',
  },
};

// ── Apply patches and deletions ───────────────────────────────────────────────
const byId = new Map(cards.map(c => [c.id, c]));
const toDelete = new Set(DELETE_IDS);

let patchCount = 0;
for (const [id, patch] of Object.entries(PATCHES)) {
  const card = byId.get(id);
  if (!card) { console.warn('MISS patch id:', id); continue; }
  if (patch.term) card.term = patch.term;
  if (patch.definition) card.definition = patch.definition;
  card.type = 'term';
  patchCount++;
}

const result = cards.filter(c => !toDelete.has(c.id));

console.log(`Patched: ${patchCount} cards`);
console.log(`Deleted: ${toDelete.size} card IDs (actual removed: ${cards.length - result.length})`);
console.log(`Final count: ${result.length} (was ${cards.length})`);

// Sanity check — show any remaining same-term-def cards
const stillBad = result.filter(c => c.term.trim() === c.definition.trim() || c.term.length < 4);
if (stillBad.length > 0) {
  console.log(`\nRemaining same-term=def or very short terms (${stillBad.length}):`);
  stillBad.slice(0, 20).forEach(c => console.log('  [' + c.id + ']', c.term.slice(0, 70)));
}

fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
console.log('Written:', outFile);
