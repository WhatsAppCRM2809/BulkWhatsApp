import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ModalComponent } from './components/modal/modal.component';
import { ScrollToTopComponent } from './components/scroll-to-top/scroll-to-top.component';
import { ExcelService } from './core/services/excel.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    ModalComponent,
    ScrollToTopComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(
    private excelService: ExcelService,
    public authService: AuthService,
    public router: Router
  ) {}

  isLoginPage(): boolean {
    return this.router.url.includes('/login');
  }
}
