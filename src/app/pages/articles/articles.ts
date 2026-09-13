import { Component, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

export interface ArticleAuthor {
  name: string;
  role?: string;
  avatar: string;
}

export interface Article {
  id: string;
  tag: string;
  category: string;
  title: string;
  description: string;
  author: ArticleAuthor;
  date: string;
  readTime: string;
  image: string;
  content?: string[];
  featured?: boolean;
}

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './articles.html',
  styleUrl: './articles.css',
})
export class Articles {
  // Reactive signals for filtering and state
  readonly searchQuery = signal<string>('');
  readonly activeCategory = signal<string>('All');
  readonly sortBy = signal<string>('Latest');
  readonly selectedArticle = signal<Article | null>(null);
  readonly isModalOpen = signal<boolean>(false);

  // Available categories matching the UI design
  readonly categories: string[] = [
    'All',
    'Physiotherapy',
    'Orthopedic',
    'Neurological',
    'Sports',
    'Pediatric',
    "Women's Health",
    'Wellness',
    'Post-Surgery',
  ];

  // Featured Article Mock Data
  readonly featuredArticle: Article = {
    id: 'featured-knee-pain',
    tag: 'ORTHOPEDIC',
    category: 'Orthopedic',
    title: 'Understanding Knee Pain: Common Causes, Treatment and Recovery',
    description:
      'Learn about the common causes of knee pain, effective treatment options and expert tips for faster recovery.',
    author: {
      name: 'Dr. Neha Kapoor',
      role: 'Physiotherapist',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
    },
    date: 'May 12, 2024',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    content: [
      'Knee pain is one of the most common musculoskeletal complaints affecting individuals of all age groups, from young athletes to older adults.',
      'Common etiologies include patellofemoral pain syndrome, ligamentous sprains (ACL/MCL), meniscus tears, and osteoarthritis.',
      'Effective conservative management centers around targeted quadriceps and hamstring strengthening, hip abductor stabilization, gentle mobility work, and load management.',
      'Early clinical evaluation by a licensed physiotherapist ensures accurate functional diagnosis and tailored rehabilitation progressions.'
    ]
  };

  // Latest Articles Mock Data
  readonly articlesList: Article[] = [
    {
      id: 'back-pain-exercises',
      tag: 'PHYSIOTHERAPY',
      category: 'Physiotherapy',
      title: '5 Effective Exercises for Lower Back Pain Relief',
      description:
        'Targeted mobility and core activation drills designed to ease lumbar stiffness and promote functional spine alignment.',
      author: {
        name: 'Dr. Arjun Mehta',
        role: 'Senior Physical Therapist',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80',
      },
      date: 'Apr 28, 2024',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
      content: [
        'Persistent lower back pain often stems from prolonged sedentary postures, weak lumbar stabilizers, or pelvic tilt imbalances.',
        'Gentle exercises like pelvic tilts, bird-dog holds, cat-camel stretches, and bridges restore segmental spinal motion without excessive shear stress.'
      ]
    },
    {
      id: 'prevent-sports-injuries',
      tag: 'SPORTS',
      category: 'Sports',
      title: 'How to Prevent Sports Injuries: Tips from Physiotherapists',
      description:
        'Proven warm-up protocols, progressive training loads, and biomechanical adjustments to keep athletes performing safely.',
      author: {
        name: 'Dr. Kavya Sharma',
        role: 'Sports Rehab Specialist',
        avatar: 'https://images.unsplash.com/photo-1594824813628-98e3b08e5c1a?auto=format&fit=crop&w=200&q=80',
      },
      date: 'Apr 20, 2024',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80',
      content: [
        'Overuse injuries account for the majority of non-contact sports complaints. Implementing dynamic warm-ups and adequate recovery intervals drastically reduces strain.',
        'Focus on multi-planar movements, ankle proprioception, and progressive plyometrics to build resilient tendons and ligaments.'
      ]
    },
    {
      id: 'cervical-spondylosis',
      tag: 'NEUROLOGICAL',
      category: 'Neurological',
      title: 'Understanding Cervical Spondylosis: Symptoms and Management',
      description:
        'Identify cervical spine wear early, manage nerve impingement, and apply daily postural corrections for neck relief.',
      author: {
        name: 'Dr. Rohit Verma',
        role: 'Neuro Physiotherapist',
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80',
      },
      date: 'Apr 18, 2024',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      content: [
        'Age-related wear and tear in the cervical spine can lead to neck stiffness, radiating arm tingling, and headaches.',
        'Physiotherapy approaches such as chin tucks, scapular retractions, and isometric neck exercises strengthen deep neck flexors to unload disc structures.'
      ]
    },
    {
      id: 'child-development-physio',
      tag: 'PEDIATRIC',
      category: 'Pediatric',
      title: 'Role of Physiotherapy in Child Development',
      description:
        'Supporting milestone achievements, balance, and gross motor coordination through playful therapeutic interventions.',
      author: {
        name: 'Dr. Priya Nair',
        role: 'Pediatric Physiotherapist',
        avatar: 'https://images.unsplash.com/photo-1594824813612-42173f47e33e?auto=format&fit=crop&w=200&q=80',
      },
      date: 'Apr 12, 2024',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
      content: [
        'Pediatric physical therapy addresses developmental delays, low muscle tone, toe-walking, and coordination difficulties in infants and children.',
        'Therapeutic play, balance boards, and sensory integration foster motor milestone mastery in an engaging, supportive setting.'
      ]
    },
    {
      id: 'eating-right-immunity',
      tag: 'WELLNESS',
      category: 'Wellness',
      title: 'Eating Right to Build Immunity Against Infections',
      description:
        'Nutritional strategies and whole food powerhouses that accelerate cellular tissue repair and reduce chronic inflammation.',
      author: {
        name: 'Dr. Sameer Khan',
        role: 'Clinical Wellness Consultant',
        avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=200&q=80',
      },
      date: 'Apr 10, 2024',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      content: [
        'Optimal immune defense relies heavily on gut microbiome diversity and antioxidant-rich micronutrients like Vitamin C, Zinc, and Polyphenols.',
        'Incorporating dark leafy greens, berries, legumes, and healthy fats provides vital cofactors for collagen synthesis and tissue healing.'
      ]
    },
    {
      id: 'knee-replacement-guide',
      tag: 'POST-SURGERY',
      category: 'Post-Surgery',
      title: 'Physiotherapy After Knee Replacement: A Step-by-Step Guide',
      description:
        'A comprehensive timeline of post-arthroplasty rehabilitation to restore range of motion, strength, and confident walking.',
      author: {
        name: 'Dr. Ananya Singh',
        role: 'Orthopedic Rehabilitation Specialist',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      },
      date: 'Apr 05, 2024',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
      content: [
        'Successful knee replacement recovery hinges on disciplined early-stage physical therapy starting within hours post-surgery.',
        'Carefully graded passive and active range-of-motion drills, ankle pumps, and quadriceps sets prevent deep vein thrombosis and scar adhesions.'
      ]
    },
    {
      id: 'womens-pelvic-health',
      tag: "WOMEN'S HEALTH",
      category: "Women's Health",
      title: 'Pelvic Floor Rehabilitation: Essential Insights for Women',
      description:
        'Evidence-based guidance on core stability, postpartum muscle restoration, and lasting symptom relief.',
      author: {
        name: 'Dr. Pooja Saxena',
        role: "Women's Health Specialist",
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
      },
      date: 'Mar 28, 2024',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
      content: [
        'Pelvic health physiotherapy provides non-invasive solutions for core weakness, diastasis recti, and pelvic floor tension after childbirth.',
        'Targeted biofeedback and breathing synchronization restore abdominal pressure regulation and functional confidence.'
      ]
    },
    {
      id: 'ergonomics-desk-posture',
      tag: 'PHYSIOTHERAPY',
      category: 'Physiotherapy',
      title: 'Ergonomics for Remote Work: Prevent Back and Neck Fatigue',
      description:
        'Practical desk setup adjustments and micro-break routines to prevent chronic musculoskeletal fatigue.',
      author: {
        name: 'Dr. Arjun Mehta',
        role: 'Senior Physical Therapist',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80',
      },
      date: 'Mar 20, 2024',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      content: [
        'Static sitting for prolonged periods is a major trigger of upper-crossed syndrome and lumbar strain.',
        'Aligning monitor height with eye level, supporting the lumbar lordosis, and standing up every 45 minutes maintains circulation.'
      ]
    }
  ];

  // Filtered and Sorted Articles computed signal
  readonly filteredArticles = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const category = this.activeCategory();
    const sort = this.sortBy();

    let list = this.articlesList.filter((article) => {
      // Category filter
      const matchesCategory =
        category === 'All' ||
        article.category.toLowerCase() === category.toLowerCase() ||
        article.tag.toLowerCase() === category.toLowerCase();

      if (!matchesCategory) return false;

      // Search query filter
      if (!query) return true;

      const titleMatch = article.title.toLowerCase().includes(query);
      const descMatch = article.description.toLowerCase().includes(query);
      const tagMatch = article.tag.toLowerCase().includes(query);
      const authorMatch = article.author.name.toLowerCase().includes(query);

      return titleMatch || descMatch || tagMatch || authorMatch;
    });

    // Sorting
    if (sort === 'Latest') {
      // Keep defined order or date-based
      return list;
    } else if (sort === 'Read Time') {
      return [...list].sort((a, b) => {
        const timeA = parseInt(a.readTime, 10) || 0;
        const timeB = parseInt(b.readTime, 10) || 0;
        return timeA - timeB;
      });
    } else if (sort === 'Oldest') {
      return [...list].reverse();
    }

    return list;
  });

  // Check if featured article matches search/category
  readonly isFeaturedVisible = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const category = this.activeCategory();

    const matchesCategory =
      category === 'All' ||
      this.featuredArticle.category.toLowerCase() === category.toLowerCase() ||
      this.featuredArticle.tag.toLowerCase() === category.toLowerCase();

    if (!matchesCategory) return false;

    if (!query) return true;

    return (
      this.featuredArticle.title.toLowerCase().includes(query) ||
      this.featuredArticle.description.toLowerCase().includes(query) ||
      this.featuredArticle.tag.toLowerCase().includes(query) ||
      this.featuredArticle.author.name.toLowerCase().includes(query)
    );
  });

  // Interaction handlers
  setCategory(category: string): void {
    this.activeCategory.set(category);
  }

  onSearchSubmit(): void {
    // Already reactive through searchQuery signal binding
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (select) {
      this.sortBy.set(select.value);
    }
  }

  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  openArticle(article: Article): void {
    this.router.navigate(['/article-detail', article.id]);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedArticle.set(null);
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }

  // Fallback for image loading error
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/physio_book_consultation.jpg';
    }
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/physio_find_doctor.jpg';
    }
  }
}
