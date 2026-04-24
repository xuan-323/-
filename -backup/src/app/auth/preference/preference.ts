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

  // ✅ 標籤清單
  tags: string[] = [
    '日式',
    '韓式',
    '台式',
    '火鍋',
    '義式',
    '美式',
    '甜點',
    '不知道'
  ];

  // ✅ 標籤 icon 對照
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

  // ✅ 單選（只會有一個）
  selectedTag: string | null = null;

  constructor(private router: Router) {}

  // ✅ 點擊標籤 → 固定選中
  selectTag(tag: string) {
    this.selectedTag = tag;
  }

  // ✅ 完成
  onSave() {
    if (!this.selectedTag) return;

    // 🔑 從上一頁判斷模式（自己吃 / 找飯友）
    const mode: 'solo' | 'friend' = history.state?.mode ?? 'solo';

    console.log('模式:', mode, '選擇標籤:', this.selectedTag);

    if (mode === 'friend') {
      // 👉 找飯友流程
      this.router.navigate(['/friend/result'], {
        state: { tag: this.selectedTag }
      });
    } else {
      // 👉 自己吃流程
      this.router.navigate(['/solo/result'], {
        state: { tag: this.selectedTag }
      });
    }
  }
}
