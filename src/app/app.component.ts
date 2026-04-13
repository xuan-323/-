import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

/**
 * 根應用組件
 * 負責應用級別的邏輯，如全局路由、狀態管理等
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();

  constructor(private router: Router) {}

  ngOnInit() {
    this.setupRouterLogging();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════════════════
  // 🛣️ 路由導航方法
  // ═══════════════════════════════════════════════════════════

  /**
   * 導航到聊天頁面
   * 帶上目前的飯友和餐廳資訊
   */
  goToChat() {
    try {
      const friendRaw = localStorage.getItem('friend_current');
      const restaurantRaw = localStorage.getItem('restaurant_current');

      const friend = friendRaw ? JSON.parse(friendRaw) : null;
      const restaurant = restaurantRaw ? JSON.parse(restaurantRaw) : null;

      this.router.navigate(['/friend/chat'], {
        state: {
          ...(friend ? { friend } : {}),
          ...(restaurant ? { restaurant } : {}),
        },
      });
    } catch (error) {
      console.error('[AppComponent] Navigate to chat failed:', error);
      this.router.navigate(['/friend/chat']);
    }
  }

  /**
   * 導航到歷史紀錄頁面
   */
  goToHistory() {
    try {
      this.router.navigate(['/history']);
    } catch (error) {
      console.error('[AppComponent] Navigate to history failed:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🧠 私有方法
  // ═══════════════════════════════════════════════════════════

  /**
   * 設定路由日誌記錄
   * 用於開發時追蹤導航事件
   * @private
   */
  private setupRouterLogging() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd | any) => {
        console.log(`[Router] Navigated to: ${event.url}`);
      });
  }
}
