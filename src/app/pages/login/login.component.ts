import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  usernameOrEmail = '';
  password = '';
  showPassword = false;
  rememberMe = true;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.usernameOrEmail || !this.password) {
      this.errorMessage = 'Por favor ingresa tu usuario y contraseña';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.usernameOrEmail, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.status === 'EXPIRED' || res.daysRemaining <= 0) {
          this.errorMessage = 'Tu suscripción ha expirado. Por favor contacta a tu administrador para renovar tus días de servicio.';
          return;
        }
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor backend. Asegúrate de que esté encendido.';
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Usuario o contraseña incorrectos. Verifica tus credenciales.';
        }
      }
    });
  }

  onForgotPassword(): void {
    alert('Función de recuperación de contraseña activada próximamente. Contacta a tu administrador.');
  }
}
