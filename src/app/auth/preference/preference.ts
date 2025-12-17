import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ 一定要
import { Router } from '@angular/router';

@Component({
  selector: 'app-preference',
  standalone: true,
  imports: [CommonModule], // ✅ 關鍵就在這一行
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
    韓式: '🍜',
    台式: '🍚',
    火鍋: '🍲',
    義式: '🍕',
    美式: '🍔',
    甜點: '🍰',
    不知道: '❓',
  };

  selectedTags: string[] = [];

  constructor(private router: Router) {}

  toggleTag(tag: string) {
    if (tag === '不知道') {
      this.selectedTags = ['不知道'];
      return;
    }

    this.selectedTags = this.selectedTags.filter(t => t !== '不知道');

    if (this.selectedTags.includes(tag)) {
      this.selectedTags = this.selectedTags.filter(t => t !== tag);
    } else {
      this.selectedTags.push(tag);
    }
  }

  onSave() {
    console.log(this.selectedTags);
  }
}
