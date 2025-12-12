import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = '食伴 Match PWA';
  // 根元件不需要登入邏輯，只作為容器。
}