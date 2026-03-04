import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type ChatMsg = { from: 'me' | 'friend'; text: string; time: string };

@Component({
  standalone: true,
  selector: 'app-friend-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './friend-chat.html',
  styleUrls: ['./friend-chat.css'],
})
export class FriendChatComponent implements OnInit, AfterViewInit {

  @ViewChild('chatBody') chatBody?: ElementRef<HTMLDivElement>;

  friend: any = { name: '飯友', mbti: '????', avatar: '' };
  restaurant: any = { name: '麻辣火鍋' };

  messages: ChatMsg[] = [];
  input = '';

  isTyping = false;

  showFeedback = false;
  rating = 0;
  hoverRating = 0;
  comment = '';

  get chatKey() {
    return `friend_chat_${this.friend?.name ?? 'unknown'}`;
  }

  get friendKey() {
    return `friend_current`;
  }

  get restaurantKey() {
    return `restaurant_current`;
  }

  constructor(private router: Router) {}

  ngOnInit(): void {

    const stateFriend = history.state?.friend;
    const stateRestaurant = history.state?.restaurant;

    const savedFriendRaw = localStorage.getItem(this.friendKey);
    const savedRestaurantRaw = localStorage.getItem(this.restaurantKey);

    this.friend = stateFriend ?? (savedFriendRaw ? JSON.parse(savedFriendRaw) : this.friend);
    this.restaurant = stateRestaurant ?? (savedRestaurantRaw ? JSON.parse(savedRestaurantRaw) : this.restaurant);

    localStorage.setItem(this.friendKey, JSON.stringify(this.friend));
    localStorage.setItem(this.restaurantKey, JSON.stringify(this.restaurant));

    const raw = localStorage.getItem(this.chatKey);

    this.messages = raw
      ? JSON.parse(raw)
      : [{ from: 'friend', text: '嗨～很高興配對成功！你想吃什麼？', time: this.now() }];

    this.save();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.chatBody?.nativeElement;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    }, 0);
  }

  now() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  save() {
    localStorage.setItem(this.chatKey, JSON.stringify(this.messages));
  }

  send() {

    const text = this.input.trim();
    if (!text || this.isTyping) return;

    this.messages.push({ from: 'me', text, time: this.now() });
    this.input = '';
    this.save();
    this.scrollToBottom();

    this.isTyping = true;

    const reply = this.generateReply(text);

    setTimeout(() => {

      this.messages.push({ from: 'friend', text: reply, time: this.now() });

      this.isTyping = false;
      this.save();
      this.scrollToBottom();

    }, 600);
  }

  generateReply(userText: string) {

    const t = userText.toLowerCase();

    if (t.includes('火鍋') || t.includes('鍋')) return '火鍋可以！你偏麻辣、昆布還是牛奶鍋？';
    if (t.includes('燒肉')) return '燒肉很讚～你想吃日式還是韓式？';
    if (t.includes('拉麵')) return '拉麵OK！你喜歡豚骨、醬油還是味噌？';

    if (t.includes('辣')) return '你也吃辣嗎？那我們可以選麻辣或韓式～你能吃到幾分辣？';

    return `好啊吃「${userText}」`;
  }

  backToPrev() {
    this.save();
    this.router.navigate(['/friend/matching'], { state: { friend: this.friend } });
  }

  endChat() {
    this.save();
    this.openFeedback();
  }

  openFeedback() {
    this.showFeedback = true;
    this.rating = 0;
    this.comment = '';
  }

  setRating(n: number) {
    this.rating = n;
  }

  submitFeedback() {

    if (this.rating <= 0) return;

    const payload = {
      type: 'friend',
      friend: this.friend,
      restaurant: this.restaurant,
      rating: this.rating,
      comment: this.comment.trim(),
      chat: this.messages,
      time: new Date().toISOString(),
    };

    const raw = localStorage.getItem('history_friend');
    const list = raw ? JSON.parse(raw) : [];

    list.unshift(payload);

    localStorage.setItem('history_friend', JSON.stringify(list));

    localStorage.removeItem(this.chatKey);

    this.showFeedback = false;

    this.router.navigate(['/home']);
  }

  closeFeedbackModal() {
    this.showFeedback = false;
  }
}
