import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalOptions {
  title: string;
  message: string;
  type?: 'warning' | 'error' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalSubject = new BehaviorSubject<ModalOptions | null>(null);
  public modal$ = this.modalSubject.asObservable();

  show(options: ModalOptions): void {
    this.modalSubject.next(options);
  }

  close(): void {
    this.modalSubject.next(null);
  }

  confirm(): void {
    const current = this.modalSubject.value;
    if (current && current.onConfirm) {
      current.onConfirm();
    }
    this.close();
  }

  cancel(): void {
    const current = this.modalSubject.value;
    if (current && current.onCancel) {
      current.onCancel();
    }
    this.close();
  }
}
