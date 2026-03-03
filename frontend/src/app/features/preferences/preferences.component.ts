import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

import { CurrentUserService } from '../../core/services/current-user.service';
import { UserService } from '../../core/services/user.service';

@Component({
  standalone: true,
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
  imports: [
    // Angular
    ReactiveFormsModule,
    NgIf,
    // Material
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
})
export class PreferencesComponent implements OnInit {
  readonly categories = ['Cat 1', 'Cat 2', 'Cat 3'] as const;

  readonly form = this.fb.group({
    cat1: [false],
    cat2: [false],
    cat3: [false],
  });

  loading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly currentUser: CurrentUserService,
    private readonly snack: MatSnackBar,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;
    const userId = this.currentUser.userIdSnapshot;
    this.userService.getPreferences(userId).subscribe({
      next: (prefs) => {
        this.form.patchValue({
          cat1: prefs.includes('Cat 1'),
          cat2: prefs.includes('Cat 2'),
          cat3: prefs.includes('Cat 3'),
        });
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.snack.open(e?.error?.error ?? 'Failed to load preferences', 'Close', {
          duration: 3500,
        });
      },
    });
  }

  get selectedPrefs(): string[] {
    const v = this.form.value;
    const out: string[] = [];
    if (v.cat1) out.push('Cat 1');
    if (v.cat2) out.push('Cat 2');
    if (v.cat3) out.push('Cat 3');
    return out;
  }

  save(goToCalendar = false) {
    const userId = this.currentUser.userIdSnapshot;
    this.loading = true;
    this.userService.updatePreferences(userId, this.selectedPrefs).subscribe({
      next: () => {
        this.loading = false;
        this.snack.open('Preferences saved', 'Close', { duration: 2500 });
        if (goToCalendar) this.router.navigateByUrl('/calendar');
      },
      error: (e) => {
        this.loading = false;
        this.snack.open(e?.error?.error ?? 'Failed to save preferences', 'Close', {
          duration: 3500,
        });
      },
    });
  }
}

