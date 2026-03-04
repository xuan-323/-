import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

type HistorySoloItem = {
  type: 'solo';
  restaurant: any;
  rating: number;
  comment: string;
  time: string;
};

type HistoryFriendItem = {
  type: 'friend';
  friend: any;
  restaurant: any;
  rating: number;
  comment: string;
  time: string;
  chat?: any[]; // 可有可無：用來顯示「共幾則對話」
};

@Component({
  standalone: true,
  selector: 'app-history',
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrls: ['./history.css'],
})
export class HistoryComponent implements OnInit {
  debugText = 'History page loaded ✅';

  tab: 'solo' | 'friend' = 'solo';

  soloList: HistorySoloItem[] = [];
  friendList: HistoryFriendItem[] = [];

  ngOnInit(): void {
    this.loadSolo();
    this.loadFriend(); // 先載入，切 tab 才不用等
  }

  // ===== 自己吃 =====
  loadSolo() {
    const raw = localStorage.getItem('history'); // 你目前用的 key
    this.soloList = raw ? JSON.parse(raw) : [];
    this.debugText = `solo=${this.soloList.length}, friend=${this.friendList.length}`;
  }

  removeSolo(index: number) {
    this.soloList.splice(index, 1);
    localStorage.setItem('history', JSON.stringify(this.soloList));
    this.debugText = `solo=${this.soloList.length}, friend=${this.friendList.length}`;
  }

  // ===== 找飯友 =====
  loadFriend() {
    const raw = localStorage.getItem('history_friend'); // ✅ 找飯友我們用這個 key
    this.friendList = raw ? JSON.parse(raw) : [];
    this.debugText = `solo=${this.soloList.length}, friend=${this.friendList.length}`;
  }

  removeFriend(index: number) {
    this.friendList.splice(index, 1);
    localStorage.setItem('history_friend', JSON.stringify(this.friendList));
    this.debugText = `solo=${this.soloList.length}, friend=${this.friendList.length}`;
  }

  // ===== tab 切換 =====
  setTab(t: 'solo' | 'friend') {
    this.tab = t;
    if (t === 'solo') this.loadSolo();
    if (t === 'friend') this.loadFriend();
  }

  // ===== 工具 =====
  stars(n: number) {
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  }

  formatTime(iso: string) {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${day} ${hh}:${mm}`;
  }
}
