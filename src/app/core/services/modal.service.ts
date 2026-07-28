import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ModalOptions {
  title: string;
  message: string;
  type?: 'warning' | 'error' | 'success' | 'info';
  confirmText?: string;
  onConfirm?: () => void;
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
    const current = this.modalSubject.value;
    if (current && current.onConfirm) {
      current.onConfirm();
    }
    this.modalSubject.next(null);
  }
}
