import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor(private router: Router) {}

  goToChat() {
    // ✅ 盡量把目前 friend/restaurant 帶回聊天頁
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
