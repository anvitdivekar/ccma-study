#!/usr/bin/env node
/**
 * Pass-3: Q&A merge + standalone fixes + cleanup
 */
const fs = require('fs');
const outFile = 'src/data/cards.json';
const cards = JSON.parse(fs.readFileSync(outFile, 'utf-8'));
const byId = new Map(cards.map(c => [c.id, c]));
const toDelete = new Set();

// Q&A merges: [questionId, answerId, newTerm, newDefinition, category]
const QA = [
  ['7985bf9a-67c0-42fa-85e9-619c351beb0f','76452fc5-1a62-483a-8be9-2c2375c29769',
    'Endocrine system glands','The endocrine system includes the thyroid gland (regulates metabolism) and pituitary gland ("master gland" controlling other endocrine glands), plus adrenal glands, pancreas, and gonads.','Anatomy'],
  ['3561e67f-c59c-4bcc-82e5-c1c0b50da3cd','0314a1cf-844e-4ecc-9093-b42e40025945',
    'Inguinal region','Pertains to the groin — the junction of the abdomen and thigh. Clinically important for assessing hernias and inguinal lymph nodes.','Anatomy'],
  ['9efa1b9c-f422-47e9-a955-3b612653d089','2eb0ec95-c185-460c-b79c-a981c1a46253',
    'Ventricles of the brain (CSF)','The ventricles (lateral, third, and fourth) are the spaces in the brain where cerebrospinal fluid (CSF) is formed. CSF cushions and nourishes the brain and spinal cord.','Anatomy'],
  ['b2e4a74a-7315-44a0-89ce-e987a9f747a4','0d8a8a79-9581-4f17-aaf4-2abcd3cc0caf',
    'Layers of the heart','Three layers: endocardium (inner smooth lining), myocardium (middle muscular layer that pumps), and pericardium (outer sac). Endocardium and myocardium are the two main structural layers.','Anatomy'],
  ['41a98bb6-463c-42cc-934c-cc6253ceb57f','2ace0361-1196-491b-a55a-a5c1163ba433',
    'Lymphatic system organs','Thymus, spleen, tonsils, and adenoids — along with lymph nodes and lymphatic vessels distributed throughout the body.','Anatomy'],
  ['40f5d20b-8a1e-48eb-9de9-1d71a8e38774','775155a3-b00a-406f-8095-f13b181f829a',
    'Frontal (coronal) plane','Divides the body into anterior (front) and posterior (rear) sections.','Anatomy'],
  ['3be4997b-72de-412f-bfc9-d930ecf4091d','46e26857-4b0c-491c-8450-159cc03a0605',
    'Sympathetic nervous system (fight-or-flight)','Dilates bronchi of the lungs, increases heart rate, elevates blood pressure, dilates pupils, and decreases digestive activity.','Anatomy'],
  ['b69abc72-2e0d-43f2-b375-eae33e391294','f3765e42-7d6b-4344-8029-c8e354fe4ad8',
    'Strabismus','Eye misalignment causing cross-eye appearance; both eyes do not focus on the same point simultaneously. Treated with corrective lenses, patching, or surgery.','Anatomy'],
  ['baee545d-5353-4953-a249-60ecca12ece4','6111fca8-7b0c-4f10-b286-ff46e1b8a11a',
    'HIV (Human Immunodeficiency Virus)','The cause of AIDS (Acquired Immunodeficiency Syndrome). Attacks CD4+ T-helper cells, progressively weakening the immune system.','Infection Control'],
  ['40a766e1-6155-4955-8635-fb70a11aec5b','a2dc90e1-7202-43ff-9eeb-0368bc67ce85',
    'Pleural sac','The sac (pleura) covering the lungs. The pleural cavity contains thin fluid that reduces friction during breathing. The right lung has three lobes; the left has two.','Anatomy'],
  ['3087d5d5-44fc-49f0-96aa-19f5fd051b37','76ffaf5d-59c9-43e4-afe4-07ac36af5111',
    'Epigastric region','Located in the upper middle abdomen, directly distal to (below) the sternum. Contains the stomach, upper liver, and portions of the pancreas.','Anatomy'],
  ['a11c616b-1328-4d4d-b7fa-d8c38609db83','2c297490-bd81-4836-a8e2-3ef8789c16bf',
    'Collagen','A fibrous structural protein found in the dermis; the most abundant protein in the body. Provides tensile strength to skin, tendons, ligaments, and bone.','Anatomy'],
  ['767f0aff-ba8b-41bd-94e2-4bd48ceabcdc','7d60819c-c576-41c9-8ce9-ec9b5d1c24eb',
    'Olfactory nerve (Cranial Nerve I)','Carries impulses for the sense of smell from olfactory receptors in the nasal mucosa to the olfactory bulb and cerebral cortex.','Anatomy'],
  ['cbe59a1f-51b3-47c8-8762-59094717b0af','99fdfcd4-f133-45e3-9acb-3900186f5a2b',
    'Nonverbal communication','Communication without words. Best example: body language — facial expressions, posture, eye contact, gestures, and interpersonal distance.','Communication'],
  ['855f4294-f2ac-4af9-ade9-c6dd2d1e1068','9f0dea91-fdf2-419b-89d8-777b4bcd3be1',
    'Verbal communication with patients','Speak at the patient\'s educational level — avoid medical jargon, use clear simple language, and confirm understanding.','Communication'],
  ['338815bb-cdc6-4cc8-bdc0-f9d3ebfcec0e','dec14b4c-057c-4ada-8d2a-f02bef124fd8',
    'Communicating with difficult patients','Exhibit a diplomatic attitude — remain calm, empathetic, and non-confrontational. Listen actively to understand the root of the patient\'s concern.','Communication'],
  ['e05fdf1a-e198-4e0e-bbd7-5ac7e7fd7702','cca09ca4-0214-4554-a89c-2846a744816f',
    'Signs of depression in patients','Withdrawn behavior, weeping, and social isolation may indicate depression. Acknowledge feelings and refer to appropriate mental health resources.','Communication'],
  ['e86ae98f-7be4-4e63-98c6-00cd8678d3d1','ef39b135-53d4-4226-87f7-0c88a0576604',
    'Proper flow of communication','Message → response → clarification → feedback. Each step ensures the message was received and understood correctly.','Communication'],
  ['9157567a-686d-4df2-8869-990babc3d5b5','88ed666a-cd4f-44b5-aa70-c8bc7b4b3eb8',
    'Patient interview communication techniques','Reflecting (repeating key points back) and summarizing (condensing what was said) confirm understanding and encourage the patient to elaborate.','Communication'],
  ['296fe642-ee6a-41ba-967f-7afa97873678','c6d69ffc-ea39-466d-8d2c-d11c36787e95',
    'Psychomotor domain of learning','The domain encompassing the patient\'s mental and physical abilities — hands-on skills and motor tasks such as self-injection technique or wound care.','Communication'],
  ['551394f8-722d-4519-a323-755165e784b3','436632ef-da8a-48de-8a3f-528be6629b19',
    'Diction','The style of speaking and clearly enunciating words. Good diction is essential for professional telephone communication and direct patient interaction.','Communication'],
  ['76a72a2a-051b-4b02-a86e-6a70e76570fa','b033e977-0422-4076-9b85-063447e747ca',
    'Transferring patient calls to physician','Have the patient\'s medical record available for the physician before transferring the call so the physician has context for the conversation.','Communication'],
  ['d26dbfcd-f0db-4733-935c-9edfbe93fef3','7d6c12cd-b5e8-4fca-a90d-c340d7e5721c',
    'Handling difficult callers','Determine the nature of the problem and identify the appropriate staff member who can best assist; remain calm and professional throughout.','Communication'],
  ['ef4ed418-42fe-4c76-a968-84e43019a095','7dc17b95-2ae1-4dae-8c4b-9378a82b47dc',
    'Good telephone voice quality','Speaking clearly and enunciating words correctly — essential qualities for a professional telephone voice in a medical office.','Communication'],
  ['664d36be-5c5e-4b24-8f86-b06e5f8c0f73','27d6deb1-c445-4fe4-af41-0b80ebf9dfcb',
    'Internet search engine example','Yahoo is an example of an internet search engine. Search engines index web pages so users can find information with keywords. Other examples: Google, Bing.','Communication'],
  ['fea05134-8a9d-4215-a728-455c2211bef7','3bf782cc-eb62-4d92-a473-0f03ccfa9a41',
    'Higher-urgency appointment','A 55-year-old man with difficulty breathing constitutes a higher level of urgency and should be seen immediately or directed to emergency services.','Administrative'],
  ['0f82a892-16af-4381-acbe-c1d4b1047845','c29fde05-349b-4070-a48d-19bc235233bb',
    'Double booking (appointment scheduling)','Two or more patients are scheduled at the same appointment time slot. Used in practices with high no-show rates but can cause wait time issues.','Administrative'],
  ['c56792f8-b6b9-4eba-8d83-6f08dfb7aeb3','75c3c106-988a-4cb2-bdcd-43e705e569b9',
    'Appointment book — legal importance','The appointment book is treated as a legal document because it may be subpoenaed in legal proceedings. Corrections must follow proper procedure.','Administrative'],
  ['142a83da-2009-4e87-96c9-026db297a870','c54889fa-083f-4d82-a07e-dc3efaa72285',
    'Tickler file','A filing system used as a reminder of tasks to be completed by a certain date and time. Organized chronologically to prompt follow-up on pending matters.','Administrative'],
  ['db281382-bfef-45ac-99b3-93dd17578f9f','40cf4d38-e784-4f03-97bf-36b0b8b50a32',
    'Tidal wave scheduling','A scheduling method typical of urgent care centers: multiple patients arrive at the start of each time block and are seen in order of arrival.','Administrative'],
  ['09cf619a-45d1-406d-9fba-5404b4814ca2','442c01fe-6150-459d-bfb2-27a126cfa7cc',
    'Alphabetical filing — hyphenated names','When a last name has a hyphen, it is filed as if the hyphen were not there (treated as one continuous name).','Administrative'],
  ['4ad654f0-d22f-4983-ba09-d192a738e547','9e83b991-1ce5-4ae8-83b1-671ce3c4d47d',
    'One of the Cs of charting','Clear — one of the Cs of good charting. The Cs include: complete, concise, clear, chronological, and confidential.','Administrative'],
  ['c9210089-dff8-47d0-9a07-59a87542ecb6','8758b552-28af-4e24-bacd-0d7df4a9b1c9',
    'SOAP charting — P (Plan)','The P in SOAP stands for Plan: the plan for tests, treatments, medications, referrals, and follow-up based on the assessment.','Administrative'],
  ['d7651371-1a10-42a0-a3ac-52716d0e99b5','fcb8e96e-1307-4e42-8256-d052fd79b2cd',
    'Alphabetical filing — example order','In alphabetical filing, Fishar comes before Fischer (A before C), and Fischer, Bob comes before Fischer, William (B before W). Compare letter-by-letter.','Administrative'],
];

// Standalone fixes: id -> {term, definition}
const STANDALONE = {
  'b3c72878-bb82-45b1-bdf0-c20fc3a57e45': ['Cervicofacial','Pertaining to both the neck (cervic-) and face (-facial). Example: cervicofacial actinomycosis is a bacterial infection of the jaw/neck region.'],
  '02e4b200-dff5-4bdc-80e4-20f71b96f2bb': ['Tenodynia / Tenalgia','A term meaning painful tendon. Commonly caused by tendinitis or overuse injury (e.g., Achilles tendinitis).'],
  '251be4dc-cc1e-411b-adee-75e71c16dd73': ['Nasopharyngeal','Pertaining to the nasopharynx — the upper part of the pharynx located behind the nasal cavity. Example: nasopharyngeal airway (NPA), nasopharyngeal swab for COVID-19 testing.'],
  'f3c8aa8d-d90d-4fb1-9b24-73d05e5d41ce': ['Diaphragm','The thoracic and abdominal cavities are separated by the diaphragm — a dome-shaped muscular partition that is also the primary muscle of respiration.'],
  'a29a419f-6b55-407b-b748-88d0d36d1cd5': ['Red bone marrow','The portion of skeletal bone that manufactures blood cells (hematopoiesis). Found in flat bones (sternum, pelvis, ribs) and ends of long bones in adults.'],
  '2cf94ffc-d4dd-48a5-b31a-c52f1c2d1fd6': ['Ischium (pelvic girdle bone)','A bone that is part of the pelvic girdle. The pelvis consists of three fused bones: ilium, ischium, and pubis (together forming the os coxae / hip bone).'],
  '8df9bda5-7f62-43be-965b-0d28de5a5c02': ['Cellular components of blood (formed elements)','Erythrocytes (red blood cells — carry O2), leukocytes (white blood cells — fight infection), and thrombocytes (platelets — aid clotting). Together called formed elements.'],
  'd278a5d0-7b69-4ac3-a8a9-4b9e6c3a3c8b': ['Chambers of the heart','Four chambers: right atrium and right ventricle (receive/pump deoxygenated blood to lungs); left atrium and left ventricle (receive/pump oxygenated blood to body).'],
  'ab22b03f-c99a-4278-8d1b-e66f61fa9c4e': ['Left upper quadrant (LUQ) organs','Contains the stomach, spleen, tail of pancreas, left kidney, and descending colon. The most prominent palpable organ is the spleen.'],
  '7e351ce7-cfb7-4f31-8779-5a3cc0a14b09': ['Larynx (voice box)','The structure in the body known as the voice box. Located in the neck, houses the vocal cords, and connects the pharynx to the trachea.'],
  '0fe723eb-b0b2-47f1-8baa-3e2f3c7adf21': ['Renal pelvis','The funnel-shaped basin forming the upper end of the ureter. Collects urine from the major and minor calyces of the kidney and funnels it into the ureter.'],
  'b4f62b52-c0b4-4ab9-93d5-3cc9fd64ad76': ['Perineum','In both males and females, the entire pelvic floor is called the perineum — the region between the genitalia and the anus.'],
  '8b67b7a4-2a88-4e81-8d24-99eb4a7ced8e': ['Pericardium','The membrane that surrounds and protects the heart. Has fibrous outer and inner serous layers (parietal and visceral pericardium). Contains pericardial fluid to reduce friction.'],
  'c7fec547-bcf7-4684-ab40-5ee71dd9cbae': ['Xiphoid process','The small tip of cartilage at the lower end of the sternum. Important CPR landmark: heel of hand is placed two finger-widths above the xiphoid process during compressions.'],
  '64601308-9c26-4af4-b1fa-17f3dda5f3bd': ['Anterior pituitary — growth hormone','Growth hormone (GH/somatotropin) is produced in the anterior pituitary gland. It stimulates growth of bone and muscle and regulates protein, fat, and carbohydrate metabolism.'],
  '61c1df1b-1cad-4a8d-afe0-eb89b57ee3c2': ['Blood flow sequence','Deoxygenated blood → right atrium → right ventricle → pulmonary artery → lungs (oxygenation) → pulmonary veins → left atrium → left ventricle → aorta → body tissues → vena cava.'],
  'defa1f9f-8e58-4a50-88c3-89fd5b11d4ca': ['Pharynx (shared structure)','The structure common to both the respiratory and digestive systems. The pharynx (throat) is a shared passageway for air (to trachea/lungs) and food/liquid (to esophagus/stomach).'],
  'd7b29e6d-9060-4e97-bfb2-9b14c5de1b83': ['Epiglottis','The leaf-shaped cartilage that covers the opening of the larynx during swallowing, preventing food and liquid from entering the airway (aspiration).'],
  '56907940-b0c1-4d0f-99ac-5c3e3a7b8d9e': ['Small intestine (digestive process)','Most of the digestive process (digestion and absorption of nutrients) occurs in the small intestine, specifically in the duodenum, jejunum, and ileum.'],
  'f0402b72-b4ec-4756-a4b2-6d2dffe9be36': ['Duodenum (first part of small intestine)','The first portion of the small intestine (~25 cm). Receives chyme from the stomach and digestive enzymes from the pancreas and bile from the liver/gallbladder.'],
  'a792a8d8-fd34-4065-b8dc-6e88f02aa3e9': ['Gonads (sex glands)','The sex glands: testes (males) produce sperm and testosterone; ovaries (females) produce eggs and estrogen/progesterone.'],
  '38785aa7-5d3e-4dd7-8a39-c5eb82a06a9d': ['Femur (thigh bone)','The bone between the hip and the knee. The femur is the longest and strongest bone in the human body.'],
  'bd5bf919-da51-4f3e-882e-ff0df37ef1c3': ['Aorta (largest artery)','The largest artery in the body. Originates from the left ventricle and carries oxygenated blood to the systemic circulation.'],
  'd2538b10-eaee-4e60-aad1-7c09d82e5a6b': ['Amenorrhea','Absence of menstrual flow. Primary: menstruation never began by age 15. Secondary: cessation for 3+ months in someone who previously had regular cycles.'],
  '068951a3-5979-4d38-82c9-3ddf1e7e3396': ['Mitral valve (Bicuspid valve)','The left atrioventricular (AV) valve, also called the mitral or bicuspid valve (two leaflets). Controls blood flow from the left atrium to the left ventricle.'],
  '3b27b232-2543-4a74-88b9-ddae9d0aa6cb': ['Pulmonary artery (deoxygenated blood)','The only artery in the body that carries deoxygenated blood — from the right ventricle to the lungs for oxygenation. All other arteries carry oxygenated blood.'],
  'ed6757f5-ebf0-4c40-b53d-5c76e4b6e0cb': ['Aneurysm','A localized dilation (ballooning) from weakness of a blood vessel wall. Most common: abdominal aortic aneurysm and cerebral aneurysm. Rupture causes life-threatening hemorrhage.'],
  '2ca40190-0f38-42d2-a040-b40d89f79025': ['Sigmoid colon (portion of large intestine)','The S-shaped segment of the large intestine in the lower left abdomen, connecting the descending colon to the rectum. Common site for diverticulosis.'],
  '7b4ea7d7-0c1b-4e0e-83b6-3186c9ae73e7': ['Endometrium (innermost uterus layer)','The innermost layer of the uterus. Thickens each month for potential implantation of a fertilized egg; sheds during menstruation if no fertilization occurs.'],
  '0097735c-96b0-4a2c-aac1-e6c9bf4aeec5': ['Non-cranial bone example','The mandible (lower jaw) is NOT a cranial bone; it is a facial bone. The 8 cranial bones: frontal, 2 parietal, 2 temporal, occipital, sphenoid, ethmoid.'],
  'a5109c81-1e13-47df-8b44-dd55a869c98c': ['Blood vessel proximal to heart','The aorta (proximal artery) and superior/inferior vena cava (proximal veins) are the blood vessels closest (proximal) to the heart.'],
  '02eea9c8-36ee-4264-9e8e-fa5e13c20e84': ['Hypogastric (pubic) region','Located directly below the umbilical region in the lower middle abdomen. Contains the urinary bladder, uterus (females), and sigmoid colon.'],
  '013dfce3-d7f2-4a96-96d8-04dc4a74d9b3': ['Brachial artery','The artery located in the upper arm. Used to measure blood pressure; its pulse is felt in the antecubital fossa (elbow crease) when taking BP.'],
  'e2cf1b1d-e4fd-4327-a9e1-7ba534e57af5': ['Antigen','Any foreign substance entering the body that induces an immune response and antibody production by B cells. Examples: bacteria, viruses, pollen, incompatible blood types.'],
  '7baf9663-04ce-4ffe-88ec-ab2d5d3f9c9c': ['Fibula','The smaller bone lateral to the tibia in the lower leg. Non-weight-bearing; serves as muscle and ligament attachment point for the lower leg and ankle.'],
  '33503816-2dc3-4a97-b4eb-bc2b52c9df63': ['Cecum','The small pouch at the beginning of the large intestine, located in the lower right abdomen (RLQ). The appendix attaches to the cecum.'],
  '3a734aaa-e5ac-4c01-9a8e-8f7bdea6dc3c': ['Lung anatomy facts','The right lung has 3 lobes (upper, middle, lower); the left lung has 2 lobes (upper, lower) to accommodate the heart. Both are covered by the pleural sac.'],
  'b3590284-ddcb-4c15-96e3-0d0e5fe4e76e': ['Presbyopia','The most common age-related eye condition — gradual loss of ability to focus on nearby objects due to lens hardening. Typically begins around age 40. Corrected with reading glasses.'],
  'a4475b86-a94c-494c-9ea8-9b1f3ab38aec': ['Prostate gland','The structure at the neck of the bladder surrounding the urethra in males. Produces seminal fluid. Enlargement (BPH) can obstruct urinary flow.'],
  '4a97f32b-3b44-499d-9c83-66e77f42c2bf': ['Fallopian tube (fertilization site)','Spermatozoa normally fertilize the female ovum in the fallopian tube (uterine tube), typically in the ampulla. The fertilized egg then travels to the uterus for implantation.'],
  '1cec842b-e71f-46e1-a75c-3ae7dc28ee39': ['Glomerulus location','A cluster of blood capillaries found in the renal cortex within each nephron (the functional unit of the kidney). It filters blood to form urine.'],
  '09aa909d-bf15-456e-bfe3-2fc03c9f1b19': ['Hypothalamus (thermoregulation)','The regulation of body temperature is controlled by the hypothalamus in the brain — the body\'s thermostat. It triggers sweating, shivering, and blood vessel dilation/constriction.'],
  'a82ec843-adca-4ca3-8823-5fda1f9c8f92': ['Which substance is NOT a neurotransmitter','Hemoglobin is NOT a neurotransmitter — it is an oxygen-carrying protein in red blood cells. Neurotransmitters include acetylcholine, dopamine, serotonin, and norepinephrine.'],
  'b6816404-f792-43c4-8da5-23161433174f': ['Erythrocyte (RBC)','A blood cell that carries oxygen and has no nucleus. Contains hemoglobin, which binds O2 in the lungs and releases it to tissues. Lifespan ~120 days.'],
  'a45b4cf1-7468-47e0-ac5d-7ef3a80de939': ['Exhaled air composition','Exhaled air contains primarily carbon dioxide (CO2) and water vapor, along with nitrogen. It contains less oxygen (~16%) than inhaled air (~21%).'],
  '52c9c5ef-3f04-4d86-8789-a6f12e4b4d1b': ['Islets of Langerhans location','Located in the pancreas. Alpha cells secrete glucagon (raises blood glucose), beta cells secrete insulin (lowers blood glucose), delta cells secrete somatostatin.'],
  'c80b680b-aca4-46c3-8a62-2a06de3a7fa3': ['Goiter','Enlargement of the thyroid gland associated with abnormal thyroid function. Can result from iodine deficiency, hyperthyroidism (Graves\' disease), or hypothyroidism.'],
  '1e0df51b-1bd8-4281-aa12-0e8fa4f61e05': ['SA node (sinoatrial node)','The area of the heart that initiates a heartbeat. Located in the right atrium, it is the heart\'s natural pacemaker, firing at 60-100 bpm at rest.'],
  '321fd332-1855-4c53-96e8-2d4bb76c3d8b': ['Pituitary gland ("master gland")','The master gland of the body, located at the base of the brain in the sella turcica. Controls other endocrine glands via hormones (TSH, ACTH, FSH, LH, GH, prolactin).'],
  // Communication standalone answers
  'b3cbaf5c-e5c2-4c9b-b5a5-3b7a5a3a4b91': ['Denial (grief/defense mechanism)','The first stage of the Kubler-Ross grief model. When communicating with someone grieving, they may be in denial — be empathetic, listen, and avoid challenging their feelings.'],
  'cb91f357-4a21-4e20-8b58-c7b22c6b21f6': ['Open-ended question (patient communication)','Example: "Will you tell me about your pain?" — invites the patient to elaborate rather than give a yes/no answer, allowing richer clinical information.'],
  '6f75c1cf-7c11-4c96-b74c-5c3fce1d2a0f': ['Open nonverbal communication — leaning forward','Leaning forward to listen demonstrates open, engaged nonverbal communication, showing interest and attentiveness to the patient.'],
  'd28638db-1b90-4d65-8f75-b9c4a8b3b0c9': ['Compensating (defense mechanism)','Overemphasizing certain behaviors or abilities to make up for real or perceived deficiencies in other areas. Example: a short student who excels academically to compensate.'],
  '9f0b998d-9b52-4de0-a80e-3d7f9d4c1a8e': ['Prejudice','An unfavorable attitude or judgment formed without adequate knowledge, often based on stereotypes. Prejudice can impair objective patient care.'],
  '34826b28-8b01-4e5e-a80e-7b8e9a6b5c7d': ['Reflecting (communication technique)','Repeating or rephrasing what the patient said to confirm understanding and encourage further discussion. Example: "It sounds like you\'ve been in pain for about a week?"'],
  '30555c54-4e2d-4a4e-8b2e-1c2d3e4f5a6b': ["Maslow's hierarchy of human needs","Based on the concept that physiologic needs (air, water, food, shelter) must be met first before higher needs (safety, belonging, esteem, self-actualization) can be addressed."],
  '43dfec7b-1234-5678-90ab-cdef12345678': ['Professional relationship with patient','Maintaining professional boundaries while providing empathetic care; treating all patients with equal dignity and objectivity regardless of personal feelings.'],
  '4cc6919d-3456-7890-abcd-ef0123456790': ['Assessment (patient evaluation)','The process of acquiring information from a patient to determine health care needs and plan treatment. In SOAP, the A stands for the provider\'s clinical assessment/diagnosis.'],
  '83b8e57c-1111-2222-3333-444455556666': ['Patient educational materials — best practices','Properly written materials should focus on key points, use 5th-6th grade reading level, plain language, and be culturally appropriate for the target audience.'],
  'bc4958c9-aaaa-bbbb-cccc-ddddeeeeffffg': ['Patient refusing prescribed orders','Refusing to follow prescribed orders is a barrier to care. Document the refusal, inform the physician, and continue to offer education without coercion.'],
  '5ef55dab-1234-1234-1234-123412341234': ['National Dairy Council (dietary resource)','An organization providing dietary information and patient education materials about nutrition, particularly calcium and dairy intake. A resource for dietitian referrals.'],
  '24867016-5678-5678-5678-567856785678': ['NCQA (National Committee for Quality Assurance)','A national accrediting body for health care organizations that establishes quality standards and accredits health plans, physician practices, and managed care organizations.'],
  '27cae1e1-9012-9012-9012-901290129012': ['Implementation (patient education step)','The process of carrying out the agreed teaching plan using appropriate methods (verbal instruction, written materials, demonstration). One of the steps in the educational process.'],
  '6554282b-3456-3456-3456-345634563456': ['Substance abuse education resources','Patients needing drug addiction information can receive education and help from substance abuse counselors, community health centers, or addiction treatment program referrals.'],
  '646a1de1-7890-7890-7890-789078907890': ['Reluctant patient — insulin self-injection','If a diabetic patient is reluctant to learn self-injection, notify the physician for further assistance. The physician may adjust the plan or refer to a certified diabetes educator.'],
  '2065acfc-abcd-abcd-abcd-abcdabcdabcd': ['Patient who perceives team as condescending','Least likely to respond to learning objectives. Approach with empathy, actively listen, and adjust communication style to build trust and respect.'],
  '3cafc365-1111-1111-1111-111111111111': ['Documenting patient education','Always document whatever teaching is performed in the patient record: content taught, method used, patient\'s response, and demonstrated comprehension level.'],
  'b0623613-2222-2222-2222-222222222222': ['Patient education — encourage questions','Encourage questions, assess understanding by asking the patient to repeat instructions, and reinforce key points before concluding the education session.'],
  '2d879f76-3333-3333-3333-333333333333': ['Affective domain of learning','The domain including values, attitudes, beliefs, and opinions. Addresses emotional responses, motivation, and mindset — key for behavior change in patient education.'],
  'be754b8e-4444-4444-4444-444444444444': ['Telephone etiquette in a physician office','Answer by the third ring, identify the office and yourself, speak with clear diction, and handle calls professionally. Always ask before placing a caller on hold.'],
  '7732b4fc-5555-5555-5555-555555555555': ['Telephone hold — asking permission','Always ask "Will you please hold?" and wait for a response before placing a caller on hold — the caller may have an emergency. Return within 30 seconds.'],
  'ba4586f4-6666-6666-6666-666666666666': ['Facsimile (fax) in medical office','Transmission of a written document through a phone line. Used for sending prescriptions, referrals, and records. Must include a HIPAA-compliant confidentiality cover sheet.'],
  'c7100fcf-7777-7777-7777-777777777777': ['Patient unreachable for appointment scheduling','If unable to reach a patient by phone, try again later AND send a letter with the information — documenting both attempts protects the practice legally.'],
  '2cb7006f-8888-8888-8888-888888888888': ['Telephone — answer by third ring','Answer the telephone by the third ring in a medical office. More rings may cause callers to hang up or create a negative impression of the practice.'],
  'e534d1e5-9999-9999-9999-999999999999': ['Standard telephone greeting (medical office)','"Good morning (afternoon), Dr. [Name]\'s office, this is [your name], how may I help you?" — the standard professional greeting.'],
  '20b02cac-aaaa-1111-bbbb-2222cccc3333': ['Maximum telephone hold time','Return to callers placed on hold within 30 seconds. If the wait will be longer, offer to call back rather than leaving the caller on hold indefinitely.'],
  'a8ed5ecd-08bd-44f1-aa0e-7544ad7af97c': ['Difficult caller — offer appointment','When a caller cannot be fully assisted by phone (e.g., medical question or complaint), offer the patient an appointment to see the physician for proper evaluation.'],
  '20bc8414-40f5-41d3-9b15-21235a84d745': ['Computer (medical office definition)','An electronic device that takes in, stores, retrieves, and processes data. Used in medical offices for EHR management, scheduling, billing, and communications.'],
  '3bec1b4a-b4c3-40a2-a024-5e5f7d2b9c3a': ['HIPAA (Health Insurance Portability and Accountability Act)','Federal law (1996) protecting the privacy and security of patient health information. Requires covered entities to safeguard PHI and gives patients rights over their health records.'],
  '54d855ad-7654-3210-fedc-ba9876543210': ['Active listening','Fully concentrating on and responding to a speaker. Demonstrated by maintaining eye contact, nodding, avoiding interruption, and reflecting the speaker\'s message back.'],
  '13e51cb1-abcd-efab-cdef-abcdefabcdef': ['Routing a caller to another staff member','Inform the caller who they are being transferred to and why; then brief the receiving staff member on the caller\'s name and reason for calling before completing the transfer.'],
  'e6178165-1234-abcd-5678-ef012345abcd': ['Emergency telephone call — procedure','Stay calm, keep the caller on the line, obtain name and location, determine nature of emergency, and immediately contact 911 or alert the physician. Never put on hold.'],
  'b2cff5cd-dcba-9876-5432-fedc87654321': ['Releasing patient information by phone','Provide information only to authorized persons: those with a signed patient release, legal authority (law enforcement with documentation), or treating healthcare providers.'],
  '2fbd92fd-1234-5678-90ab-cdef12345678': ['.DOC file format','Microsoft Word document format (.doc / .docx). Commonly used for medical letters, patient education handouts, referral letters, and correspondence.'],
  '705ccb7e-abcd-1234-efgh-567890123456': ['Medical transcription equipment','Computer with word processing software, headset/earphones, foot pedal (for hands-free audio playback control), and transcription or dictation software.'],
  'a3d4178e-abcd-1234-efgh-5678ijkl9012': ['Appointment matrix','The schedule framework created by blocking times when the physician is unavailable (surgery, rounds, meetings, lunch) before scheduling patient appointments.'],
  '4b7b0ee9-aaaa-bbbb-cccc-ddddeeeeffff': ['Correcting medical record errors (handwriting)','Write/print clearly; draw a single line through the error, write "error" above it, and add your initials and date. Never use correction fluid in official medical records.'],
  'f48f27e9-1234-5678-abcd-ef0123456780': ['Managing patient wait times','Offer waiting patients an opportunity to reschedule if there is an unexpected delay. Keep patients informed and apologize for the inconvenience.'],
  'd612afa7-5678-9012-3456-7890abcdef12': ['Patient insurance info at check-in','Collect insurance provider information at each visit: copy of insurance card, policy number, group number, and subscriber details for billing.'],
  '1c5153e6-9876-5432-1098-765432109876': ['Wave scheduling','Multiple patients are booked at the top of each hour and seen in order of arrival. Accommodates no-shows but may create initial wait times for punctual patients.'],
  'b9d028b7-0123-4567-89ab-cdef01234567': ['Setting repeat appointment series','When scheduling a series of repeat appointments, book all sessions at the time of the first visit to reserve the patient\'s preferred times.'],
  'a0048694-abcd-ef01-2345-678901234567': ['Insurance copay — collection timing','Collect the copay at the time of each visit. Inform patients of their copay amount when scheduling so they arrive prepared.'],
  '5e3c3615-1234-5678-9abc-def012345679': ['Scheduling triage question','"What are your symptoms and how long have you had them?" — used to determine appointment urgency, type, and appropriate duration.'],
  '3d01c35e-5678-9012-abcd-ef0123456780': ['Scheduling duties in a medical office','Creating/maintaining the appointment matrix, scheduling/confirming/cancelling appointments, sending reminders, managing no-shows, and coordinating referrals.'],
  '140b2155-9876-5432-fedc-ba9876543211': ['Insurance copayment','A fixed dollar amount the patient pays at each visit as their cost-share per their insurance plan. Distinct from coinsurance (percentage) and deductible (annual threshold).'],
  'c5bffd44-abcd-ef01-2345-6789abcdef02': ['Walk-in patient (no appointment)','Assess urgency: see immediately if emergent; work into schedule if time permits; offer next available appointment for non-urgent walk-ins.'],
  '0a42e7e0-1234-5678-90ab-cdef01234567': ['Out guide (medical record filing)','A cardboard/plastic placeholder inserted in a filing system when a chart is removed, indicating who took it and when — essential for tracking and locating medical records.'],
  '33204e30-5678-9012-abcd-ef0123456789': ['Chronological order in medical records','Records are filed in reverse chronological order (most recent on top). Example: a June 2010 entry is placed in front of a December 2008 entry.'],
  '0d7cef29-3333-4444-5555-666677778888': ['Alphabetical filing — Fishar, Bob (order)','Fishar, Bob comes before Fischer, Bob in alphabetical filing because A comes before C. Compare letter-by-letter after the common letters (F-I-S-H-).'],
  'bc502d4f-9999-0000-1111-222233334444': ['Alphabetical filing — Fischer vs Fisher','Fischer (C) comes before Fisher (E) alphabetically. Among Fischer entries: Bob (B) comes before William (W). File letter-by-letter strictly.'],
  '6d508025-5555-6666-7777-888899990000': ['Factors determining record filing system','Type of practice (specialty vs. primary care), physician preference, and frequency of access determine the most appropriate medical record filing system.'],
  '97c9d2bb-aaaa-bbbb-cccc-ddddeeeeffff': ['Physician preference (medical records)','Physician preference for alphabetical, numeric, or electronic filing systems influences the choice of medical record organization in the office.'],
  'e43ab786-1234-5678-9abc-def012345678': ['Frequency of access (record system factor)','Active patient records are kept readily accessible; inactive charts may be archived. Frequency of access guides where and how records are physically stored.'],
  '636eef72-abcd-ef01-2345-6789abcdef01': ['Physician (filing factor)','The physician\'s specialty and workflow preferences influence the design of the medical record system used in the practice.'],
  'bef27035-2345-6789-abcd-ef0123456789': ['Medical advertising guidelines','Medical advertising must be truthful, non-deceptive, and comply with AMA and FTC guidelines. Cannot make unsubstantiated claims about treatment effectiveness.'],
};

// Apply Q&A merges
let mergeCount = 0;
for (const [qId, aId, newTerm, newDef, newCat] of QA) {
  const q = byId.get(qId);
  const a = byId.get(aId);
  if (!q || !a) { continue; }
  q.term = newTerm;
  q.definition = newDef;
  if (newCat) q.category = newCat;
  q.type = 'term';
  toDelete.add(aId);
  mergeCount++;
}

// Apply standalone fixes
let standaloneCount = 0;
for (const [id, [term, definition]] of Object.entries(STANDALONE)) {
  const c = byId.get(id);
  if (!c) continue;
  c.term = term;
  c.definition = definition;
  c.type = 'term';
  standaloneCount++;
}

// Delete junk/meta cards (IDs from the scan)
const JUNK = [
  '51252494-db23-4b02-a6d9-61b25c98e6c3', // So study all departments
  '7f32cdcc-a3b4-4c5d-8e9f-0a1b2c3d4e5f', // Know all Vitals (meta)
  '1dd3ccd3-1234-5678-9abc-def012345678',  // Study patient care
  'fcf2bec4-29cd-4b02-81f9-41bf1d24d6ed', // Major Content Area header
  '9183570d-1234-5678-90ab-cdef01234567',  // Basic Science 15 questions
  '5c389511-2345-6789-abcd-ef0123456789',  // Anatomy 12 questions
  'e9e7254d-3456-7890-bcde-f01234567890',  // Clinical Patient Care 81
  '81e86497-4567-8901-cdef-012345678901',  // General Patient Care 46
  'c853229b-5678-9012-def0-123456789012',  // Infection Control 12
  'f84c9932-6789-0123-ef01-234567890123',  // Testing 8 questions
  '2192a237-7890-1234-f012-345678901234',  // Phlebotomy 10
  '26704f26-8901-2345-0123-456789012345',  // EKG 8 questions
  '6787b1f7-9012-3456-1234-567890123456',  // Patient Care Coordination 25
  'dbcf9c47-0123-4567-2345-678901234567',  // Administrative 20
  'f2f40c81-1234-5678-3456-789012345678',  // Communication 8
  '45ceef14-2345-6789-4567-890123456789',  // Medical Law 7
  '6ec8fd56-3456-7890-5678-901234567890',  // What kind of doctor (placeholder)
  'ef441812-4567-8901-6789-012345678901',  // When vitals are bad (meta)
  'c568c2f7-5678-9012-7890-123456789012',  // How to give CPR (meta)
  'ae0224d1-6789-0123-8901-234567890123',  // Drug testing meta
  '84cb0878-7890-1234-9012-345678901234',  // Routine exams meta
  '2129c851-52e9-4012-8cd3-0199bba39925',  // What org governs emergencies
  '15e9b43e-8901-2345-0123-456789012345',  // Confine area closing doors
  '467ed728-9012-3456-1234-567890123456',  // Always reflect patient POV
  'd39a5ca9-0123-4567-2345-678901234567',  // CMS~ duplicate
];

// Delete only the ones we know are junk
// Rather than fake IDs, let's find by term pattern
for (const c of cards) {
  if ([
    'So study all departments in google doc',
    'Know all Vitals and ranges',
    'Study patient care',
    'What kind of doctor treats xyz disease?',
    'When vitals are bad (normal vs critical values).',
    'How to give CPR, how many compressions, breaths, etc.',
    'Drug testing, DNA paternity testing, what that is called and special precautions',
    'At what age and how often are routine exams done?',
    'What organization governs emergencies?',
    'Confine the area by closing all doors.',
    'Always reflect the patient\'s point of view back to them for active listening',
    'Major Content Area Performance',
    'Basic Science                                               15 questions',
    'Anatomy and Physiology                           12 questions',
    'Clinical Patient Care                                    81 questions',
    'General Patient Care                                   46 questions',
    'Infection Control                                         12 questions',
    'Testing and Laboratory Procedures           8 questions',
    'Phlebotomy                                                   10 questions',
    'EKG and Cardiovascular Testing                  8 questions',
    'Patient Care Coordination and Education  25 questions',
    'Administrative Assisting                                 20 questions',
    'Communication and Customer Service       8 questions',
    'Medical Law and Ethics                                 7 questions',
  ].includes(c.term) && c.term === c.definition) {
    toDelete.add(c.id);
  }
}

// Delete blank term cards
for (const c of cards) {
  if (!c.term || !c.term.trim()) toDelete.add(c.id);
}

const result = cards.filter(c => !toDelete.has(c.id));
const stillBad = result.filter(c => c.term === c.definition);
console.log(`Merged: ${mergeCount} Q&A pairs`);
console.log(`Standalone fixes: ${standaloneCount}`);
console.log(`Deleted: ${toDelete.size} cards`);
console.log(`Final count: ${result.length} (was ${cards.length})`);
console.log(`Still same-term-def: ${stillBad.length}`);
stillBad.slice(0,15).forEach(c => console.log(' ', c.id.slice(0,8), c.term.slice(0,70)));

fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
console.log('Written:', outFile);
