import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {

  showChatFloatingButtons = false;

  constructor(private router: Router) {

    // 🔥 監聽路由變化
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {

        // ✅ 只有聊天室頁顯示右邊按鈕
        this.showChatFloatingButtons =
          event.urlAfterRedirects.startsWith('/friend/chat');

      });
  }

  goToChat() {
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
  }

  goToHistory() {
    this.router.navigate(['/history']);
  }
}
