import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-preference',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preference.html',
  styleUrls: ['./preference.css'],
})
export class PreferenceComponent {

  tags: string[] = [
    '日式', '韓式', '台式', '火鍋',
    '義式', '美式', '甜點', '不知道'
  ];

  iconMap: Record<string, string> = {
    日式: '🍣',
    韓式: '🍲',
    台式: '🍱',
    火鍋: '🍲',
    義式: '🍕',
    美式: '🍔',
    甜點: '🍰',
    不知道: '❓',
  };

  // ✅ 單選（只有一個）
  selectedTag: string | null = null;

  constructor(private router: Router) {}

  // ✅ 點擊標籤：固定選中
  selectTag(tag: string) {
    this.selectedTag = tag;
  }

  // ✅ 完成 → 前往自己吃結果頁
  onSave() {
    console.log('選擇的標籤:', this.selectedTag);

    this.router.navigate(['/solo/result'], {
      state: { tag: this.selectedTag }
    });
  }
}
