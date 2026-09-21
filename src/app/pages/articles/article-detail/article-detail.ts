import { Component, signal, OnInit, inject, HostListener, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

export interface TableOfContentItem {
  id: string;
  label: string;
}

export interface RelatedArticle {
  id: string;
  title: string;
  date: string;
  image: string;
  category?: string;
}

export interface DetailedArticle {
  id: string;
  tag: string;
  categoryBreadcrumb: string;
  title: string;
  subtitle: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  date: string;
  readTime: string;
  heroImage: string;
  expertTip: {
    heading: string;
    quote: string;
    author: string;
  };
  introduction: string;
  causesIntro: string;
  causesList: string[];
  symptomsIntro: string;
  symptomsList: string[];
  treatmentOptionsIntro: string;
  treatmentOptionsList: string[];
  exercisesIntro: string;
  exercisesList: string[];
  whenToSeeDoctorIntro: string;
  whenToSeeDoctorList: string[];
  expertTipsIntro: string;
  expertTipsList: string[];
  conclusion: string;
  relatedArticles: RelatedArticle[];
}

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.css',
})
export class ArticleDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  readonly isSaved = signal<boolean>(false);
  readonly shareNotification = signal<string | null>(null);
  readonly activeSection = signal<string>('introduction');

  // Table of contents matching the design
  readonly tableOfContents: TableOfContentItem[] = [
    { id: 'introduction', label: 'Introduction' },
    { id: 'common-causes', label: 'Common Causes of Knee Pain' },
    { id: 'symptoms', label: 'Symptoms to Watch For' },
    { id: 'treatment-options', label: 'Treatment Options' },
    { id: 'exercises', label: 'Exercises for Recovery' },
    { id: 'when-to-see', label: 'When to See a Physiotherapist' },
    { id: 'expert-tips', label: 'Expert Tips' },
    { id: 'conclusion', label: 'Conclusion' },
  ];

  // Default article: Understanding Knee Pain (matching the user's screenshot)
  readonly defaultArticle: DetailedArticle = {
    id: 'understanding-knee-pain',
    tag: 'ORTHOPEDIC PHYSIOTHERAPY',
    categoryBreadcrumb: 'Orthopedic Physiotherapy',
    title: 'Understanding Knee Pain: Common Causes, Treatment and Recovery',
    subtitle:
      'Learn about the common causes of knee pain, effective treatment options and expert tips to help you recover and get back to your active life.',
    author: {
      name: 'Dr. Neha Kapoor',
      role: 'Physiotherapist',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
    },
    date: 'May 12, 2024',
    readTime: '6 min read',
    heroImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    expertTip: {
      heading: 'Expert Tip',
      quote:
        '“Early assessment and guided physiotherapy can prevent minor knee issues from becoming major problems.”',
      author: 'Dr. Neha Kapoor, Physiotherapist',
    },
    introduction:
      'Knee pain is a common problem that can affect people of all ages, from athletes to older adults. It can make everyday activities like walking, climbing stairs or even sitting uncomfortable. The good news is that in most cases, knee pain can be managed effectively with the right treatment, exercises and lifestyle changes.',
    causesIntro: 'Knee pain can occur due to various reasons, including:',
    causesList: [
      'Osteoarthritis (wear and tear of the joint)',
      'Ligament injuries (ACL, MCL tears)',
      'Meniscus injuries',
      'Overuse from sports or repetitive activities',
      'Poor posture or muscle imbalances',
      'Previous injuries or surgery',
    ],
    symptomsIntro: 'You should consult a physiotherapist if you experience:',
    symptomsList: [
      'Persistent pain or swelling',
      'Stiffness, especially in the morning',
      'Difficulty in walking, climbing stairs or squatting',
      'A feeling of instability or the knee “giving way”',
      'Reduced range of motion',
    ],
    treatmentOptionsIntro:
      'Conservative physiotherapy care is the first-line treatment for non-emergency knee disorders. A tailored approach typically incorporates:',
    treatmentOptionsList: [
      'Targeted therapeutic exercise to build quadriceps and hamstring dynamic stability',
      'Patellar taping and joint mobilization for alignment correction',
      'Thermotherapy and cryotherapy to manage local inflammatory flare-ups',
      'Ergonomic and gait re-training to distribute weight evenly across joints',
      'Activity modification protocols preventing reinjury during recovery stages',
    ],
    exercisesIntro:
      'Gentle rehabilitative movements help maintain synovial joint nutrition and avoid atrophy during pain episodes:',
    exercisesList: [
      'Straight Leg Raises: Strengthens the rectus femoris without bending the sensitive knee joint.',
      'Hamstring Curls: Promotes balanced tension across posterior knee compartments.',
      'Wall Squats (mini): Recruits hip gluteals and quadriceps under controlled bodyweight load.',
      'Calf & Quad Stretching: Releases myofascial tension pulling upon the patellar tendon.',
    ],
    whenToSeeDoctorIntro:
      'Seek prompt medical assessment from a certified physiotherapist or orthopedic specialist if you notice any of the following red-flag indications:',
    whenToSeeDoctorList: [
      'Inability to bear weight or step onto the affected leg without sharp buckling',
      'Noticeable joint deformity or sudden prominent effusion / swelling',
      'Audible popping sensation followed by instant weakness during physical activity',
      'Fever, local redness, or warmth accompanied by severe throbbing at rest',
    ],
    expertTipsIntro:
      'Long-term knee longevity is supported by daily protective practices:',
    expertTipsList: [
      'Maintain an optimal body weight to decrease mechanical stress across the joint line',
      'Choose supportive, shock-absorbing footwear suited for your daily gait and arch type',
      'Prioritize low-impact aerobic exercises such as stationary cycling and swimming',
      'Always warm up major leg muscle groups prior to engaging in sports or strength training',
    ],
    conclusion:
      'Knee pain does not have to restrict your mobility or force you into a sedentary lifestyle. With structured, personalized physical therapy, progressive muscle loading, and healthy daily habits, the vast majority of knee conditions resolve favorably. Taking action early empowers you to resume your favorite activities safely and without discomfort.',
    relatedArticles: [
      {
        id: 'back-pain-exercises',
        title: '5 Effective Exercises for Lower Back Pain Relief',
        date: 'Apr 28, 2024',
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=300&q=80',
        category: 'Physiotherapy',
      },
      {
        id: 'prevent-sports-injuries',
        title: 'How to Prevent Sports Injuries',
        date: 'Apr 20, 2024',
        image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=300&q=80',
        category: 'Sports',
      },
      {
        id: 'hip-pain-athletes',
        title: 'Understanding Hip Pain in Athletes',
        date: 'Apr 15, 2024',
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=300&q=80',
        category: 'Sports',
      },
      {
        id: 'knee-replacement-guide',
        title: 'Physiotherapy After Knee Replacement',
        date: 'Apr 05, 2024',
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=300&q=80',
        category: 'Post-Surgery',
      },
    ],
  };

  article = signal<DetailedArticle>(this.defaultArticle);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      // Scroll to top on navigation in browser
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  scrollToSection(sectionId: string): void {
    this.activeSection.set(sectionId);
    if (isPlatformBrowser(this.platformId)) {
      const element = document.getElementById(sectionId);
      if (element) {
        const yOffset = -90; // Adjust for sticky header
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }

  toggleSave(): void {
    this.isSaved.update((val) => !val);
    const msg = this.isSaved() ? 'Article saved to your bookmarks' : 'Article removed from bookmarks';
    this.showToast(msg);
  }

  shareArticle(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (navigator.share) {
      navigator
        .share({
          title: this.article().title,
          text: this.article().subtitle,
          url: window.location.href,
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      this.showToast('Article link copied to clipboard!');
    }
  }

  private showToast(message: string): void {
    this.shareNotification.set(message);
    setTimeout(() => {
      this.shareNotification.set(null);
    }, 3000);
  }

  // Scroll listener to update active Table of Contents item
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const scrollPosition = window.pageYOffset + 140;
    for (const item of this.tableOfContents) {
      const el = document.getElementById(item.id);
      if (el) {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPosition >= top && scrollPosition < top + height) {
          this.activeSection.set(item.id);
          break;
        }
      }
    }
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/physio_explore_conditions.jpg';
    }
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/physio_book_consultation.jpg';
    }
  }
}
