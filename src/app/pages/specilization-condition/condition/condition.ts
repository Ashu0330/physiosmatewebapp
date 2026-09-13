import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

export interface ConditionItem {
  id: string;
  title: string;
  description: string;
  therapistsCount: string;
  therapistsNum: number;
  category: 'Body Area' | 'Focus Area';
  subCategory: string;
  bgColor: string;
  accentColor: string;
  iconType: string;
  popularRank: number;
}

@Component({
  selector: 'app-condition',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './condition.html',
  styleUrl: './condition.css',
})
export class Condition {
  // Search & Sort state
  searchQuery = signal<string>('');
  sortBy = signal<'popular' | 'therapists' | 'name'>('popular');

  // Pagination state
  currentPage = signal<number>(1);
  readonly pageSize = 16;

  // 16 Standard Clinical Physiotherapy Conditions
  readonly allConditions: ConditionItem[] = [
    {
      id: 'back-pain',
      title: 'Back Pain',
      description: 'Get relief from lower, upper or chronic back pain.',
      therapistsCount: '1,200+ Physiotherapists',
      therapistsNum: 1200,
      category: 'Body Area',
      subCategory: 'Back & Spine',
      bgColor: '#F0F6FC',
      accentColor: '#0284C7',
      iconType: 'back-pain',
      popularRank: 1,
    },
    {
      id: 'neck-pain',
      title: 'Neck Pain',
      description: 'Treat stiffness, tension and neck mobility issues.',
      therapistsCount: '950+ Physiotherapists',
      therapistsNum: 950,
      category: 'Body Area',
      subCategory: 'Neck',
      bgColor: '#FFF5F5',
      accentColor: '#E11D48',
      iconType: 'neck-pain',
      popularRank: 2,
    },
    {
      id: 'knee-pain',
      title: 'Knee Pain',
      description: 'Recover from injury, arthritis or post-surgical care.',
      therapistsCount: '1,050+ Physiotherapists',
      therapistsNum: 1050,
      category: 'Body Area',
      subCategory: 'Knee',
      bgColor: '#F4F0FB',
      accentColor: '#7C3AED',
      iconType: 'knee-pain',
      popularRank: 3,
    },
    {
      id: 'shoulder-pain',
      title: 'Shoulder Pain',
      description: 'Find care for frozen shoulder, rotator cuff and more.',
      therapistsCount: '780+ Physiotherapists',
      therapistsNum: 780,
      category: 'Body Area',
      subCategory: 'Shoulder',
      bgColor: '#FFF9EE',
      accentColor: '#D97706',
      iconType: 'shoulder-pain',
      popularRank: 4,
    },
    {
      id: 'sports-injury',
      title: 'Sports Injury',
      description: 'Get back to your best with expert sports rehab.',
      therapistsCount: '640+ Physiotherapists',
      therapistsNum: 640,
      category: 'Focus Area',
      subCategory: 'Sports Rehab',
      bgColor: '#F0FAF6',
      accentColor: '#10A896',
      iconType: 'sports-injury',
      popularRank: 5,
    },
    {
      id: 'post-surgical-rehabilitation',
      title: 'Post-Surgical Rehabilitation',
      description: 'Recover faster with personalized physiotherapy.',
      therapistsCount: '890+ Physiotherapists',
      therapistsNum: 890,
      category: 'Focus Area',
      subCategory: 'Post-Surgical Care',
      bgColor: '#FDF2F4',
      accentColor: '#DB2777',
      iconType: 'post-surgical',
      popularRank: 6,
    },
    {
      id: 'hip-pain',
      title: 'Hip Pain',
      description: 'Improve mobility and reduce hip discomfort.',
      therapistsCount: '620+ Physiotherapists',
      therapistsNum: 620,
      category: 'Body Area',
      subCategory: 'Hip',
      bgColor: '#F0F7FD',
      accentColor: '#2563EB',
      iconType: 'hip-pain',
      popularRank: 7,
    },
    {
      id: 'foot-ankle-pain',
      title: 'Foot & Ankle Pain',
      description: 'Treat sprains, fractures and chronic pain.',
      therapistsCount: '580+ Physiotherapists',
      therapistsNum: 580,
      category: 'Body Area',
      subCategory: 'Foot & Ankle',
      bgColor: '#FFF6F0',
      accentColor: '#EA580C',
      iconType: 'ankle-pain',
      popularRank: 8,
    },
    {
      id: 'hand-wrist-pain',
      title: 'Hand & Wrist Pain',
      description: 'Relief for strain, arthritis and repetitive stress.',
      therapistsCount: '420+ Physiotherapists',
      therapistsNum: 420,
      category: 'Body Area',
      subCategory: 'Hand & Wrist',
      bgColor: '#FFF1F2',
      accentColor: '#E11D48',
      iconType: 'wrist-pain',
      popularRank: 9,
    },
    {
      id: 'elbow-pain',
      title: 'Elbow Pain',
      description: "Manage tennis elbow, golfer's elbow and more.",
      therapistsCount: '410+ Physiotherapists',
      therapistsNum: 410,
      category: 'Body Area',
      subCategory: 'Elbow',
      bgColor: '#FFF7ED',
      accentColor: '#C2410C',
      iconType: 'elbow-pain',
      popularRank: 10,
    },
    {
      id: 'womens-health',
      title: "Women's Health",
      description: 'Specialized care for pre & postnatal needs.',
      therapistsCount: '520+ Physiotherapists',
      therapistsNum: 520,
      category: 'Focus Area',
      subCategory: "Women's Health",
      bgColor: '#FDF2F8',
      accentColor: '#9333EA',
      iconType: 'womens-health',
      popularRank: 11,
    },
    {
      id: 'pediatric-physiotherapy',
      title: 'Pediatric Physiotherapy',
      description: 'Support for developmental and movement concerns.',
      therapistsCount: '460+ Physiotherapists',
      therapistsNum: 460,
      category: 'Focus Area',
      subCategory: 'Pediatric Care',
      bgColor: '#EFF6FF',
      accentColor: '#0284C7',
      iconType: 'pediatric',
      popularRank: 12,
    },
    {
      id: 'geriatric-care',
      title: 'Geriatric Care',
      description: 'Stay active and independent at every age.',
      therapistsCount: '390+ Physiotherapists',
      therapistsNum: 390,
      category: 'Focus Area',
      subCategory: 'Geriatric Care',
      bgColor: '#F0FDFA',
      accentColor: '#0D9488',
      iconType: 'geriatric',
      popularRank: 13,
    },
    {
      id: 'neurological-conditions',
      title: 'Neurological Conditions',
      description: "Care for stroke, Parkinson's disease and more.",
      therapistsCount: '350+ Physiotherapists',
      therapistsNum: 350,
      category: 'Focus Area',
      subCategory: 'Neurological Conditions',
      bgColor: '#FAF5FF',
      accentColor: '#9333EA',
      iconType: 'neurological',
      popularRank: 14,
    },
    {
      id: 'posture-correction',
      title: 'Posture Correction',
      description: 'Improve posture and prevent future pain.',
      therapistsCount: '610+ Physiotherapists',
      therapistsNum: 610,
      category: 'Focus Area',
      subCategory: 'Posture Correction',
      bgColor: '#FEFCE8',
      accentColor: '#CA8A04',
      iconType: 'posture',
      popularRank: 15,
    },
    {
      id: 'general-wellness',
      title: 'General Wellness',
      description: 'Stay healthy, active and pain-free.',
      therapistsCount: '700+ Physiotherapists',
      therapistsNum: 700,
      category: 'Focus Area',
      subCategory: 'General Wellness',
      bgColor: '#F5F3FF',
      accentColor: '#6366F1',
      iconType: 'wellness',
      popularRank: 16,
    },
  ];

  constructor(private router: Router) {}

  // Filtered and sorted conditions
  filteredConditions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    let list = this.allConditions.filter((item) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.subCategory.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });

    const sort = this.sortBy();
    return list.sort((a, b) => {
      if (sort === 'therapists') {
        return b.therapistsNum - a.therapistsNum;
      } else if (sort === 'name') {
        return a.title.localeCompare(b.title);
      } else {
        return a.popularRank - b.popularRank;
      }
    });
  });

  // Total pages
  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredConditions().length / this.pageSize));
  });

  // Paged conditions
  paginatedConditions = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredConditions().slice(start, start + this.pageSize);
  });


  // Search actions
  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortBy.set(select.value as 'popular' | 'therapists' | 'name');
    this.currentPage.set(1);
  }

  // Pagination navigation
  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      // Smooth scroll back to top of conditions grid
      const gridElem = document.getElementById('conditions-grid-section');
      if (gridElem) {
        gridElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  // Navigate to condition detail page
  navigateToCondition(cond: ConditionItem): void {
    this.router.navigate(['/condition', cond.id]);
  }
}
