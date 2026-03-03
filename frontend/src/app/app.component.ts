import { Component } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';

import { User } from './core/models/user.model';
import { CurrentUserService } from './core/services/current-user.service';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    // Angular
    RouterOutlet,
    RouterLink,
    NgIf,
    AsyncPipe,
    // Material
    MatToolbarModule,
    MatButtonModule,
  ],
})
export class AppComponent {
  user$: Observable<User | null> = this.currentUser.user$;

  constructor(
    private readonly currentUser: CurrentUserService,
    private readonly router: Router
  ) {}

  goToLogin() {
    this.currentUser.clearUser();
    this.router.navigateByUrl('/login');
  }
}

