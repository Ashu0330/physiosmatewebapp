import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorPatient } from '../../../models/doctor-dashboard.model';

export interface EMRPatient {
  id: string;
  patientCode: string;
  fullName: string;
  age: number;
  gender: 'Female' | 'Male';
  phone: string;
  email: string;
  bloodGroup: string;
  dob: string;
  address: string;
  emergencyContact: string;
  primaryCondition: string;
  status: 'Active' | 'Completed' | 'Pending';
  visitedCategory: 'recent-visited' | 'recent-added' | 'regular';
  clinicalGroup: string;
  notes: string;
  medicalHistory: string[];
  groups: string[];
  memberships: string;
  counts: {
    appointments: number;
    clinicalNotes: number;
    treatmentPlans: number;
    completedProcedures: number;
    files: number;
    prescriptions: number;
    invoices: number;
    payments: number;
  };
}

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
})
export class Patients {
  // Inputs & Outputs for parent component
  patients = input<DoctorPatient[]>([]);
  navigateToAdd = output<void>();
  navigateToPlans = output<void>();

  // View mode: starts on 'cards' (the patient directory cards screen from screenshot), switches to 'emr' on card click
  viewMode = signal<'cards' | 'emr'>('cards');

  // Currently selected patient for the EMR view
  selectedPatient = signal<EMRPatient | null>(null);

  // Active subtab inside EMR view
  activeSubTab = signal<string>('profile');

  // Search query & filter inside cards view
  cardSearchQuery = signal<string>('');
  selectedGroupFilter = signal<string>('all');

  // Sidebar toggle & modal states
  isSidebarCollapsed = signal<boolean>(false);
  newNoteText = signal<string>('');
  showEditModal = signal<boolean>(false);
  showPhotoModal = signal<boolean>(false);

  // 15 Rich Dummy Patients matching the screenshot cards and clinic database
  allEMRPatients = signal<EMRPatient[]>([
    {
      id: 'P971',
      patientCode: 'P971',
      fullName: 'nita chimote',
      age: 31,
      gender: 'Female',
      phone: '+917389902664',
      email: 'nita.chimote@example.com',
      bloodGroup: 'B+',
      dob: '12 Sep 1995',
      address: 'Flat 302, Sunrise Heights, Kothrud, Pune, Maharashtra',
      emergencyContact: '+91 98220 11223 (Rahul Chimote - Spouse)',
      primaryCondition: 'Cervical Spondylosis & Postural Neck Strain',
      status: 'Active',
      visitedCategory: 'recent-visited',
      clinicalGroup: 'Spine Care',
      notes: 'Patient reports reduced cervical stiffness after 3rd traction session. Recommended 15 min daily home stretching.',
      medicalHistory: [
        'Cervical Spondylosis (C5-C6)',
        'Mild Essential Hypertension (under medical control)',
        'No known drug allergies (NKDA)'
      ],
      groups: ['Post-Op Rehab', 'VIP Client', 'Morning Slot'],
      memberships: 'PhysiosMate Annual Wellness Pass (Active - Renews Dec 2026)',
      counts: {
        appointments: 12,
        clinicalNotes: 1,
        treatmentPlans: 6,
        completedProcedures: 12,
        files: 4,
        prescriptions: 11,
        invoices: 12,
        payments: 12
      }
    },
    {
      id: 'P1982',
      patientCode: 'P1982',
      fullName: 'tijia devi',
      age: 48,
      gender: 'Female',
      phone: '+919329219283',
      email: 'tijia.devi@example.com',
      bloodGroup: 'O+',
      dob: '14 Jan 1978',
      address: '74, Ganesh Nagar, Model Colony, Pune',
      emergencyContact: '+91 93292 19280 (Son - Suresh)',
      primaryCondition: 'Bilateral Knee Osteoarthritis (Grade II)',
      status: 'Active',
      visitedCategory: 'recent-visited',
      clinicalGroup: 'Joint Rehab',
      notes: 'Joint crepitus in left knee reduced. Initiated quadriceps isometric strengthening.',
      medicalHistory: ['Osteoarthritis Knee Grade II', 'Mild Osteopenia'],
      groups: ['Joint Care', 'Morning Slot'],
      memberships: 'PhysiosMate Silver Pass',
      counts: {
        appointments: 9,
        clinicalNotes: 2,
        treatmentPlans: 3,
        completedProcedures: 8,
        files: 3,
        prescriptions: 5,
        invoices: 8,
        payments: 8
      }
    },
    {
      id: 'P2416',
      patientCode: 'P2416',
      fullName: 'ashish mahajan',
      age: 36,
      gender: 'Male',
      phone: '+919893052965',
      email: 'ashish.m@example.com',
      bloodGroup: 'A+',
      dob: '22 Aug 1990',
      address: 'Plot 18, IT Park Road, Hinjewadi, Pune',
      emergencyContact: '+91 98930 52960 (Renu Mahajan - Wife)',
      primaryCondition: 'Postural Thoracic Kyphosis & Rhomboid Spasm',
      status: 'Active',
      visitedCategory: 'recent-visited',
      clinicalGroup: 'Spine Care',
      notes: 'Workstation ergonomic evaluation complete. Prescribed scapular retraction drills.',
      medicalHistory: ['Thoracic Spine Postural Dysfunction', 'No known allergies'],
      groups: ['IT Ergonomics Care', 'Evening Slot'],
      memberships: 'Corporate Health Plan',
      counts: {
        appointments: 6,
        clinicalNotes: 2,
        treatmentPlans: 2,
        completedProcedures: 5,
        files: 2,
        prescriptions: 3,
        invoices: 5,
        payments: 5
      }
    },
    {
      id: 'P2369',
      patientCode: 'P2369',
      fullName: 'adhya sinha',
      age: 29,
      gender: 'Female',
      phone: '+919097792605',
      email: 'adhya.sinha@example.com',
      bloodGroup: 'B+',
      dob: '05 Mar 1997',
      address: 'Penthouse 4, Green Valley, Baner, Pune',
      emergencyContact: '+91 90977 92600 (Parent - V. Sinha)',
      primaryCondition: 'Sciatica & Piriformis Syndrome (Right Leg)',
      status: 'Active',
      visitedCategory: 'recent-visited',
      clinicalGroup: 'Spine Care',
      notes: 'Piriformis stretch tolerated well. Positive straight leg raise angle increased to 70°.',
      medicalHistory: ['Sciatica Right L5/S1', 'Piriformis Tightness'],
      groups: ['Spine Care Program', 'VIP Client'],
      memberships: 'PhysiosMate Wellness Pass',
      counts: {
        appointments: 10,
        clinicalNotes: 3,
        treatmentPlans: 4,
        completedProcedures: 7,
        files: 4,
        prescriptions: 4,
        invoices: 7,
        payments: 7
      }
    },
    {
      id: 'P2614',
      patientCode: 'P2614',
      fullName: 'mohd munna',
      age: 44,
      gender: 'Male',
      phone: '+918602924633',
      email: 'mohd.munna@example.com',
      bloodGroup: 'O+',
      dob: '18 Nov 1982',
      address: '22, Camp Cantonment, Pune',
      emergencyContact: '+91 86029 24630 (Family Contact)',
      primaryCondition: 'Lumbar Spondylolisthesis (Grade I L5-S1)',
      status: 'Active',
      visitedCategory: 'recent-visited',
      clinicalGroup: 'Spine Care',
      notes: 'Focus on flexion bias core stabilization. Extension exercises strictly contra-indicated.',
      medicalHistory: ['Grade I Spondylolisthesis', 'Hypertension'],
      groups: ['Spine Clinic'],
      memberships: 'Pay Per Session',
      counts: {
        appointments: 7,
        clinicalNotes: 2,
        treatmentPlans: 3,
        completedProcedures: 6,
        files: 3,
        prescriptions: 4,
        invoices: 6,
        payments: 6
      }
    },
    {
      id: 'P2613',
      patientCode: 'P2613',
      fullName: 'sabitri murmu',
      age: 55,
      gender: 'Female',
      phone: '+918989118011',
      email: 'sabitri.m@example.com',
      bloodGroup: 'AB+',
      dob: '30 Jul 1971',
      address: 'A-12, Railway Colony, Pune',
      emergencyContact: '+91 89891 18010 (Daughter - Anita)',
      primaryCondition: 'Supraspinatus Tendinopathy & Subacromial Impingement',
      status: 'Active',
      visitedCategory: 'recent-visited',
      clinicalGroup: 'Shoulder Rehab',
      notes: 'Ultrasound therapy applied to right supraspinatus tendon. Passive abduction 110 degrees.',
      medicalHistory: ['Rotator Cuff Tendinopathy', 'Type 2 Diabetes'],
      groups: ['Shoulder Clinic', 'Morning Slot'],
      memberships: 'PhysiosMate Standard Plan',
      counts: {
        appointments: 8,
        clinicalNotes: 3,
        treatmentPlans: 2,
        completedProcedures: 8,
        files: 2,
        prescriptions: 4,
        invoices: 8,
        payments: 8
      }
    },
    {
      id: 'P2612',
      patientCode: 'P2612',
      fullName: 'sajid khan ji',
      age: 33,
      gender: 'Male',
      phone: '+917489152234',
      email: 'sajid.khan@example.com',
      bloodGroup: 'B+',
      dob: '12 Dec 1993',
      address: 'Flat 101, Lake Vista, Katraj, Pune',
      emergencyContact: '+91 74891 52230 (Brother - Tariq)',
      primaryCondition: 'Tennis Elbow (Lateral Epicondylalgia - Right)',
      status: 'Active',
      visitedCategory: 'recent-visited',
      clinicalGroup: 'Sports Rehab',
      notes: 'Deep friction massage and eccentric wrist extensor protocol with TheraBand bar.',
      medicalHistory: ['Lateral Epicondylitis Right Elbow'],
      groups: ['Sports Injury Rehab'],
      memberships: 'Sports Recovery Plan',
      counts: {
        appointments: 5,
        clinicalNotes: 1,
        treatmentPlans: 2,
        completedProcedures: 4,
        files: 1,
        prescriptions: 3,
        invoices: 4,
        payments: 4
      }
    },
    {
      id: 'P197',
      patientCode: 'P197',
      fullName: 'jitendra singh pal',
      age: 39,
      gender: 'Male',
      phone: '+919893357419',
      email: 'jitendra.pal@example.com',
      bloodGroup: 'O+',
      dob: '04 Oct 1987',
      address: '15/B, Koregaon Park Annex, Pune',
      emergencyContact: '+91 98933 57410 (Spouse - Sunita)',
      primaryCondition: 'Chronic Plantar Fasciitis & Calcaneal Spur',
      status: 'Active',
      visitedCategory: 'recent-added',
      clinicalGroup: 'Sports Rehab',
      notes: 'Shockwave therapy protocol initiated. Custom silicon heel cup recommended.',
      medicalHistory: ['Plantar Fasciitis Bilateral', 'High BMI'],
      groups: ['Foot & Ankle Clinic'],
      memberships: 'Annual Wellness Pass',
      counts: {
        appointments: 4,
        clinicalNotes: 1,
        treatmentPlans: 1,
        completedProcedures: 3,
        files: 2,
        prescriptions: 2,
        invoices: 3,
        payments: 3
      }
    },
    {
      id: 'P2611',
      patientCode: 'P2611',
      fullName: 'alia khatum',
      age: 26,
      gender: 'Female',
      phone: '+919826144320',
      email: 'alia.khatum@example.com',
      bloodGroup: 'A-',
      dob: '19 Apr 2000',
      address: '304, Silver Crest, Viman Nagar, Pune',
      emergencyContact: '+91 98261 44329 (Mother - F. Khatum)',
      primaryCondition: 'Cervicogenic Headache & Forward Head Posture',
      status: 'Active',
      visitedCategory: 'recent-added',
      clinicalGroup: 'Spine Care',
      notes: 'Suboccipital myofascial release provided. Significant immediate tension headache relief.',
      medicalHistory: ['Cervicogenic Headache', 'Postural Neck Strain'],
      groups: ['VIP Client', 'IT Ergonomics Care'],
      memberships: 'PhysiosMate Wellness Pass',
      counts: {
        appointments: 4,
        clinicalNotes: 2,
        treatmentPlans: 2,
        completedProcedures: 4,
        files: 2,
        prescriptions: 2,
        invoices: 4,
        payments: 4
      }
    },
    {
      id: 'P2610',
      patientCode: 'P2610',
      fullName: 'affia khatum',
      age: 28,
      gender: 'Female',
      phone: '+919826100912',
      email: 'affia.k@example.com',
      bloodGroup: 'O+',
      dob: '23 Jun 1998',
      address: '304, Silver Crest, Viman Nagar, Pune',
      emergencyContact: '+91 98261 44320 (Sister - Alia)',
      primaryCondition: 'Thoracic Outlet Syndrome (Postural)',
      status: 'Active',
      visitedCategory: 'recent-added',
      clinicalGroup: 'Spine Care',
      notes: 'Scalene and pectoralis minor stretching exercises prescribed.',
      medicalHistory: ['Postural Nerve Compression'],
      groups: ['Spine Clinic'],
      memberships: 'Standard Plan',
      counts: {
        appointments: 3,
        clinicalNotes: 1,
        treatmentPlans: 1,
        completedProcedures: 2,
        files: 1,
        prescriptions: 2,
        invoices: 2,
        payments: 2
      }
    },
    {
      id: 'P2609',
      patientCode: 'P2609',
      fullName: 'shanaz khan',
      age: 42,
      gender: 'Female',
      phone: '+919644659973',
      email: 'shanaz.khan@example.com',
      bloodGroup: 'B-',
      dob: '08 Feb 1984',
      address: 'Flat 502, Greenview Terraces, Hadapsar, Pune',
      emergencyContact: '+91 96446 59970 (Spouse - A. Khan)',
      primaryCondition: 'Chronic Lumbar Disc Herniation & Postural Kyphosis',
      status: 'Active',
      visitedCategory: 'recent-added',
      clinicalGroup: 'Spine Care',
      notes: 'Spine decompression protocol week 2. Core activation improved.',
      medicalHistory: ['L4-L5 Disc Bulge', 'Mild Scoliotic Curve'],
      groups: ['Spine Care Program', 'Evening Slot'],
      memberships: 'Annual Wellness Pass',
      counts: {
        appointments: 5,
        clinicalNotes: 2,
        treatmentPlans: 3,
        completedProcedures: 4,
        files: 3,
        prescriptions: 3,
        invoices: 4,
        payments: 4
      }
    },
    {
      id: 'PT-1041',
      patientCode: 'PT-1041',
      fullName: 'ananya iyer',
      age: 34,
      gender: 'Female',
      phone: '+919823456789',
      email: 'ananya.iyer@example.com',
      bloodGroup: 'O+',
      dob: '24 Apr 1992',
      address: 'B-14, Greenwoods Residency, Baner, Pune',
      emergencyContact: '+91 98234 56780 (Rajesh Iyer - Husband)',
      primaryCondition: 'Lumbar Disc Herniation & Sciatica',
      status: 'Active',
      visitedCategory: 'recent-visited',
      clinicalGroup: 'Spine Care',
      notes: 'Significant reduction in radiating leg pain. Continue neutral spine core activation.',
      medicalHistory: ['L4-L5 Disc Protrusion', 'Seasonal allergic rhinitis'],
      groups: ['Spine Care Program', 'Evening Slot'],
      memberships: 'PhysiosMate Spine Care Package',
      counts: {
        appointments: 8,
        clinicalNotes: 3,
        treatmentPlans: 4,
        completedProcedures: 6,
        files: 5,
        prescriptions: 4,
        invoices: 6,
        payments: 6
      }
    },
    {
      id: 'PT-1042',
      patientCode: 'PT-1042',
      fullName: 'vikramaditya rao',
      age: 28,
      gender: 'Male',
      phone: '+919845012345',
      email: 'vikram.rao@example.com',
      bloodGroup: 'A+',
      dob: '08 Jan 1998',
      address: '702, Skyline Towers, Aundh, Pune',
      emergencyContact: '+91 98450 12340 (Sneha Rao - Sister)',
      primaryCondition: 'Right Knee ACL Reconstruction (Post-Op Wk 8)',
      status: 'Active',
      visitedCategory: 'recent-visited',
      clinicalGroup: 'Sports Rehab',
      notes: 'Full active extension achieved. Concentrating on eccentric quadriceps strength.',
      medicalHistory: ['Right Knee ACL Tear (Hamstring graft)', 'Post-Op Week 8 Protocol'],
      groups: ['Sports Injury Rehab', 'Athlete Program'],
      memberships: 'Elite Sports Recovery Plan',
      counts: {
        appointments: 14,
        clinicalNotes: 5,
        treatmentPlans: 8,
        completedProcedures: 10,
        files: 6,
        prescriptions: 7,
        invoices: 10,
        payments: 10
      }
    },
    {
      id: 'PT-1043',
      patientCode: 'PT-1043',
      fullName: 'meera nambiar',
      age: 52,
      gender: 'Female',
      phone: '+919711234567',
      email: 'meera.nambiar@example.com',
      bloodGroup: 'B+',
      dob: '15 Jul 1974',
      address: '401, Palms Enclave, Viman Nagar, Pune',
      emergencyContact: '+91 97112 34560 (K. Nambiar - Husband)',
      primaryCondition: 'Adhesive Capsulitis (Frozen Shoulder - Left)',
      status: 'Active',
      visitedCategory: 'recent-visited',
      clinicalGroup: 'Shoulder Rehab',
      notes: 'Grade II mobilization tolerated well. Passive abduction improved by 15 degrees.',
      medicalHistory: ['Frozen Shoulder (Phase 2)', 'Type 2 Diabetes'],
      groups: ['Senior Wellness', 'Shoulder Clinic'],
      memberships: 'PhysiosMate Standard Plan',
      counts: {
        appointments: 6,
        clinicalNotes: 2,
        treatmentPlans: 2,
        completedProcedures: 4,
        files: 2,
        prescriptions: 3,
        invoices: 4,
        payments: 4
      }
    },
    {
      id: 'PT-1045',
      patientCode: 'PT-1045',
      fullName: 'siddharth verma',
      age: 23,
      gender: 'Male',
      phone: '+919650043210',
      email: 'siddharth.v@example.com',
      bloodGroup: 'O-',
      dob: '19 Nov 2002',
      address: '12, Shanti Kunj, FC Road, Pune',
      emergencyContact: '+91 96500 43219 (Sunil Verma - Father)',
      primaryCondition: 'Lateral Ankle Sprain (Grade II ATFL)',
      status: 'Completed',
      visitedCategory: 'regular',
      clinicalGroup: 'Sports Rehab',
      notes: 'Discharged with home balance board maintenance exercises. Full proprioception restored.',
      medicalHistory: ['Grade II ATFL Sprain (Inversion injury)'],
      groups: ['Sports Rehab', 'Discharged Patients'],
      memberships: 'Pay Per Session',
      counts: {
        appointments: 8,
        clinicalNotes: 4,
        treatmentPlans: 2,
        completedProcedures: 8,
        files: 2,
        prescriptions: 3,
        invoices: 8,
        payments: 8
      }
    }
  ]);

  // Filtered patient cards computed based on search query and left filter selection
  filteredPatientCards = computed<EMRPatient[]>(() => {
    const list = this.allEMRPatients();
    const query = this.cardSearchQuery().toLowerCase().trim();
    const filter = this.selectedGroupFilter();

    return list.filter(p => {
      // Group filter logic
      let matchesGroup = true;
      if (filter === 'recent-visited') matchesGroup = p.visitedCategory === 'recent-visited';
      else if (filter === 'recent-added') matchesGroup = p.visitedCategory === 'recent-added';
      else if (filter === 'male') matchesGroup = p.gender === 'Male';
      else if (filter === 'female') matchesGroup = p.gender === 'Female';
      else if (filter === 'active') matchesGroup = p.status === 'Active';
      else if (filter === 'completed') matchesGroup = p.status === 'Completed';
      else if (filter === 'spine') matchesGroup = p.clinicalGroup === 'Spine Care';
      else if (filter === 'sports') matchesGroup = p.clinicalGroup === 'Sports Rehab';
      else if (filter === 'shoulder') matchesGroup = p.clinicalGroup === 'Shoulder Rehab';

      // Search match
      const matchesSearch = !query ||
        p.fullName.toLowerCase().includes(query) ||
        p.patientCode.toLowerCase().includes(query) ||
        p.phone.includes(query) ||
        p.primaryCondition.toLowerCase().includes(query);

      return matchesGroup && matchesSearch;
    });
  });

  // Dummy Appointments for selected patient
  dummyAppointments = [
    { date: '28 Oct 2026', time: '10:00 AM - 10:45 AM', type: 'In-Clinic Consultation', therapist: 'Dr. Himanshu Suman', status: 'Scheduled', room: 'Rehab Suite 2' },
    { date: '25 Oct 2026', time: '11:30 AM - 12:15 PM', type: 'Cervical Traction & IFT', therapist: 'Dr. Himanshu Suman', status: 'Completed', room: 'Therapy Room 1' },
    { date: '22 Oct 2026', time: '11:00 AM - 11:45 AM', type: 'Manual Mobilization & ROM', therapist: 'Dr. Himanshu Suman', status: 'Completed', room: 'Therapy Room 1' },
    { date: '18 Oct 2026', time: '04:00 PM - 04:45 PM', type: 'Ultrasound & Heat Therapy', therapist: 'Dr. Preeti Sharma', status: 'Completed', room: 'Electrotherapy Bay' },
    { date: '15 Oct 2026', time: '10:30 AM - 11:15 AM', type: 'Initial Clinical Evaluation', therapist: 'Dr. Himanshu Suman', status: 'Completed', room: 'Consultation Suite' }
  ];

  // Dummy Vital Signs
  dummyVitals = {
    bp: '120/80 mmHg',
    pulse: '74 bpm',
    spo2: '99%',
    temp: '98.4 °F',
    respiratoryRate: '16 /min',
    height: '162 cm',
    weight: '58 kg',
    bmi: '22.1 (Normal)',
    painScore: '3 / 10'
  };

  // Dummy Clinical SOAP Note
  dummyClinicalNotes = [
    {
      date: '25 Oct 2026, 12:15 PM',
      doctor: 'Dr. Himanshu Suman (PT)',
      subjective: 'Patient reports 40% reduction in neck stiffness and decreased pain radiating to left shoulder.',
      objective: 'Cervical extension increased by 10°. Bilateral rotation: Left 65°, Right 70°. No Spurling sign.',
      assessment: 'Improving subacute cervical radiculopathy. Positive response to spinal decompression.',
      plan: 'Continue 3x weekly motorized traction (12 kg) + isometric neck flexor strengthening.'
    }
  ];

  // Dummy Treatment Plans
  dummyTreatmentPlans = [
    { name: 'Cervical Spine Decompression Protocol', sessions: '6 / 12', status: 'Active', progress: 50 },
    { name: 'Deep Neck Flexor & Scapular Stabilization', sessions: '4 / 8', status: 'Active', progress: 50 },
    { name: 'Postural Kyphosis Ergonomic Re-education', sessions: '2 / 6', status: 'Active', progress: 33 },
    { name: 'Upper Trapezius Trigger Point Release', sessions: '3 / 4', status: 'In Progress', progress: 75 },
    { name: 'Home Neck Isometric Exercise Regimen', sessions: 'Daily', status: 'Ongoing', progress: 80 },
    { name: 'Final Proprioceptive Maintenance Phase', sessions: '0 / 4', status: 'Upcoming', progress: 0 }
  ];

  // Dummy Completed Procedures
  dummyProcedures = [
    { name: 'Motorized Intermittent Cervical Traction', date: '25 Oct 2026', duration: '20 mins', therapist: 'Dr. Himanshu Suman' },
    { name: 'Interferential Therapy (IFT) Cervical Spine', date: '25 Oct 2026', duration: '15 mins', therapist: 'Dr. Himanshu Suman' },
    { name: 'Grade II Maitland Joint Mobilization (C5-C6)', date: '22 Oct 2026', duration: '15 mins', therapist: 'Dr. Himanshu Suman' },
    { name: 'Myofascial Trigger Point Release (Levator Scapulae)', date: '22 Oct 2026', duration: '15 mins', therapist: 'Dr. Preeti Sharma' },
    { name: 'Therapeutic Ultrasound (1 MHz, 1.2 W/cm²)', date: '18 Oct 2026', duration: '10 mins', therapist: 'Dr. Preeti Sharma' },
    { name: 'Moist Heat Pack Application', date: '18 Oct 2026', duration: '15 mins', therapist: 'Dr. Preeti Sharma' },
    { name: 'Scapular Retraction & Chin Tucks Instruction', date: '15 Oct 2026', duration: '20 mins', therapist: 'Dr. Himanshu Suman' },
    { name: 'Comprehensive Functional Movement Assessment', date: '15 Oct 2026', duration: '30 mins', therapist: 'Dr. Himanshu Suman' }
  ];

  // Dummy Prescriptions
  dummyPrescriptions = [
    { type: 'Medication', title: 'Thiocolchicoside (4mg)', dosage: '1 tablet twice daily after meals', duration: '5 days', instructions: 'Muscle relaxant for cervical spasms' },
    { type: 'Medication', title: 'Paracetamol (650mg)', dosage: '1 tablet SOS for acute pain', duration: 'As needed', instructions: 'Take only if pain exceeds 5/10' },
    { type: 'Rehab Exercise', title: 'Cervical Isometric Flexion & Extension', dosage: '10 reps x 3 sets', duration: 'Daily morning & evening', instructions: 'Hold for 5 seconds against palm resistance' },
    { type: 'Rehab Exercise', title: 'Chin Tucks with Scapular Squeeze', dosage: '15 reps x 2 sets', duration: 'Twice daily', instructions: 'Maintain neutral spine, do not look down' },
    { type: 'Support / Ergonomic', title: 'Contoured Orthopedic Cervical Pillow', dosage: 'Nightly sleep', duration: 'Permanent', instructions: 'Sleep in supine or side-lying position only' }
  ];

  // Dummy Invoices
  dummyInvoices = [
    { invNo: 'INV-2026-904', date: '25 Oct 2026', service: 'Physiotherapy Session (Traction + IFT)', amount: '₹1,200', status: 'Paid', mode: 'UPI' },
    { invNo: 'INV-2026-872', date: '22 Oct 2026', service: 'Physiotherapy Session (Mobilization)', amount: '₹1,200', status: 'Paid', mode: 'Credit Card' },
    { invNo: 'INV-2026-831', date: '18 Oct 2026', service: 'Physiotherapy Session (Ultrasound)', amount: '₹1,200', status: 'Paid', mode: 'Cash' },
    { invNo: 'INV-2026-789', date: '15 Oct 2026', service: 'Initial Specialist Doctor Consultation', amount: '₹1,500', status: 'Paid', mode: 'UPI' }
  ];

  // Dummy Files
  dummyFiles = [
    { title: 'Cervical Spine X-Ray (AP & Lateral View).pdf', size: '2.4 MB', date: '15 Oct 2026', doctor: 'Dr. Himanshu Suman' },
    { title: 'MRI Cervical Spine Scan Report.pdf', size: '5.1 MB', date: '14 Oct 2026', doctor: 'Radiology Lab' },
    { title: 'Postural Spine Alignment Analysis.pdf', size: '1.2 MB', date: '15 Oct 2026', doctor: 'PhysiosMate Clinical' },
    { title: 'Discharge Summary & Home Rehab Guidelines.pdf', size: '850 KB', date: '25 Oct 2026', doctor: 'Dr. Himanshu Suman' }
  ];

  // Dummy Timeline
  dummyTimeline = [
    { date: '25 Oct 2026', title: 'Session #4 Completed', desc: 'Patient demonstrated notable improvement in neck rotation (increased by 10 degrees).' },
    { date: '22 Oct 2026', title: 'Maitland Mobilization Initiated', desc: 'Grade II mobilization of C5-C6 segment started without adverse reaction.' },
    { date: '18 Oct 2026', title: 'Ultrasound Therapy Session', desc: 'Targeted ultrasound applied to left levator scapulae trigger point.' },
    { date: '15 Oct 2026', title: 'Initial Assessment & Treatment Onboarding', desc: 'Evaluated by Dr. Himanshu Suman. Assigned Cervical Spine Protocol.' }
  ];

  // User Actions
  openPatientEMR(patient: EMRPatient): void {
    this.selectedPatient.set(patient);
    this.activeSubTab.set('profile');
    this.viewMode.set('emr');
  }

  backToCards(): void {
    this.viewMode.set('cards');
  }

  setGroupFilter(group: string): void {
    this.selectedGroupFilter.set(group);
  }

  setSubTab(tab: string): void {
    this.activeSubTab.set(tab);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(val => !val);
  }

  onAddPatientClick(): void {
    this.navigateToAdd.emit();
  }

  onPlansClick(): void {
    this.navigateToPlans.emit();
  }

  addNote(): void {
    const note = this.newNoteText().trim();
    const current = this.selectedPatient();
    if (note && current) {
      const updatedNotes = current.notes ? `${current.notes}\n• ${note}` : note;
      this.selectedPatient.set({
        ...current,
        notes: updatedNotes
      });
      this.newNoteText.set('');
    }
  }

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
}
