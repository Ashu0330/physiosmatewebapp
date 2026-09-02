import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SweetAlertService {


  success(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({ icon: 'success', title, text, confirmButtonColor: '#4f46e5' });
  }

  error(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({ icon: 'error', title, text, confirmButtonColor: '#ef4444' });
  }

  warning(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({ icon: 'warning', title, text, confirmButtonColor: '#f59e0b' });
  }

  info(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({ icon: 'info', title, text, confirmButtonColor: '#3b82f6' });
  }

  // --- Toast Notifications ---------------------------------------------------

  toast(icon: SweetAlertIcon, title: string, timer = 3000): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      didOpen: (toast: HTMLElement) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
    Toast.fire({ icon, title });
  }

  toastSuccess(title: string, timer = 3000): void {
    this.toast('success', title, timer);
  }

  toastError(title: string, timer = 3000): void {
    this.toast('error', title, timer);
  }

  toastWarning(title: string, timer = 3000): void {
    this.toast('warning', title, timer);
  }

  toastInfo(title: string, timer = 3000): void {
    this.toast('info', title, timer);
  }

  // --- Confirmation Dialog ---------------------------------------------------

  confirm(
    title: string,
    text?: string,
    confirmButtonText = 'Yes, confirm',
    cancelButtonText = 'Cancel'
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280',
      confirmButtonText,
      cancelButtonText
    });
  }

  confirmDelete(title = 'Are you sure?', text = 'This action cannot be undone.'): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
  }

  // --- Custom Alert ----------------------------------------------------------

  custom(options: SweetAlertOptions): Promise<SweetAlertResult> {
    return Swal.fire(options);
  }

  // --- Loading / Progress ----------------------------------------------------

  showLoading(title = 'Please wait...', text?: string): void {
    Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading()
    });
  }

  closeLoading(): void {
    Swal.close();
  }
}
