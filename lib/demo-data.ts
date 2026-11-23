// Demo data: wipes the database and fills it with fictional doctors, patients,
// appointments and reviews so the demo never looks empty.
// Used by `npm run seed` and by the admin "Reset demo data" button.
// ALL people here are fictional. Areas of Indore are real place names.
import bcrypt from "bcryptjs";
import type { PrismaClient, AppointmentStatus } from "@prisma/client";
import { addDays, nowInIndia, dayOfWeek } from "./time";

export const DEMO_PASSWORD = "Demo@1234";

// A tiny predictable random generator so every reset gives the same data.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const SPECIALISATIONS = [
  ["General Physician", "General doctor", "सामान्य चिकित्सक", "general-physician"],
  ["Dermatologist", "Skin doctor", "त्वचा रोग विशेषज्ञ", "dermatologist"],
  ["Dentist", "Teeth doctor", "दांतों के डॉक्टर", "dentist"],
  ["Paediatrician", "Children's doctor", "बच्चों के डॉक्टर", "paediatrician"],
  ["Gynaecologist", "Women's health doctor", "स्त्री रोग विशेषज्ञ", "gynaecologist"],
  ["Orthopaedist", "Bones & joints doctor", "हड्डी रोग विशेषज्ञ", "orthopaedist"],
  ["Ophthalmologist", "Eye doctor", "आंखों के डॉक्टर", "ophthalmologist"],
  ["ENT Specialist", "Ear, nose & throat doctor", "कान, नाक, गला विशेषज्ञ", "ent"],
  ["Psychiatrist", "Mental health doctor", "मनोचिकित्सक", "psychiatrist"],
  ["Psychologist", "Counsellor", "मनोवैज्ञानिक", "psychologist"],
  ["Cardiologist", "Heart doctor", "हृदय रोग विशेषज्ञ", "cardiologist"],
  ["Neurologist", "Brain & nerves doctor", "तंत्रिका रोग विशेषज्ञ", "neurologist"],
  ["Gastroenterologist", "Stomach doctor", "पेट रोग विशेषज्ञ", "gastroenterologist"],
  ["Endocrinologist", "Diabetes & hormone doctor", "मधुमेह व हार्मोन विशेषज्ञ", "endocrinologist"],
  ["Pulmonologist", "Lungs & breathing doctor", "फेफड़ों के डॉक्टर", "pulmonologist"],
] as const;

const AREAS = [
  ["Vijay Nagar", "विजय नगर", "452010", 22.7533, 75.8937],
  ["Palasia", "पलासिया", "452001", 22.7244, 75.8839],
  ["Rajwada", "राजवाड़ा", "452002", 22.7186, 75.8553],
  ["Bhawarkua", "भंवरकुआं", "452001", 22.6926, 75.8673],
  ["Sudama Nagar", "सुदामा नगर", "452009", 22.699, 75.832],
  ["Annapurna", "अन्नपूर्णा", "452009", 22.696, 75.841],
  ["Rau", "राऊ", "453331", 22.639, 75.813],
  ["Navlakha", "नवलखा", "452001", 22.7, 75.879],
  ["Sapna Sangeeta", "सपना संगीता", "452001", 22.705, 75.872],
  ["MR 10", "एमआर 10", "452010", 22.756, 75.907],
  ["Nipania", "निपानिया", "452010", 22.76, 75.92],
  ["Khajrana", "खजराना", "452016", 22.735, 75.909],
] as const;

// [name, gender, specialisation slug, area, fee, years, languages, qualifications]
const DOCTORS: [string, string, string, string, number, number, string[], string][] = [
  ["Dr. Anjali Mehta", "Female", "dermatologist", "Vijay Nagar", 500, 14, ["Hindi", "English"], "MBBS, MD Dermatology"],
  ["Dr. Rohan Joshi", "Male", "dermatologist", "Vijay Nagar", 400, 9, ["Hindi", "English", "Marathi"], "MBBS, DVD"],
  ["Dr. Farah Qureshi", "Female", "dermatologist", "Palasia", 450, 18, ["Hindi", "English", "Sindhi"], "MBBS, MD Dermatology"],
  ["Dr. Vikram Patidar", "Male", "dermatologist", "Vijay Nagar", 300, 6, ["Hindi", "Malwi"], "MBBS, DDVL"],
  ["Dr. Sunil Verma", "Male", "general-physician", "Rajwada", 200, 22, ["Hindi", "Malwi"], "MBBS"],
  ["Dr. Kavita Rathore", "Female", "general-physician", "Bhawarkua", 250, 11, ["Hindi", "English"], "MBBS, MD Medicine"],
  ["Dr. Imran Sheikh", "Male", "general-physician", "Khajrana", 200, 8, ["Hindi", "English"], "MBBS"],
  ["Dr. Neha Agrawal", "Female", "dentist", "Sapna Sangeeta", 300, 7, ["Hindi", "English", "Gujarati"], "BDS, MDS"],
  ["Dr. Aditya Jain", "Male", "dentist", "Vijay Nagar", 400, 12, ["Hindi", "English"], "BDS"],
  ["Dr. Pooja Malviya", "Female", "paediatrician", "Annapurna", 500, 15, ["Hindi", "English", "Marathi"], "MBBS, MD Paediatrics"],
  ["Dr. Rajesh Tiwari", "Male", "paediatrician", "Navlakha", 400, 25, ["Hindi"], "MBBS, DCH"],
  ["Dr. Sneha Kulkarni", "Female", "gynaecologist", "Palasia", 700, 16, ["Hindi", "English", "Marathi"], "MBBS, MS Obstetrics & Gynaecology"],
  ["Dr. Meera Chouhan", "Female", "gynaecologist", "Sudama Nagar", 500, 10, ["Hindi", "Malwi"], "MBBS, DGO"],
  ["Dr. Arvind Singh", "Male", "orthopaedist", "MR 10", 800, 20, ["Hindi", "English"], "MBBS, MS Orthopaedics"],
  ["Dr. Harsh Vyas", "Male", "orthopaedist", "Bhawarkua", 600, 9, ["Hindi", "Gujarati"], "MBBS, D Ortho"],
  ["Dr. Ritu Saxena", "Female", "ophthalmologist", "Palasia", 500, 13, ["Hindi", "English"], "MBBS, MS Ophthalmology"],
  ["Dr. Manoj Pandey", "Male", "ophthalmologist", "Rau", 300, 19, ["Hindi", "Malwi"], "MBBS, DOMS"],
  ["Dr. Swati Dubey", "Female", "ent", "Sapna Sangeeta", 450, 8, ["Hindi", "English"], "MBBS, MS ENT"],
  ["Dr. Nikhil Bhatia", "Male", "psychiatrist", "Vijay Nagar", 1000, 12, ["Hindi", "English", "Sindhi"], "MBBS, MD Psychiatry"],
  ["Dr. Aisha Khan", "Female", "psychologist", "Nipania", 800, 6, ["Hindi", "English"], "MA, MPhil Clinical Psychology"],
  ["Dr. Prakash Sharma", "Male", "cardiologist", "MR 10", 1200, 24, ["Hindi", "English"], "MBBS, MD, DM Cardiology"],
  ["Dr. Deepa Nair", "Female", "cardiologist", "Palasia", 1500, 17, ["English", "Hindi"], "MBBS, MD, DM Cardiology"],
  ["Dr. Amit Goyal", "Male", "neurologist", "Nipania", 1200, 14, ["Hindi", "English"], "MBBS, MD, DM Neurology"],
  ["Dr. Shalini Mishra", "Female", "gastroenterologist", "Annapurna", 900, 11, ["Hindi", "English"], "MBBS, MD, DM Gastroenterology"],
  ["Dr. Gaurav Soni", "Male", "endocrinologist", "Vijay Nagar", 900, 10, ["Hindi", "English", "Gujarati"], "MBBS, MD, DM Endocrinology"],
  ["Dr. Tanvi Bhargava", "Female", "pulmonologist", "Navlakha", 700, 9, ["Hindi", "English"], "MBBS, MD Pulmonary Medicine"],
  ["Dr. Yusuf Ali", "Male", "general-physician", "Sudama Nagar", 250, 30, ["Hindi", "English"], "MBBS, MD Medicine"],
  ["Dr. Komal Thakur", "Female", "dentist", "Khajrana", 250, 5, ["Hindi", "Malwi"], "BDS"],
  ["Dr. Sanjay Patel", "Male", "ent", "Rajwada", 350, 21, ["Hindi", "Gujarati"], "MBBS, DLO"],
  ["Dr. Lata Joshi", "Female", "paediatrician", "Vijay Nagar", 600, 27, ["Hindi", "Marathi", "English"], "MBBS, MD Paediatrics"],
];

const HOSPITALS = [
  ["Malwa City Hospital (demo)", "AB Road, near Sayaji Square", "Vijay Nagar", "0731-4000101", true, true, true, true],
  ["Ahilya Care Centre (demo)", "Race Course Road", "Palasia", "0731-4000102", true, true, true, false],
  ["Narmada Multispeciality (demo)", "Ring Road, Bhawarkua Square", "Bhawarkua", "0731-4000103", true, true, false, true],
  ["Holkar Heart & Trauma (demo)", "MR 10 Road", "MR 10", "0731-4000104", true, true, false, false],
  ["Rajwada Community Clinic (demo)", "Near Rajwada Palace", "Rajwada", "0731-4000105", false, false, true, false],
  ["Annapurna Nursing Home (demo)", "Annapurna Main Road", "Annapurna", "0731-4000106", false, false, false, false],
] as const;

// [bodyArea, symptom, hindi, specialisation slug or "", appliesTo, emergency, selfHarm]
const RULES: [string, string, string, string, string, boolean?, boolean?][] = [
  ["skin", "Rash or itching", "चकत्ते या खुजली", "dermatologist", "all"],
  ["skin", "Acne or pimples", "मुंहासे", "dermatologist", "all"],
  ["skin", "Hair fall", "बाल झड़ना", "dermatologist", "all"],
  ["skin", "Severe burns", "गंभीर जलना", "", "all", true],
  ["skin", "Swelling of face or throat", "चेहरे या गले में सूजन", "", "all", true],
  ["teeth", "Toothache", "दांत दर्द", "dentist", "all"],
  ["teeth", "Bleeding gums", "मसूड़ों से खून", "dentist", "all"],
  ["teeth", "Mouth ulcers that won't heal", "न भरने वाले मुंह के छाले", "dentist", "all"],
  ["eyes", "Blurry vision", "धुंधला दिखना", "ophthalmologist", "all"],
  ["eyes", "Red or itchy eyes", "आंखें लाल या खुजली", "ophthalmologist", "all"],
  ["eyes", "Sudden loss of vision", "अचानक दिखना बंद", "", "all", true],
  ["ent", "Ear pain", "कान दर्द", "ent", "all"],
  ["ent", "Sore throat for over a week", "एक हफ्ते से गले में खराश", "ent", "all"],
  ["ent", "Blocked nose or sinus", "बंद नाक या साइनस", "ent", "all"],
  ["ent", "Hearing loss", "सुनने में कमी", "ent", "all"],
  ["chest", "Chest pain or pressure", "सीने में दर्द या दबाव", "", "all", true],
  ["chest", "Severe difficulty breathing", "सांस लेने में बहुत तकलीफ", "", "all", true],
  ["chest", "Long-lasting cough", "लंबी खांसी", "pulmonologist", "all"],
  ["chest", "Wheezing or asthma", "सांस फूलना या दमा", "pulmonologist", "all"],
  ["heart", "Fast or uneven heartbeat", "तेज़ या अनियमित धड़कन", "cardiologist", "all"],
  ["heart", "High blood pressure", "हाई ब्लड प्रेशर", "cardiologist", "adult"],
  ["heart", "Swollen ankles", "टखनों में सूजन", "cardiologist", "senior"],
  ["stomach", "Acidity or heartburn", "एसिडिटी", "gastroenterologist", "all"],
  ["stomach", "Stomach pain", "पेट दर्द", "gastroenterologist", "all"],
  ["stomach", "Diarrhoea for days", "कई दिन से दस्त", "general-physician", "all"],
  ["stomach", "Vomiting blood", "खून की उल्टी", "", "all", true],
  ["stomach", "Poisoning", "ज़हर खा लेना", "", "all", true],
  ["bones", "Knee or joint pain", "घुटने या जोड़ों का दर्द", "orthopaedist", "all"],
  ["bones", "Back pain", "कमर दर्द", "orthopaedist", "all"],
  ["bones", "Possible broken bone", "हड्डी टूटने का शक", "orthopaedist", "all"],
  ["bones", "Neck stiffness", "गर्दन में अकड़न", "orthopaedist", "adult"],
  ["head", "Frequent headaches", "बार-बार सिरदर्द", "neurologist", "all"],
  ["head", "Dizziness", "चक्कर आना", "general-physician", "all"],
  ["head", "Numbness or tingling", "सुन्नपन या झनझनाहट", "neurologist", "all"],
  ["head", "Face drooping, arm weakness or slurred speech", "चेहरा टेढ़ा, हाथ में कमज़ोरी या बोलने में दिक्कत", "", "all", true],
  ["head", "Fainting or unconsciousness", "बेहोशी", "", "all", true],
  ["head", "Seizure (fit)", "दौरा पड़ना", "", "all", true],
  ["mind", "Feeling low or sad for weeks", "हफ्तों से उदासी", "psychiatrist", "all"],
  ["mind", "Anxiety or panic", "घबराहट या बेचैनी", "psychologist", "all"],
  ["mind", "Trouble sleeping", "नींद न आना", "psychiatrist", "all"],
  ["mind", "Stress at work or studies", "काम या पढ़ाई का तनाव", "psychologist", "all"],
  ["mind", "Thoughts of harming myself", "खुद को नुकसान पहुंचाने के विचार", "psychiatrist", "all", false, true],
  ["urine", "Burning while passing urine", "पेशाब में जलन", "general-physician", "all"],
  ["urine", "Passing urine very often", "बार-बार पेशाब", "endocrinologist", "adult"],
  ["urine", "Blood in urine", "पेशाब में खून", "general-physician", "all"],
  ["women", "Irregular periods", "अनियमित माहवारी", "gynaecologist", "adult"],
  ["women", "Pregnancy check-up", "गर्भावस्था जांच", "gynaecologist", "pregnant"],
  ["women", "Heavy bleeding in pregnancy", "गर्भावस्था में ज़्यादा खून आना", "", "pregnant", true],
  ["women", "Menopause symptoms", "रजोनिवृत्ति के लक्षण", "gynaecologist", "senior"],
  ["general", "Fever for more than 3 days", "3 दिन से ज़्यादा बुखार", "general-physician", "all"],
  ["general", "Fever in a child", "बच्चे को बुखार", "paediatrician", "child"],
  ["general", "High fever with stiff neck in a child", "बच्चे को तेज़ बुखार और गर्दन में अकड़न", "", "child", true],
  ["general", "Tiredness all the time", "हमेशा थकान", "general-physician", "all"],
  ["general", "Unexplained weight loss", "बिना वजह वज़न घटना", "endocrinologist", "all"],
  ["general", "Feeling very thirsty, possible diabetes", "बहुत प्यास, मधुमेह का शक", "endocrinologist", "all"],
  ["general", "Child not growing or eating well", "बच्चे का ठीक से न बढ़ना या न खाना", "paediatrician", "child"],
  ["general", "Vaccination for a child", "बच्चे का टीकाकरण", "paediatrician", "child"],
  ["general", "Heavy bleeding that won't stop", "न रुकने वाला खून", "", "all", true],
  ["general", "Thyroid problems", "थायरॉइड की समस्या", "endocrinologist", "all"],
  ["general", "Memory problems", "याददाश्त की समस्या", "neurologist", "senior"],
];

const PATIENT_NAMES = [
  "Ramesh Kumar", "Sneha Patil", "Arjun Malviya", "Sunita Dubey", "Kavya Rathore", "Mohan Lal",
  "Neha Sharma", "Rahul Verma", "Fatima Begum", "Vivek Choudhary", "Pallavi Joshi", "Harish Yadav",
];

const REVIEW_TEXTS = [
  "Explained everything in simple Hindi and did not push unnecessary tests.",
  "Very patient with my elderly mother. The ramp at the entrance made it easy.",
  "Clear advice and a short wait. Would visit again.",
  "Had to wait about 20 minutes past my slot, but the doctor took time with me.",
  "Friendly staff and a clean clinic. The fee was fair.",
  "The doctor listened properly and wrote everything down for us.",
  "Good experience overall. Booking on TrustCare was easy.",
  "Helpful, but the clinic was crowded in the evening.",
  "Explained the treatment plan step by step. Felt much better after a week.",
  "Very professional. Answered all my questions without rushing.",
];

const REPLIES = [
  "Thank you for your kind words. Wishing you good health.",
  "Thank you. We are working on reducing evening waiting times.",
];

/** Delete everything and create the demo data again. */
export async function resetDemoData(db: PrismaClient) {
  const r = rng(42);
  const pickOne = <T,>(arr: readonly T[]) => arr[Math.floor(r() * arr.length)];
  const { date: today } = nowInIndia();
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Wipe (children before parents).
  await db.$transaction([
    db.message.deleteMany(),
    db.callSignal.deleteMany(),
    db.loginAttempt.deleteMany(),
    db.notification.deleteMany(),
    db.reviewReport.deleteMany(),
    db.review.deleteMany(),
    db.appointment.deleteMany(),
    db.savedDoctor.deleteMany(),
    db.familyMember.deleteMany(),
    db.availabilityBlock.deleteMany(),
    db.leave.deleteMany(),
    db.searchEvent.deleteMany(),
    db.symptomRule.deleteMany(),
    db.doctorProfile.deleteMany(),
    db.hospital.deleteMany(),
    db.user.deleteMany(),
    db.area.deleteMany(),
    db.specialisation.deleteMany(),
  ]);

  // 2. Master data.
  await db.specialisation.createMany({
    data: SPECIALISATIONS.map(([name, simpleName, hindiName, slug]) => ({ name, simpleName, hindiName, slug })),
  });
  await db.area.createMany({
    data: AREAS.map(([name, hindiName, pinCode, latitude, longitude]) => ({ name, hindiName, pinCode, latitude, longitude })),
  });
  const specs = await db.specialisation.findMany();
  const areas = await db.area.findMany();
  const specBySlug = Object.fromEntries(specs.map((s) => [s.slug, s]));
  const areaByName = Object.fromEntries(areas.map((a) => [a.name, a]));

  const jitter = () => (r() - 0.5) * 0.014; // spread places around each area's centre
  await db.hospital.createMany({
    data: HOSPITALS.map(([name, address, area, phone, open24x7, emergencyWard, acceptsAyushman, bloodBank], i) => ({
      name, address, areaId: areaByName[area].id, phone, open24x7, emergencyWard, acceptsAyushman, bloodBank,
      latitude: areaByName[area].latitude + jitter(), longitude: areaByName[area].longitude + jitter(),
      bedsAvailable: open24x7 ? 8 + i * 5 : 2, icuAvailable: emergencyWard ? 2 + i : 0, oxygenAvailable: i !== 5,
      bloodGroups: bloodBank ? ["A+", "B+", "O+", "AB+", "O-"].slice(0, 5 - i) : [],
      specialities: [["Cardiology", "Trauma", "Paediatrics", "General Medicine"], ["Obstetrics", "Paediatrics", "Orthopaedics"], ["Neurology", "Orthopaedics", "General Surgery"], ["Cardiology", "Trauma"], ["General Medicine"], ["Obstetrics", "General Medicine"]][i],
    })),
  });
  await db.symptomRule.createMany({
    data: RULES.map(([bodyArea, symptom, symptomHindi, slug, appliesTo, isEmergency, isSelfHarm]) => ({
      bodyArea, symptom, symptomHindi, appliesTo,
      specialisationId: slug ? specBySlug[slug].id : null,
      isEmergency: !!isEmergency, isSelfHarm: !!isSelfHarm,
    })),
  });

  // 3. Accounts.
  // Hospital portal demo login, linked to the first hospital.
  const firstHospital = await db.hospital.findFirstOrThrow({ where: { name: HOSPITALS[0][0] } });
  await db.user.create({
    data: { name: "Malwa City Hospital (demo)", email: "hospital@demo.com", phone: "9000000002", passwordHash: hash, role: "HOSPITAL", hospital: { connect: { id: firstHospital.id } } },
  });
  const admin = await db.user.create({
    data: { name: "Admin Team", email: "admin@demo.com", phone: "9000000001", passwordHash: hash, role: "ADMIN" },
  });
  const patient = await db.user.create({
    data: { name: "Priya Sharma", email: "patient@demo.com", phone: "9826012345", passwordHash: hash, role: "PATIENT" },
  });
  const otherPatients = await Promise.all(
    PATIENT_NAMES.map((name, i) =>
      db.user.create({
        data: { name, email: `patient${i + 2}@demo.com`, phone: `98260${String(10000 + i).padStart(5, "0")}`, passwordHash: hash },
      }),
    ),
  );
  const [mother, son] = await Promise.all([
    db.familyMember.create({ data: { patientId: patient.id, name: "Kamla Sharma", relationship: "Mother", dateOfBirth: "1958-03-14", gender: "Female", accessibilityNeeds: "Wheelchair user" } }),
    db.familyMember.create({ data: { patientId: patient.id, name: "Aarav Sharma", relationship: "Child", dateOfBirth: "2016-08-02", gender: "Male" } }),
  ]);

  // 4. Doctors. The first two have fixed demo emails.
  const doctorIds: string[] = [];
  for (let i = 0; i < DOCTORS.length; i++) {
    const [name, gender, slug, areaName, fee, years, languages, qualifications] = DOCTORS[i];
    const email = i === 0 ? "doctor@demo.com" : i === 1 ? "doctor2@demo.com" : `doctor${i + 1}@demo.com`;
    const area = areaByName[areaName];
    const surname = name.split(" ").pop();
    const user = await db.user.create({
      data: {
        name, email, phone: `97520${String(20000 + i).padStart(5, "0")}`, passwordHash: hash, role: "DOCTOR",
        doctorProfile: {
          create: {
            qualifications, specialisationId: specBySlug[slug].id, experienceYears: years, gender, languages,
            bio: `${name} has ${years} years of experience as a ${specBySlug[slug].simpleName.toLowerCase()} in Indore. Known for clear explanations, ${languages.join(" and ")} consultations, and caring for whole families.`,
            registrationNumber: `MP-${String(10234 + i * 137)}`,
            stateMedicalCouncil: "Madhya Pradesh Medical Council",
            registrationYear: 2026 - years,
            verificationStatus: "VERIFIED", verifiedAt: new Date(Date.now() - (10 + i) * 86400000), verifiedByName: "Admin Team",
            clinicName: `${surname} ${specBySlug[slug].simpleName.split(" ")[0]} Clinic`,
            clinicAddress: `${12 + i}, Main Road, ${areaName}, Indore ${area.pinCode}`,
            areaId: area.id, pinCode: area.pinCode, clinicPhone: `73100${String(30000 + i).padStart(5, "0")}`, fee,
            acceptsAyushman: i % 3 === 0,
            ramp: i === 0 || i % 3 !== 1, // at least 8 doctors with a ramp
            lift: i % 4 === 1,
            accessibleWashroom: i % 5 === 0,
            groundFloor: i % 2 === 0,
            signLanguage: i === 1 || i === 10 || i === 20,
            textBooking: i % 3 === 2 || i === 0,
            homeVisits: i % 7 === 3,
            latitude: area.latitude + jitter(),
            longitude: area.longitude + jitter(),
            offersVideo: i % 2 === 0 || i === 1,
            videoFee: Math.max(200, Math.round((fee * 0.8) / 50) * 50),
          },
        },
      },
      include: { doctorProfile: true },
    });
    doctorIds.push(user.doctorProfile!.id);
  }

  // Pending and rejected doctors for the verification demo.
  await db.user.create({
    data: {
      name: "Dr. Karan Malhotra", email: "pending@demo.com", phone: "9752099001", passwordHash: hash, role: "DOCTOR",
      doctorProfile: { create: {
        qualifications: "MBBS, MD Medicine", specialisationId: specBySlug["general-physician"].id, experienceYears: 4, gender: "Male",
        languages: ["Hindi", "English"], bio: "Recently moved to Indore after residency in Bhopal. Interested in family medicine and preventive check-ups for working professionals.",
        registrationNumber: "MP-55821", stateMedicalCouncil: "Madhya Pradesh Medical Council", registrationYear: 2022,
        clinicName: "Malhotra Family Clinic", clinicAddress: "45, Scheme 78, Vijay Nagar, Indore 452010", areaId: areaByName["Vijay Nagar"].id,
        pinCode: "452010", clinicPhone: "7310099001", fee: 300, ramp: true, groundFloor: true,
      } },
    },
  });
  await db.user.create({
    data: {
      name: "Dr. Sameer Khan", email: "rejected@demo.com", phone: "9752099002", passwordHash: hash, role: "DOCTOR",
      doctorProfile: { create: {
        qualifications: "MBBS", specialisationId: specBySlug["dentist"].id, experienceYears: 3, gender: "Male",
        languages: ["Hindi"], bio: "General dental care for families, including cleaning, fillings and check-ups. Evening appointments available on weekdays.",
        registrationNumber: "MP-00012", stateMedicalCouncil: "Madhya Pradesh Medical Council", registrationYear: 2023,
        verificationStatus: "REJECTED", rejectionReason: "The registration number MP-00012 does not match this name on the NMC Indian Medical Register. Please check the number and resubmit.",
        clinicName: "Smile Dental", clinicAddress: "8, Khajrana Main Road, Indore 452016", areaId: areaByName["Khajrana"].id,
        pinCode: "452016", clinicPhone: "7310099002", fee: 200,
      } },
    },
  });

  // 5. Weekly hours: Mon–Sat 10:00–13:00 and 17:00–20:00; some open Sunday mornings.
  const blocks: { doctorId: string; dayOfWeek: number; startMinute: number; endMinute: number }[] = [];
  doctorIds.forEach((doctorId, i) => {
    for (let d = 1; d <= 6; d++) {
      blocks.push({ doctorId, dayOfWeek: d, startMinute: 600, endMinute: 780 });
      if (i % 4 !== 2) blocks.push({ doctorId, dayOfWeek: d, startMinute: 1020, endMinute: 1200 });
    }
    if (i % 3 === 0) blocks.push({ doctorId, dayOfWeek: 0, startMinute: 600, endMinute: 720 });
  });
  await db.availabilityBlock.createMany({ data: blocks });

  // One doctor (not Dr. Mehta) is on leave tomorrow.
  await db.leave.create({ data: { doctorId: doctorIds[4], fromDate: addDays(today, 1), toDate: addDays(today, 1), reason: "Medical conference" } });

  // 6. Past appointments (last 30 days) and reviews.
  const allPatients = [patient, ...otherPatients];
  const pastOpenings = (doctorIndex: number, date: string) => {
    const dow = dayOfWeek(date);
    return blocks.filter((b) => b.doctorId === doctorIds[doctorIndex] && b.dayOfWeek === dow);
  };
  type NewAppt = { patientId: string; doctorId: string; date: string; startMinute: number; status: AppointmentStatus; reasonForVisit?: string; cancelReason?: string; cancelledBy?: "PATIENT" | "DOCTOR" | "SYSTEM"; mode?: "CLINIC" | "VIDEO"; fee?: number; paymentStatus?: "PAID" | "UNPAID"; paidAt?: Date; paymentRef?: string };
  const past: NewAppt[] = [];
  const used = new Set<string>();
  let guard = 0;
  while (past.length < 60 && guard++ < 2000) {
    const di = r() < 0.3 ? 0 : Math.floor(r() * doctorIds.length); // Dr. Mehta gets extra
    const date = addDays(today, -1 - Math.floor(r() * 30));
    const opens = pastOpenings(di, date);
    if (!opens.length) continue;
    const b = pickOne(opens);
    const startMinute = b.startMinute + 15 * Math.floor(r() * ((b.endMinute - b.startMinute) / 15));
    const key = `${di}|${date}|${startMinute}`;
    if (used.has(key)) continue;
    used.add(key);
    const roll = r();
    const status: AppointmentStatus = roll < 0.78 ? "COMPLETED" : roll < 0.9 ? "CANCELLED" : "NO_SHOW";
    past.push({
      patientId: (di === 0 && past.filter((p) => p.patientId === patient.id).length < 2 ? patient : pickOne(allPatients)).id,
      doctorId: doctorIds[di], date, startMinute, status,
      ...(() => {
        const video = DOCTORS[di] && (di % 2 === 0 || di === 1) && r() < 0.3;
        const fee = video ? Math.max(200, Math.round((DOCTORS[di][4] * 0.8) / 50) * 50) : DOCTORS[di][4];
        const paid = status === "COMPLETED" && (video || r() < 0.5);
        return { mode: video ? ("VIDEO" as const) : ("CLINIC" as const), fee, ...(paid ? { paymentStatus: "PAID" as const, paidAt: new Date(Date.parse(date + "T06:00:00Z")), paymentRef: `TC-DEMO-${Math.floor(r() * 1e8)}` } : {}) };
      })(),
      reasonForVisit: pickOne(["Skin rash", "Follow-up visit", "Routine check-up", "Pain for a few days", undefined]),
      ...(status === "CANCELLED" ? r() < 0.5
        ? { cancelReason: "Change of plans", cancelledBy: "PATIENT" as const }
        : { cancelReason: "Doctor on leave", cancelledBy: "SYSTEM" as const } : {}),
    });
  }
  await db.appointment.createMany({ data: past });
  const completed = await db.appointment.findMany({ where: { status: "COMPLETED" }, orderBy: { date: "asc" } });

  // Leave one completed visit of patient@demo.com with Dr. Mehta without a review, so we can demo writing one.
  const demoUnreviewed = completed.find((a) => a.patientId === patient.id && a.doctorId === doctorIds[0]);
  const toReview = completed.filter((a) => a.id !== demoUnreviewed?.id).slice(0, 40);
  for (let i = 0; i < toReview.length; i++) {
    const a = toReview[i];
    const base = r() < 0.15 ? 3 : 4;
    await db.review.create({
      data: {
        appointmentId: a.id, patientId: a.patientId, doctorId: a.doctorId,
        waitRating: Math.min(5, base + (r() < 0.5 ? 1 : 0)),
        explanationRating: Math.min(5, base + (r() < 0.7 ? 1 : 0)),
        valueRating: Math.min(5, base + (r() < 0.6 ? 1 : 0)),
        text: pickOne(REVIEW_TEXTS),
        doctorReply: i % 6 === 0 ? pickOne(REPLIES) : null,
        createdAt: new Date(Date.parse(a.date + "T12:00:00Z") + 86400000),
      },
    });
  }
  // A review that someone reported, waiting in the moderation queue.
  const reviewedIds = new Set(toReview.map((a) => a.id));
  const flagAppt = completed.find((a) => !reviewedIds.has(a.id) && a.id !== demoUnreviewed?.id);
  const flagged = flagAppt
    ? await db.review.create({
        data: {
          appointmentId: flagAppt.id, patientId: flagAppt.patientId, doctorId: flagAppt.doctorId,
          waitRating: 1, explanationRating: 1, valueRating: 1,
          text: "Worst doctor ever!!! Call me on 98xxxxxx21 for the full story, don't trust this clinic.",
        },
      })
    : null;
  if (flagged) {
    await db.reviewReport.create({ data: { reviewId: flagged.id, reportedById: patient.id, reason: "Personal information" } });
  }

  // 7. Upcoming appointments for patient@demo.com.
  const tomorrow = addDays(today, 1);
  const nextWorkday = (from: string, doctorIndex: number) => {
    let d = from;
    for (let i = 0; i < 7 && !pastOpenings(doctorIndex, d).length; i++) d = addDays(d, 1);
    return d;
  };
  const t1 = nextWorkday(tomorrow, 0);
  await db.appointment.createMany({
    data: [
      { patientId: patient.id, doctorId: doctorIds[0], date: t1, startMinute: 615, status: "CONFIRMED", reasonForVisit: "Itchy rash on both arms", fee: 500 },
      { patientId: patient.id, familyMemberId: mother.id, doctorId: doctorIds[0], date: nextWorkday(addDays(t1, 2), 0), startMinute: 1050, status: "REQUESTED", reasonForVisit: "Dry skin", accessibilityNote: "Wheelchair user" },
      { patientId: patient.id, familyMemberId: son.id, doctorId: doctorIds[9], date: nextWorkday(addDays(today, 3), 9), startMinute: 630, status: "CONFIRMED", reasonForVisit: "Vaccination" },
      { patientId: patient.id, doctorId: doctorIds[15], date: nextWorkday(addDays(today, 5), 15), startMinute: 1080, status: "REQUESTED" },
      { patientId: otherPatients[1].id, doctorId: doctorIds[0], date: nextWorkday(addDays(today, 2), 0), startMinute: 660, status: "REQUESTED", reasonForVisit: "Hair fall" },
      { patientId: otherPatients[2].id, doctorId: doctorIds[0], date: t1, startMinute: 1065, status: "CONFIRMED" },
      { patientId: otherPatients[4].id, doctorId: doctorIds[1], date: nextWorkday(tomorrow, 1), startMinute: 615, status: "REQUESTED", reasonForVisit: "Acne" },
    ],
  });

  // Every appointment stores the fee at the time of booking.
  for (const a of await db.appointment.findMany({ where: { fee: 0 }, include: { doctor: { select: { fee: true } } } }))
    await db.appointment.update({ where: { id: a.id }, data: { fee: a.doctor.fee } });

  // An online video consultation (already paid) with a chat thread, for the demo.
  const videoDocIndex = 18; // Dr. Nikhil Bhatia, psychiatrist, offers video consults
  const videoDay = nextWorkday(today, videoDocIndex);
  const videoAppt = await db.appointment.create({
    data: {
      patientId: patient.id, doctorId: doctorIds[videoDocIndex], date: videoDay, startMinute: 1140, status: "CONFIRMED", mode: "VIDEO",
      fee: 800, paymentStatus: "PAID", paidAt: new Date(), paymentRef: "TC-DEMO-48213907", reasonForVisit: "Trouble sleeping and stress at work",
    },
  });
  const nikhil = await db.doctorProfile.findUniqueOrThrow({ where: { id: doctorIds[videoDocIndex] } });
  await db.message.createMany({
    data: [
      { appointmentId: videoAppt.id, senderId: patient.id, text: "Hello doctor, I have been sleeping only 4 hours a night for two weeks.", createdAt: new Date(Date.now() - 3 * 3600000) },
      { appointmentId: videoAppt.id, senderId: nikhil.userId, text: "Thank you for sharing, Priya. We'll talk about it on the video call. Please note your sleep times until then.", createdAt: new Date(Date.now() - 2 * 3600000) },
      { appointmentId: videoAppt.id, senderId: patient.id, text: "Sure, I will. Thank you!", createdAt: new Date(Date.now() - 3600000) },
    ],
  });

  // 8. Ratings, saved doctors, searches, notifications.
  await recomputeAllRatings(db);
  await db.savedDoctor.createMany({ data: [doctorIds[0], doctorIds[9], doctorIds[16]].map((doctorId) => ({ patientId: patient.id, doctorId })) });

  const searchWeights = ["dermatologist", "dermatologist", "dermatologist", "general-physician", "general-physician", "dentist", "paediatrician", "gynaecologist", "orthopaedist", "psychiatrist", "ent", "ophthalmologist", "cardiologist"];
  await db.searchEvent.createMany({
    data: Array.from({ length: 200 }, (_, i) => ({
      specialisationId: specBySlug[pickOne(searchWeights)].id,
      areaId: r() < 0.6 ? pickOne(areas).id : null,
      createdAt: new Date(Date.now() - Math.floor(r() * 30) * 86400000 - i * 1000),
    })),
  });

  const docMehtaUser = await db.user.findUnique({ where: { email: "doctor@demo.com" } });
  await db.notification.createMany({
    data: [
      { userId: patient.id, title: "Appointment confirmed", message: `Dr. Anjali Mehta confirmed your visit.`, link: "/patient/appointments" },
      { userId: patient.id, title: "How was your visit?", message: "Share a review of Dr. Anjali Mehta to help others.", link: "/patient/appointments?tab=past" },
      { userId: docMehtaUser!.id, title: "New booking request", message: "Priya Sharma requested a visit for her mother.", link: "/doctor/appointments" },
      { userId: admin.id, title: "Review reported", message: "A review was reported for sharing personal information.", link: "/admin/reviews" },
      { userId: admin.id, title: "New doctor to verify", message: "Dr. Karan Malhotra submitted registration MP-55821.", link: "/admin/doctors" },
    ],
  });

  return { doctors: doctorIds.length + 2, patients: allPatients.length };
}

/** Rating = average of the three sub-ratings over visible reviews. */
export async function recomputeRating(db: PrismaClient, doctorId: string) {
  const reviews = await db.review.findMany({ where: { doctorId, isHidden: false } });
  const avg = reviews.length
    ? reviews.reduce((s, r) => s + (r.waitRating + r.explanationRating + r.valueRating) / 3, 0) / reviews.length
    : 0;
  await db.doctorProfile.update({ where: { id: doctorId }, data: { ratingAverage: Math.round(avg * 10) / 10, ratingCount: reviews.length } });
}

async function recomputeAllRatings(db: PrismaClient) {
  const docs = await db.doctorProfile.findMany({ select: { id: true } });
  for (const d of docs) await recomputeRating(db, d.id);
}
