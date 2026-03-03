import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [NgIf, MatCardModule, MatButtonModule],
})
export class LoginComponent {
  loading = false;

  constructor(
    private readonly currentUser: CurrentUserService,
    private readonly router: Router
  ) {}

  signInAs(userId: number) {
    if (this.loading) return;
    this.loading = true;
    this.currentUser.setUserId(userId);
    // After switching the current user, go to the calendar.
    this.router.navigateByUrl('/calendar');
  }
}

