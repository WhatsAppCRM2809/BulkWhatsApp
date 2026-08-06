import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ModalService } from '../services/modal.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const modalService = inject(ModalService);

  const token = localStorage.getItem('token');
  let authReq = req;

  if (token && token !== 'null' && token !== 'undefined') {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Interceptor capturó error:', error);

      if (error.status === 401) {
        const msg = error.error?.message || 'Tu sesión ha sido cerrada porque ingresaste desde otro equipo o expiró.';

        modalService.show({
          title: '🔒 Sesión Cerrada',
          message: msg,
          type: 'warning',
          confirmText: 'Ir al Login',
          onConfirm: () => {
            authService.logout();
          }
        });
      } else if (error.status === 0) {
        modalService.show({
          title: '🔌 Servidor Desconectado o Iniciando',
          message: `No se pudo establecer comunicación con el servidor backend (${environment.apiUrl}). Si el servidor en Render estaba inactivo, está despertando y estará listo en 30 segundos.`,
          type: 'error',
          confirmText: 'Entendido'
        });
      } else if (error.status >= 500) {
        modalService.show({
          title: '⚠️ Error del Servidor',
          message: error.error?.message || 'Ocurrió un problema interno en el servidor.',
          type: 'error',
          confirmText: 'Cerrar'
        });
      }

      return throwError(() => error);
    })
  );
};
