import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { MedicalReportItem } from '../../../models/usermode';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-patient-medicalrecords',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-medicalrecords.html',
  styleUrl: './patient-medicalrecords.css',
})
export class PatientMedicalrecords {
  @Input() currentUser: any = null;

  private sweetAlert = inject(SweetAlertService);

  // Modal state
  showUploadModal = false;
  showReportViewerModal = false;
  selectedReport: MedicalReportItem | null = null;
  selectedUploadFile: File | null = null;

  newReport = {
    title: '',
    category: 'Assessment' as MedicalReportItem['category'],
    doctorName: '',
    date: new Date().toISOString().split('T')[0],
  };

  medicalReports: MedicalReportItem[] = [
    { id: 'REP-101', title: 'Lumbar Spine Comprehensive Biomechanical Assessment', category: 'Assessment', doctorName: 'Dr. Sarah Jenkins', date: '28 Aug 2026', fileSize: '1.8 MB', fileType: 'pdf' },
    { id: 'REP-102', title: 'MRI Lumbo-Sacral Spine (L4-L5 Disc Bulge Scan)', category: 'X-Ray / MRI', doctorName: 'City Imaging & Diagnostics', date: '14 Aug 2026', fileSize: '4.2 MB', fileType: 'pdf' },
    { id: 'REP-103', title: 'Rehabilitation Protocol & Pain Management Prescription', category: 'Prescription', doctorName: 'Dr. Rajesh Mehta', date: '02 Aug 2026', fileSize: '640 KB', fileType: 'pdf' },
    { id: 'REP-104', title: 'Initial Muscle Strength & Range-of-Motion Evaluation', category: 'Assessment', doctorName: 'Apex Physio Clinic', date: '18 Jul 2026', fileSize: '950 KB', fileType: 'pdf' }
  ];

  openUploadModal(): void {
    this.newReport = { title: '', category: 'Assessment', doctorName: '', date: new Date().toISOString().split('T')[0] };
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

  saveReport(): void {
    if (!this.newReport.title.trim()) return;
    const size = this.selectedUploadFile
      ? (this.selectedUploadFile.size > 1024 * 1024
        ? (this.selectedUploadFile.size / (1024 * 1024)).toFixed(1) + ' MB'
        : Math.round(this.selectedUploadFile.size / 1024) + ' KB')
      : '1.4 MB';
    const newDoc: MedicalReportItem = {
      id: 'REP-' + Math.floor(100 + Math.random() * 900),
      title: this.newReport.title,
      category: this.newReport.category,
      doctorName: this.newReport.doctorName || 'Self Uploaded',
      date: new Date(this.newReport.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      fileSize: size,
      fileType: 'pdf'
    };
    this.medicalReports.unshift(newDoc);
    this.sweetAlert.toastSuccess('Report uploaded successfully');
    this.closeUploadModal();
  }

  viewReport(report: MedicalReportItem): void {
    this.selectedReport = report;
    this.showReportViewerModal = true;
  }

  closeReportViewer(): void {
    this.showReportViewerModal = false;
    this.selectedReport = null;
  }

  downloadReport(report: MedicalReportItem): void {
    this.sweetAlert.toastSuccess(`Downloading ${report.title}...`);
  }

  printReport(): void {
    window.print();
  }
}
