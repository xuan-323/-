// src/app/app.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // << 確保有導入

@Component({
  selector: 'app-root',
  standalone: true, // 確保是 Standalone
  imports: [RouterModule], // << 關鍵修正：導入路由模組
  templateUrl: './app.html', 
  styleUrls: ['./app.css'] 
})
export class AppComponent {
  title = 'foodie-social-app';
}