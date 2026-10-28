import { Component, input, output, signal, computed, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorPatient } from '../../../models/doctor-dashboard.model';
import { ApiService } from '../../../services/api.service';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { ApiEndPoints } from '../../../helper/api-endpoints';

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
export class Patients implements OnInit {
  private apiService = inject(ApiService);
  private alert = inject(SweetAlertService);

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

  // ─── Infinite Scroll / API State ─────────────────────────────────────────
  private readonly PAGE_SIZE = 20;
  private currentPage = 1;
  isLoadingPatients = signal<boolean>(false);
  hasMorePatients = signal<boolean>(true);

  formData: any = {
    fullName: '',
    mobile: '',
    email: '',
    gender: 'Male',
    dob: '',
    address: '',
    city: '',
    state: '',
    userId: 1,
    roleId: 3,
    phone: '',
    primaryCondition: 'General Assessment'
  };

  private showError(msg: string): void { this.alert.toastError(msg); }
  private showSuccess(msg: string): void { this.alert.toastSuccess(msg); }

  allEMRPatients = signal<EMRPatient[]>([]);

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

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadPatients();
  }

  // ─── Window Scroll for Infinite Scrolling ─────────────────────────────────
  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.viewMode() !== 'cards') return;
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight || document.body.scrollHeight;

    // Load next page when user scrolls near bottom (300px threshold)
    if (windowHeight + scrollY >= documentHeight - 300) {
      if (this.hasMorePatients() && !this.isLoadingPatients()) {
        this.loadMorePatients();
      }
    }
  }

  // ─── API: Load patients with pagination ──────────────────────────────────
  async loadPatients(page: number = 1): Promise<void> {
    if (this.isLoadingPatients()) return;
    this.isLoadingPatients.set(true);
    try {
      const request: any = {
        page,
        pageSize: this.PAGE_SIZE
      };
      const query = this.cardSearchQuery()?.trim();
      if (query) {
        request.search = query;
      }
      const response = await this.apiService.Post<any>(
        ApiEndPoints.GetMyPatients,
        request
      );
      if (response?.isSuccess && response.data?.items?.length > 0) {
        const items: EMRPatient[] = response.data.items.map((p: any) => this.mapToEMRPatient(p));
        if (page === 1) {
          this.allEMRPatients.set(items);
        } else {
          this.allEMRPatients.update(existing => [...existing, ...items]);
        }
        this.currentPage = page;
        // If fewer items returned than page size, no more pages
        this.hasMorePatients.set(items.length === this.PAGE_SIZE);
      } else {
        if (page === 1) {
          this.allEMRPatients.set([]);
        }
        this.hasMorePatients.set(false);
      }
    } catch (error) {
      console.error('Load patients error:', error);
      this.showError('Error loading patients. Please try again.');
    } finally {
      this.isLoadingPatients.set(false);
    }
  }

  // ─── API: Load next page for infinite scroll ──────────────────────────────
  async loadMorePatients(): Promise<void> {
    if (!this.hasMorePatients() || this.isLoadingPatients()) return;
    await this.loadPatients(this.currentPage + 1);
  }

  // ─── Map API patient object to EMRPatient ─────────────────────────────────
  private mapToEMRPatient(p: any): EMRPatient {
    const gender: 'Male' | 'Female' =
      (p.gender === 'Female' || p.gender === 'female') ? 'Female' : 'Male';

    let age = p.age ?? 0;
    if (!age && p.dob) {
      const birth = new Date(p.dob);
      const now = new Date();
      let calc = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) calc--;
      age = calc >= 0 ? calc : 0;
    }

    return {
      id: p.patientCode ?? `PT-${p.userId ?? p.id ?? ''}`,
      patientCode: p.patientCode ?? `PT-${p.userId ?? p.id ?? ''}`,
      fullName: p.fullName ?? '',
      age,
      gender,
      phone: p.mobile ?? p.phone ?? '',
      email: p.email ?? '',
      bloodGroup: p.bloodGroup ?? '',
      dob: p.dob ?? '',
      address: p.address ?? '',
      emergencyContact: p.emergencyContact ?? '',
      primaryCondition: p.primaryCondition ?? 'General Assessment',
      status: (p.status === 'Completed' || p.status === 'Pending') ? p.status : 'Active',
      visitedCategory: p.visitedCategory ?? 'regular',
      clinicalGroup: p.clinicalGroup ?? 'General',
      notes: p.notes ?? '',
      medicalHistory: Array.isArray(p.medicalHistory) ? p.medicalHistory : [],
      groups: Array.isArray(p.groups) ? p.groups : [],
      memberships: p.memberships ?? '',
      counts: {
        appointments: p.counts?.appointments ?? p.appointmentCount ?? 0,
        clinicalNotes: p.counts?.clinicalNotes ?? 0,
        treatmentPlans: p.counts?.treatmentPlans ?? 0,
        completedProcedures: p.counts?.completedProcedures ?? 0,
        files: p.counts?.files ?? 0,
        prescriptions: p.counts?.prescriptions ?? 0,
        invoices: p.counts?.invoices ?? 0,
        payments: p.counts?.payments ?? 0
      }
    };
  }

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
  async Getpatient(e?: any): Promise<void> {
    if (typeof e === 'string' && e.trim().length === 10) {
      const mobile = e.trim();
      try {
        const request = {
          search: mobile
        };

        const response = await this.apiService.Post<any>(
          ApiEndPoints.GetMyPatients,
          request
        );

        if (response?.isSuccess && response.data?.items?.length > 0) {
          const patient = response.data.items[0];
          this.formData = {
            ...this.formData,
            fullName: patient.fullName ?? '',
            mobile: patient.mobile ?? mobile,
            email: patient.email ?? '',
            gender: patient.gender ?? 'Male',
            dob: patient.dob ?? '',
            address: patient.address ?? '',
            city: patient.city ?? '',
            state: patient.state ?? '',
            userId: patient.userId ?? 1,
            roleId: patient.roleId ?? 3,
            phone: patient.phone ?? patient.mobile ?? mobile,
            primaryCondition: patient.primaryCondition ?? 'General Assessment'
          };

          this.showSuccess('Patient details fetched successfully.');
        } else {
          this.showError(response?.message || 'Patient not found.');
        }
      } catch (error) {
        console.error('Get patient error:', error);
        this.showError('Error fetching patient details. Please try again.');
      }
      return;
    }

    // Default: reload patients list
    await this.loadPatients(1);
  }

}
