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

  // 找飯友
  goSocial(): void {
    alert('找飯友：之後會檢查是否完成個人資料');
    // this.router.navigate(['/match']);
  }

  // 自己吃
  goSolo(): void {
    alert('自己吃：之後會推薦餐廳');
    // this.router.navigate(['/solo']);
  }
}
