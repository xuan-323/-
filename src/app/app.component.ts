import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true, // 設定為獨立元件
  // 引入 RouterOutlet，使其能作為路由的容器
  imports: [RouterOutlet], 
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = '食伴 Match PWA';
  // 根元件僅作為路由容器，不包含應用程式邏輯
}