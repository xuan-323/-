import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-solo-thanks',
  imports: [CommonModule],
  templateUrl: './solo-thanks.html',
  styleUrls: ['./solo-thanks.css']
})
export class SoloThanksComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
