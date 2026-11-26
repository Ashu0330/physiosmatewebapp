import { Component, Input, OnInit, inject } from '@angular/core';
import { MedicalReportItem, HealthReport, HealthReportViewModel } from '../../../models/usermode';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { SharedModule } from '../../../shared/shared-module';
import { ApiService } from '../../../services/api.service';
import { Authservice } from '../../../services/authservice';
import { ApiEndPoints } from '../../../helper/api-endpoints';

@Component({
  selector: 'app-patient-medicalrecords',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './patient-medicalrecords.html',
  styleUrl: './patient-medicalrecords.css',
})
export class PatientMedicalrecords implements OnInit {
  @Input() currentUser: any = null;
  private apiService = inject(ApiService);
  private authService = inject(Authservice);
  private sweetAlert = inject(SweetAlertService);

  isLoading = false;
  isUploading = false;

  // Modal state
  showUploadModal = false;
  showReportViewerModal = false;
  selectedReport: MedicalReportItem | null = null;
  selectedUploadFile: File | null = null;

  newReport = {
    title: '',
    category: 'Assessment' as MedicalReportItem['category'],
    date: new Date().toISOString().split('T')[0],
  };

  medicalReports: MedicalReportItem[] = [];

  ngOnInit(): void {
    this.loadMedicalReports();
  }

  async loadMedicalReports(): Promise<void> {
    const userId = Number(this.authService.getuserid() || this.currentUser?.id || 0);
    if (!userId || userId <= 0) return;

    this.isLoading = true;
    try {
      const res = await this.apiService.Post<HealthReport[]>(`${ApiEndPoints.GetHealthReport}?userId=${userId}`);
      if (res?.isSuccess && Array.isArray(res.data) && res.data.length > 0) {
        this.medicalReports = res.data.map(r => {
          const dateStr = r.uploadedAt
            ? new Date(r.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'N/A';
          const ext = r.filePath?.split('.').pop()?.toLowerCase() || 'pdf';
          const isImg = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

          return {
            id: `REP-${r.id}`,
            title: r.reportName || 'Medical Report',
            category: 'Assessment',
            doctorName: 'Self Uploaded',
            date: dateStr,
            fileSize: isImg ? 'Image' : 'PDF Document',
            fileType: isImg ? 'image' : 'pdf',
            downloadUrl: r.filePath || ''
          };
        });
      } else {
        this.medicalReports = [];
      }
    } catch (e) {
      console.error('Error loading health reports', e);
      this.medicalReports = [];
    } finally {
      this.isLoading = false;
    }
  }

  openUploadModal(): void {
    this.newReport = { title: '', category: 'Assessment', date: new Date().toISOString().split('T')[0] };
    this.selectedUploadFile = null;
    this.showUploadModal = true;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.selectedUploadFile = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedUploadFile = input.files[0];
      if (!this.newReport.title) {
        this.newReport.title = this.selectedUploadFile.name.replace(/\.[^/.]+$/, '');
      }
    }
  }

  viewReport(report: MedicalReportItem): void {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
      return;
    }
    this.selectedReport = report;
    this.showReportViewerModal = true;
  }

  closeReportViewer(): void {
    this.showReportViewerModal = false;
    this.selectedReport = null;
  }

  downloadReport(report: MedicalReportItem): void {
    if (report.downloadUrl) {
      const a = document.createElement('a');
      a.href = report.downloadUrl;
      a.target = '_blank';
      a.download = report.title || 'report';
      a.click();
    } else {
      this.sweetAlert.toastSuccess(`Downloading ${report.title}...`);
    }
  }

  printReport(): void {
    window.print();
  }

  async AddMedicalRecord(): Promise<void> {
    if (!this.selectedUploadFile) {
      this.sweetAlert.warning('File Required', 'Please select a document or scan to upload.');
      return;
    }

    const title = this.newReport.title?.trim();
    if (!title) {
      this.sweetAlert.warning('Title Required', 'Please enter a document title.');
      return;
    }

    const userId = Number(this.authService.getuserid() || this.currentUser?.id || 0);
    if (!userId || userId <= 0) {
      this.sweetAlert.error('Authentication Error', 'Please log in to upload medical records.');
      return;
    }

    // Prepare model payload matching backend HealthReportViewModel
    const formData = new FormData();
    formData.append('UserId', userId.toString());
    formData.append('ReportName', title || this.selectedUploadFile.name);
    formData.append('File', this.selectedUploadFile, this.selectedUploadFile.name);

    this.isUploading = true;
    try {
      const result = await this.apiService.PostForm<boolean>(ApiEndPoints.AddHealthReport, formData);
      if (result.isSuccess) {
        this.sweetAlert.toastSuccess(result.message || 'Report uploaded successfully');
        this.closeUploadModal();
        await this.loadMedicalReports();
      } else {
        this.sweetAlert.error(result.message || 'Failed to upload report');
      }
    } catch (err: any) {
      console.error('Upload health report error', err);
      this.sweetAlert.error(err?.message || 'Unable to upload report. Please try again.');
    } finally {
      this.isUploading = false;
    }
  }
}
