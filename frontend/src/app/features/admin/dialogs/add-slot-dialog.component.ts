import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf, NgFor } from '@angular/common';

import { CurrentUserService } from '../../../core/services/current-user.service';
import { SlotsService } from '../../../core/services/slots.service';

@Component({
  standalone: true,
  selector: 'app-add-slot-dialog',
  templateUrl: './add-slot-dialog.component.html',
  styleUrls: ['./add-slot-dialog.component.scss'],
  imports: [
    // Angular
    ReactiveFormsModule,
    NgIf,
    NgFor,
    // Material dialog + form controls
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
})
export class AddSlotDialogComponent {
  readonly categories = ['Cat 1', 'Cat 2', 'Cat 3'] as const;

  readonly form = this.fb.group(
    {
      category: [null as string | null, Validators.required],
      date: [null as Date | null, Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
    },
    { validators: [endAfterStartValidator, notPastDateValidator] }
  );

  saving = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly slotsService: SlotsService,
    private readonly currentUser: CurrentUserService,
    private readonly snack: MatSnackBar,
    readonly ref: MatDialogRef<AddSlotDialogComponent>
  ) {}

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { category, date, startTime, endTime } = this.form.value;
    if (!category || !date || !startTime || !endTime) return;

    const start = dateTimeFromDateAndTime(date, startTime);
    const end = dateTimeFromDateAndTime(date, endTime);

    this.saving = true;
    const userId = this.currentUser.userIdSnapshot;
    this.slotsService
      .createSlot(
        {
          category: category as any,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        },
        userId
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.snack.open('Slot created', 'Close', { duration: 2500 });
          this.ref.close(true);
        },
        error: (e) => {
          this.saving = false;
          this.snack.open(e?.error?.error ?? 'Failed to create slot', 'Close', {
            duration: 3500,
          });
        },
      });
  }
}

function dateTimeFromDateAndTime(date: Date, time: string): Date {
  const [hh, mm] = time.split(':').map((x) => Number(x));
  const d = new Date(date);
  d.setHours(hh, mm, 0, 0);
  return d;
}

function endAfterStartValidator(group: any) {
  const startTime = group.get('startTime')?.value;
  const endTime = group.get('endTime')?.value;
  const date = group.get('date')?.value as Date | null;
  if (!date || !startTime || !endTime) return null;

  const start = dateTimeFromDateAndTime(date, startTime);
  const end = dateTimeFromDateAndTime(date, endTime);
  return end > start ? null : { endBeforeStart: true };
}

function notPastDateValidator(group: any) {
  const date = group.get('date')?.value as Date | null;
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today ? null : { pastDate: true };
}

