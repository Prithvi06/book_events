import { Component, OnInit, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TimeSlot } from '../../core/models/slot.model';
import { CurrentUserService } from '../../core/services/current-user.service';
import { SlotsService } from '../../core/services/slots.service';
import { AddSlotDialogComponent } from './dialogs/add-slot-dialog.component';
import { ConfirmDialogComponent } from './dialogs/confirm-dialog.component';

@Component({
  standalone: true,
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  imports: [
    // Angular
    NgIf,
    // Material table + dialog
    MatTableModule,
    MatSortModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
})
export class AdminComponent implements OnInit {
  displayedColumns: string[] = [
    'category',
    'date',
    'start',
    'end',
    'bookedBy',
    'actions',
  ];

  dataSource = new MatTableDataSource<TimeSlot>([]);
  loading = false;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private readonly currentUser: CurrentUserService,
    private readonly slotsService: SlotsService,
    private readonly snack: MatSnackBar,
    private readonly dialog: MatDialog,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser.user$.subscribe((user) => {
      if (!user) {
        // No user loaded – bounce to login.
        this.router.navigateByUrl('/login');
        return;
      }
      if (!user.is_admin) {
        // Non-admins should never see the admin panel.
        this.router.navigateByUrl('/calendar');
        return;
      }
      // Only load data once we know this is an admin.
      this.refresh();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  refresh() {
    this.loading = true;
    this.slotsService.getSlots().subscribe({
      next: (slots) => {
        this.loading = false;
        this.dataSource.data = slots;
      },
      error: (e) => {
        this.loading = false;
        this.snack.open(e?.error?.error ?? 'Failed to load slots', 'Close', {
          duration: 3500,
        });
      },
    });
  }

  openAddSlot() {
    const ref = this.dialog.open(AddSlotDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe((created: boolean) => {
      if (created) this.refresh();
    });
  }

  deleteSlot(slot: TimeSlot) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete timeslot?',
        message: `Are you sure you want to delete ${slot.category} on ${new Date(
          slot.start_time
        ).toLocaleDateString()}?`,
        confirmText: 'Delete',
      },
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      const userId = this.currentUser.userIdSnapshot;
      this.slotsService.deleteSlot(slot.id, userId).subscribe({
        next: () => {
          this.snack.open('Slot deleted', 'Close', { duration: 2500 });
          this.refresh();
        },
        error: (e) => {
          this.snack.open(e?.error?.error ?? 'Failed to delete slot', 'Close', {
            duration: 3500,
          });
        },
      });
    });
  }

  bookedByLabel(slot: TimeSlot): string {
    return slot.booked_by_user_id ? slot.booked_by_name ?? '—' : '— Available —';
  }
}

