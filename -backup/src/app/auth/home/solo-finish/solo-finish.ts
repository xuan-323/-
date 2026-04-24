import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-solo-finish',
  imports: [CommonModule],
  templateUrl: './solo-finish.html',
  styleUrls: ['./solo-finish.css']
})
export class SoloFinishComponent implements OnInit, OnDestroy {

  restaurant: any = history.state?.restaurant ?? null;

  private hasNavigatedToFeedback = false;
  private handleWindowFocusBound = this.handleWindowFocus.bind(this);
  private handleVisibilityChangeBound = this.handleVisibilityChange.bind(this);

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (!this.restaurant) {
      const raw = localStorage.getItem('solo_current_restaurant');
      this.restaurant = raw ? JSON.parse(raw) : null;
    }

    // 回到原本分頁時觸發
    window.addEventListener('focus', this.handleWindowFocusBound);
    document.addEventListener('visibilitychange', this.handleVisibilityChangeBound);
  }

  ngOnDestroy(): void {
    window.removeEventListener('focus', this.handleWindowFocusBound);
    document.removeEventListener('visibilitychange', this.handleVisibilityChangeBound);
  }

  openMap(): void {
    if (!this.restaurant) return;

    // 記錄：等等回來要跳回饋
    localStorage.setItem('solo_need_feedback', 'true');

    // 記住目前餐廳
    localStorage.setItem('solo_current_restaurant', JSON.stringify(this.restaurant));

    const query = encodeURIComponent(this.restaurant.name);

    // ✅ 用新分頁開，不要離開原本 Angular 頁面
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      '_blank'
    );
  }

  private handleWindowFocus(): void {
    this.checkNeedFeedback();
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      this.checkNeedFeedback();
    }
  }

  private checkNeedFeedback(): void {
    const needFeedback = localStorage.getItem('solo_need_feedback');

    if (needFeedback === 'true' && !this.hasNavigatedToFeedback) {
      this.hasNavigatedToFeedback = true;
      localStorage.removeItem('solo_need_feedback');

      this.router.navigate(['/auth/solo-feedback'], {
        state: {
          restaurant: this.restaurant
        }
      });
    }
  }

  shuffle(): void {
    this.router.navigate(['/solo/result']);
  }
}
