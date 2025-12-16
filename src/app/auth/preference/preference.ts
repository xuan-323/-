import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-preference',
  templateUrl: './preference.html', // 確保這裡檔名與你的 html 一致
  styleUrls: ['./preference.css']    // 確保這裡檔名與你的 css 一致
})
export class PreferenceComponent {
  // 定義口味標籤
  tags: string[] = ['日式', '韓式', '台式', '火鍋', '義式', '美式', '甜點'];
  // 紀錄使用者選取的標籤
  selectedTags: string[] = [];

  constructor(private router: Router) {}

  // 點擊標籤：如果選過就移除，沒選過就加入
  toggleTag(tag: string) {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
  }

  // 按下「完成」後的動作
  onSave() {
    console.log('使用者選擇的口味：', this.selectedTags);
    // 導向註冊後的歡迎頁面（請確保你有這個路徑）
    this.router.navigate(['/auth/welcome']);
  }
}
