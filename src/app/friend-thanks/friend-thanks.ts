import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-friend-thanks',
  imports: [CommonModule],
  templateUrl: './friend-thanks.html',
  styleUrls: ['./friend-thanks.css']
})
export class FriendThanksComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
