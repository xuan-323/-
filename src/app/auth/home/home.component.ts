import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
})
export class HomeComponent {

  constructor(private router: Router) {}

  // ✅ 找飯友
  goSocial(): void {
    this.router.navigate(['/auth/preference'], {
      state: { mode: 'friend' }
    });
  }

  // ✅ 自己吃
  goSolo(): void {
    this.router.navigate(['/auth/preference'], {
      state: { mode: 'solo' }
    });
  }
}
