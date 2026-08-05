import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public currentTheme = signal<ThemeMode>('dark');

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const savedTheme = localStorage.getItem('bulk_whatsapp_theme') as ThemeMode | null;
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Default to Dark Mode for sleek enterprise feel
      this.setTheme('dark');
    }
  }

  public toggleTheme(): void {
    const newTheme: ThemeMode = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  public setTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
    localStorage.setItem('bulk_whatsapp_theme', theme);

    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }
}
