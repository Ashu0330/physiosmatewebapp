import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

export interface FactItem {
  icon: string;
  text: string;
}

export interface CauseItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

export interface AudienceItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

export interface ClinicalInfoItem {
  title: string;
  desc: string;
  badge?: string;
}

export interface ConditionDetailData {
  id: string;
  title: string;
  tagline: string;
  overviewDescription: string;
  overviewQuote: string;
  quickFacts: FactItem[];
  causes: CauseItem[];
  whoCanGet: AudienceItem[];
  symptoms: ClinicalInfoItem[];
  treatments: ClinicalInfoItem[];
  prevention: ClinicalInfoItem[];
}

export interface DetailDoctor {
  id: string;
  name: string;
  specialist: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  location: string;
  photo: string;
  tags: string[];
}

@Component({
  selector: 'app-condition-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './condition-detail.html',
  styleUrl: './condition-detail.css',
})
export class ConditionDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Active condition id
  readonly conditionId = signal<string>('back-pain');

  // Active navigation tab
  readonly activeTab = signal<'overview' | 'causes' | 'symptoms' | 'treatment' | 'prevention' | 'doctors'>('overview');

  // Search & City context
  readonly selectedCity = signal<string>('Mumbai');
  readonly isCityOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  readonly popularCities = [
    'Mumbai',
    'Delhi NCR',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Pune',
    'Kolkata',
    'Ahmedabad',
    'Gumanpura, Kota',
  ];

  // Verified Physiotherapist Doctors list
  readonly recommendedDoctors = signal<DetailDoctor[]>([
    {
      id: 'doc-1',
      name: 'Dr. Rohan Mehta',
      specialist: 'Sports Physiotherapist',
      rating: 4.8,
      reviewCount: 120,
      experienceYears: 8,
      location: 'Gumanpura, Kota',
      photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      tags: ['Back Pain', 'Posture Correction'],
    },
    {
      id: 'doc-2',
      name: 'Dr. Priya Sharma',
      specialist: 'Orthopedic Physiotherapist',
      rating: 4.9,
      reviewCount: 95,
      experienceYears: 6,
      location: 'Vigyan Nagar, Kota',
      photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      tags: ['Back Pain', 'Core Strength'],
    },
    {
      id: 'doc-3',
      name: 'Dr. Amit Verma',
      specialist: 'Neuro Physiotherapist',
      rating: 4.7,
      reviewCount: 110,
      experienceYears: 7,
      location: 'Talwandi, Kota',
      photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
      tags: ['Chronic Pain', 'Spine Rehab'],
    },
    {
      id: 'doc-4',
      name: 'Dr. Sneha Kapoor',
      specialist: "Women's Health Physiotherapist",
      rating: 4.9,
      reviewCount: 140,
      experienceYears: 8,
      location: 'Gumanpura, Kota',
      photo: 'assets/images/physio_book_consultation.jpg',
      tags: ['Back Pain', "Women's Health"],
    },
  ]);

  // Clinical condition database
  private readonly conditionsData: Record<string, ConditionDetailData> = {
    'back-pain': {
      id: 'back-pain',
      title: 'Back Pain',
      tagline: 'Understand. Treat. Move Better.',
      overviewDescription:
        'Back pain refers to discomfort in the muscles, bones, nerves or other structures of the spine. It can range from a dull, constant ache to a sharp, sudden pain. Back pain can affect your daily activities, posture and overall quality of life.',
      overviewQuote:
        'With the right care and guidance, most back pain conditions can be effectively managed and improved through physiotherapy.',
      quickFacts: [
        {
          icon: 'stat',
          text: 'Affects 8 out of 10 people at some point in their life',
        },
        {
          icon: 'clock',
          text: 'Can be acute (short-term) or chronic (long-term)',
        },
        {
          icon: 'lightning',
          text: 'Often improves with physiotherapy',
        },
        {
          icon: 'target',
          text: 'Early intervention prevents recurrence',
        },
      ],
      causes: [
        {
          id: 'posture',
          title: 'Poor Posture',
          desc: 'Prolonged sitting or incorrect posture',
          icon: 'chair',
        },
        {
          id: 'strain',
          title: 'Muscle Strain',
          desc: 'Overuse or sudden movements',
          icon: 'strain',
        },
        {
          id: 'injury',
          title: 'Injury',
          desc: 'Sports, falls or accidents',
          icon: 'injury',
        },
        {
          id: 'ageing',
          title: 'Ageing',
          desc: 'Wear and tear of spinal structures',
          icon: 'ageing',
        },
        {
          id: 'lifestyle',
          title: 'Lifestyle Factors',
          desc: 'Lack of exercise, obesity, stress',
          icon: 'lifestyle',
        },
        {
          id: 'medical',
          title: 'Medical Conditions',
          desc: 'Disc problems, arthritis, osteoporosis',
          icon: 'medical',
        },
      ],
      whoCanGet: [
        {
          id: 'office',
          title: 'Office Workers',
          desc: 'Sitting for long hours',
          icon: 'laptop',
        },
        {
          id: 'athletes',
          title: 'Athletes',
          desc: 'High physical activity',
          icon: 'running',
        },
        {
          id: 'seniors',
          title: 'Older Adults',
          desc: 'Age-related changes',
          icon: 'elderly',
        },
        {
          id: 'post-op',
          title: 'Post-Surgery Patients',
          desc: 'During recovery',
          icon: 'recovery',
        },
        {
          id: 'everyone',
          title: 'Everyone',
          desc: 'At any age',
          icon: 'everyone',
        },
      ],
      symptoms: [
        {
          title: 'Persistent Dull Ache',
          desc: 'Continuous localized discomfort in the lower, middle, or upper back that worsens with sitting or prolonged standing.',
          badge: 'Common',
        },
        {
          title: 'Sharp, Shooting Pain',
          desc: 'Sudden spasms or nerve-related shooting pain extending into the buttocks, thighs, or legs (sciatica).',
          badge: 'Nerve-related',
        },
        {
          title: 'Stiffness & Restricted Range of Motion',
          desc: 'Difficulty bending forward, twisting the torso, or standing fully straight, especially in the morning.',
          badge: 'Mobility',
        },
        {
          title: 'Muscle Spasms & Tightness',
          desc: 'Severe involuntary muscle contractures around the lumbar spine triggering intense localized pain.',
          badge: 'Muscular',
        },
      ],
      treatments: [
        {
          title: 'Targeted Manual Therapy & Mobilization',
          desc: 'Hands-on spinal joint mobilization and deep tissue release to relieve muscle guarding and restore spinal segment alignment.',
          badge: 'Hands-on',
        },
        {
          title: 'Core & Lumbar Spine Stabilization',
          desc: 'Graded evidence-based strengthening focusing on deep stabilizers (transversus abdominis, multifidus, and gluteal complexes).',
          badge: 'Active Rehab',
        },
        {
          title: 'Posture & Ergonomic Re-education',
          desc: 'Biomechanics adjustment for work desks, sitting posture, and dynamic lifting habits to prevent flare-ups.',
          badge: 'Prevention',
        },
        {
          title: 'Pain Modalities & Electrotherapy',
          desc: 'Adjunct therapeutic ultrasound, TENS neuromodulation, and thermotherapy for acute spasm relief.',
          badge: 'Symptom Relief',
        },
      ],
      prevention: [
        {
          title: 'Maintain Ergonomic Workspace',
          desc: 'Keep screen at eye level, lumbar support firmly placed, and feet flat on the ground.',
        },
        {
          title: 'Practice Safe Lifting Mechanics',
          desc: 'Bend your knees and keep heavy loads close to your chest rather than rounding the lower spine.',
        },
        {
          title: 'Active Micro-Breaks Every 45 Minutes',
          desc: 'Stand up, stretch thoracic spine, and walk for 2 minutes to restore blood circulation.',
        },
        {
          title: 'Daily Core & Hamstring Flexibility',
          desc: 'Gentle daily stretching keeps pelvic alignment neutral and removes strain from spinal discs.',
        },
      ],
    },
    'neck-pain': {
      id: 'neck-pain',
      title: 'Neck Pain',
      tagline: 'Relieve Stiffness. Restore Mobility. Live Pain-Free.',
      overviewDescription:
        'Neck pain involves stiffness, soreness, or sharp discomfort in the cervical spine. Often triggered by prolonged screen time, poor sleep posture, or sudden strain, it can lead to tension headaches and radiating shoulder pain.',
      overviewQuote:
        'Targeted cervical physiotherapy restores joint mobility, relieves muscle knots, and retrains postural alignment.',
      quickFacts: [
        {
          icon: 'stat',
          text: 'Affects nearly 50% of desk workers every year',
        },
        {
          icon: 'clock',
          text: 'Often exacerbated by "tech-neck" posture',
        },
        {
          icon: 'lightning',
          text: 'Highly responsive to specialized physiotherapy',
        },
        {
          icon: 'target',
          text: 'Posture correction prevents chronic tension',
        },
      ],
      causes: [
        {
          id: 'screen-time',
          title: 'Tech Neck',
          desc: 'Forward head posture while using devices',
          icon: 'laptop',
        },
        {
          id: 'sleep-position',
          title: 'Awkward Sleeping',
          desc: 'Non-supportive pillow or awkward angles',
          icon: 'chair',
        },
        {
          id: 'muscle-stress',
          title: 'Stress & Tension',
          desc: 'Trapezius tension from emotional stress',
          icon: 'strain',
        },
        {
          id: 'whiplash',
          title: 'Whiplash & Trauma',
          desc: 'Sudden deceleration or sports impact',
          icon: 'injury',
        },
        {
          id: 'cervical-spondy',
          title: 'Cervical Spondylosis',
          desc: 'Age-related disc degeneration',
          icon: 'ageing',
        },
        {
          id: 'pinched-nerve',
          title: 'Radiculopathy',
          desc: 'Pinched nerve causing arm numbness',
          icon: 'medical',
        },
      ],
      whoCanGet: [
        {
          id: 'desk-workers',
          title: 'Desk Workers',
          desc: 'Forward head tilt over screens',
          icon: 'laptop',
        },
        {
          id: 'drivers',
          title: 'Drivers',
          desc: 'Vibration and static neck angles',
          icon: 'chair',
        },
        {
          id: 'students',
          title: 'Students',
          desc: 'Heavy backpacks & studying posture',
          icon: 'running',
        },
        {
          id: 'seniors',
          title: 'Older Adults',
          desc: 'Cervical arthritic changes',
          icon: 'elderly',
        },
        {
          id: 'everyone',
          title: 'Everyone',
          desc: 'Common across all ages',
          icon: 'everyone',
        },
      ],
      symptoms: [
        {
          title: 'Stiffness & Restricted Rotation',
          desc: 'Difficulty turning head sideways while driving or working.',
        },
        {
          title: 'Tension Headaches',
          desc: 'Cervicogenic headaches radiating from the base of the skull.',
        },
        {
          title: 'Radiating Shoulder Discomfort',
          desc: 'Pain or tingling traveling down the shoulder and arm.',
        },
        {
          title: 'Trapezius Knots',
          desc: 'Tender myofascial trigger points in upper back muscles.',
        },
      ],
      treatments: [
        {
          title: 'Cervical Joint Mobilization',
          desc: 'Gentle oscillation of cervical vertebrae to improve mobility.',
        },
        {
          title: 'Deep Neck Flexor Strengthening',
          desc: 'Retraining chin-tuck stabilizers to support head weight.',
        },
        {
          title: 'Myofascial Release Therapy',
          desc: 'Relieving tight suboccipital and levator scapulae muscles.',
        },
        {
          title: 'Ergonomic Desk Optimization',
          desc: 'Setting monitor height and chair ergonomics.',
        },
      ],
      prevention: [
        {
          title: 'Eye-Level Screen Alignment',
          desc: 'Avoid bending neck downwards to view smartphones or laptops.',
        },
        {
          title: 'Cervical Pillow Support',
          desc: 'Use contoured orthopedic pillows that support cervical lordosis.',
        },
        {
          title: 'Hourly Neck Stretches',
          desc: 'Side-to-side gentle stretches and shoulder rolls during breaks.',
        },
        {
          title: 'Hydration & Stress Management',
          desc: 'Keep spinal discs hydrated and practice breathing exercises.',
        },
      ],
    },
    'knee-pain': {
      id: 'knee-pain',
      title: 'Knee Pain',
      tagline: 'Recover Strength. Walk Confidently. Stay Active.',
      overviewDescription:
        'Knee pain affects walking, climbing stairs, and athletic performance. Causes range from ligament sprains and meniscus tears to osteoarthritis and patellofemoral syndrome.',
      overviewQuote:
        'Strengthening the quadriceps and stabilizing hip rotators takes excessive pressure off the knee joint.',
      quickFacts: [
        {
          icon: 'stat',
          text: 'Most common joint complaint among active adults',
        },
        {
          icon: 'clock',
          text: 'Can arise from sudden twists or gradual wear',
        },
        {
          icon: 'lightning',
          text: 'Physiotherapy often avoids invasive knee surgeries',
        },
        {
          icon: 'target',
          text: 'Targeted quad exercises reduce cartilage wear',
        },
      ],
      causes: [
        {
          id: 'ligament',
          title: 'Ligament Strain',
          desc: 'ACL, PCL or collateral ligament injuries',
          icon: 'injury',
        },
        {
          id: 'osteoarthritis',
          title: 'Osteoarthritis',
          desc: 'Age-related cartilage wear and tear',
          icon: 'ageing',
        },
        {
          id: 'patellar',
          title: "Runner's Knee",
          desc: 'Patellofemoral pain and tracking issues',
          icon: 'running',
        },
        {
          id: 'meniscus',
          title: 'Meniscus Tears',
          desc: 'Cartilage shock-absorber damage',
          icon: 'strain',
        },
        {
          id: 'weight',
          title: 'Excess Load',
          desc: 'High compressive force on joints',
          icon: 'lifestyle',
        },
        {
          id: 'muscle-weakness',
          title: 'Muscle Imbalance',
          desc: 'Weak quads, hamstrings, and glutes',
          icon: 'medical',
        },
      ],
      whoCanGet: [
        {
          id: 'athletes',
          title: 'Athletes & Runners',
          desc: 'High impact and rotational forces',
          icon: 'running',
        },
        {
          id: 'seniors',
          title: 'Older Adults',
          desc: 'Degenerative joint changes',
          icon: 'elderly',
        },
        {
          id: 'stairs',
          title: 'Daily Commuters',
          desc: 'Heavy stair climbing and walking',
          icon: 'chair',
        },
        {
          id: 'post-surgery',
          title: 'Post-Op Knee Patients',
          desc: 'ACL or knee replacement recovery',
          icon: 'recovery',
        },
        {
          id: 'everyone',
          title: 'Everyone',
          desc: 'Joint strain can occur at any age',
          icon: 'everyone',
        },
      ],
      symptoms: [
        {
          title: 'Pain on Stairs or Squatting',
          desc: 'Sharp or grinding pain behind the kneecap when descending stairs.',
        },
        {
          title: 'Swelling & Inflammation',
          desc: 'Visible puffiness and warmth around the joint capsule.',
        },
        {
          title: 'Clicking or Popping Sensations',
          desc: 'Audible crepitus during bending or straightening.',
        },
        {
          title: 'Instability or Giving Way',
          desc: 'Feeling that the knee may buckle under body weight.',
        },
      ],
      treatments: [
        {
          title: 'VMO & Quadriceps Strengthening',
          desc: 'Targeted exercises to stabilize patella tracking.',
        },
        {
          title: 'Hip & Glute Stabilization',
          desc: 'Preventing knock-knee valgus collapse during movement.',
        },
        {
          title: 'Patellar Taping & Joint Mobilization',
          desc: 'Kinesio taping for pain reduction and joint unloading.',
        },
        {
          title: 'Gait Training & Proprioception',
          desc: 'Balance board and closed kinetic chain drills.',
        },
      ],
      prevention: [
        {
          title: 'Wear Cushioned, Supportive Footwear',
          desc: 'Proper arch support dampens ground reaction shock.',
        },
        {
          title: 'Maintain Healthy Body Composition',
          desc: 'Every kilogram lost removes 4 kilograms of force from knees.',
        },
        {
          title: 'Warm Up Before High-Impact Activities',
          desc: 'Dynamic activation prepares joint fluid lubrication.',
        },
        {
          title: 'Low-Impact Cross Training',
          desc: 'Cycling and swimming build strength without joint impact.',
        },
      ],
    },
  };

  // Current active condition data
  readonly currentCondition = computed<ConditionDetailData>(() => {
    const id = this.conditionId();
    return (
      this.conditionsData[id] ||
      this.conditionsData['back-pain'] || {
        id: 'back-pain',
        title: 'Back Pain',
        tagline: 'Understand. Treat. Move Better.',
        overviewDescription: 'Comprehensive guidance and expert physiotherapy care.',
        overviewQuote: 'With proper physiotherapy, your mobility and comfort will recover quickly.',
        quickFacts: [],
        causes: [],
        whoCanGet: [],
        symptoms: [],
        treatments: [],
        prevention: [],
      }
    );
  });

  ngOnInit(): void {
    // Read route param if available
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id && this.conditionsData[id]) {
        this.conditionId.set(id);
      } else if (id) {
        // Find by partial title or default to back-pain
        const cleanId = id.toLowerCase().trim();
        if (this.conditionsData[cleanId]) {
          this.conditionId.set(cleanId);
        } else {
          this.conditionId.set('back-pain');
        }
      } else {
        this.conditionId.set('back-pain');
      }
    });

    // Also check query param if any
    this.route.queryParamMap.subscribe((q) => {
      const cond = q.get('condition');
      if (cond) {
        const slug = cond.toLowerCase().replace(/\s+/g, '-');
        if (this.conditionsData[slug]) {
          this.conditionId.set(slug);
        }
      }
    });
  }

  // Navigation Tabs Action
  setActiveTab(tab: 'overview' | 'causes' | 'symptoms' | 'treatment' | 'prevention' | 'doctors'): void {
    this.activeTab.set(tab);
    const elementId = `sec-${tab}`;
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // City dropdown
  toggleCity(): void {
    this.isCityOpen.update((v) => !v);
  }

  selectCity(city: string): void {
    this.selectedCity.set(city);
    this.isCityOpen.set(false);
  }

  // Search input
  onSearchInput(val: string): void {
    this.searchQuery.set(val);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/physio_easy_consult.jpg';
    }
  }

  // Doctor Action Navigation
  viewDoctorProfile(doc: DetailDoctor): void {
    this.router.navigate(['/doctor-detail', doc.id]);
  }

  bookAppointment(doc: DetailDoctor): void {
    this.router.navigate(['/booking/consultancy', doc.id]);
  }

  viewAllDoctors(): void {
    this.router.navigate(['/find-doctors'], {
      queryParams: {
        condition: this.currentCondition().title,
        city: this.selectedCity(),
      },
    });
  }

  consultNow(): void {
    this.router.navigate(['/find-doctors'], {
      queryParams: {
        condition: this.currentCondition().title,
        city: this.selectedCity(),
      },
    });
  }
}
