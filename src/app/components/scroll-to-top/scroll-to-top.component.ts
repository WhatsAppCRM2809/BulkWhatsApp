import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="scroll-top-btn"
      [class.show]="showButton"
      (click)="scrollToTop()"
      title="Volver arriba"
      aria-label="Volver arriba"
    >
      <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
      </svg>
    </button>
  `,
  styles: [`
    .scroll-top-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #06b6d4 0%, #0284c7 100%);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 25px rgba(6, 182, 212, 0.45);
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px) scale(0.85);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .scroll-top-btn.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }

    .scroll-top-btn:hover {
      transform: translateY(-4px) scale(1.08);
      box-shadow: 0 12px 30px rgba(6, 182, 212, 0.6);
      background: linear-gradient(135deg, #22d3ee 0%, #0369a1 100%);
    }

    .scroll-top-btn:active {
      transform: translateY(-1px) scale(0.98);
    }

    .arrow-icon {
      width: 22px;
      height: 22px;
      transition: transform 0.2s ease;
    }

    .scroll-top-btn:hover .arrow-icon {
      transform: translateY(-2px);
    }
  `]
})
export class ScrollToTopComponent {
  showButton = false;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollOffset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.showButton = scrollOffset > 250;
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
