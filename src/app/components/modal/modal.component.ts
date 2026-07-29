import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, ModalOptions } from '../../core/services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit {
  options: ModalOptions | null = null;

  constructor(
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.modalService.modal$.subscribe(opts => {
      this.options = opts;
      this.cdr.detectChanges();
    });
  }

  onConfirm(): void {
    this.modalService.confirm();
    this.cdr.detectChanges();
  }

  onCancel(): void {
    this.modalService.cancel();
    this.cdr.detectChanges();
  }

  onClose(): void {
    this.modalService.cancel();
    this.cdr.detectChanges();
  }
}
