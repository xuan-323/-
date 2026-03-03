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

  // === 輸入中（AI typing）===
  isTyping = false;

  // === 回饋彈窗狀態 ===
  showFeedback = false;
  rating = 0;         // 1~5 必填
  hoverRating = 0;    // hover 用
  comment = '';       // 可空

  // localStorage keys
  get chatKey() {
    return `friend_chat_${this.friend?.name ?? 'unknown'}`;
  }
  get friendKey() {
    return `friend_current`;
  }
  get restaurantKey() {
    return `restaurant_current`;
  }
  get feedbackKey() {
    return `friend_feedback_${this.friend?.name ?? 'unknown'}`;
  }

  constructor(private router: Router) {}

  ngOnInit(): void {
    // 1) 先拿 history.state
    const stateFriend = history.state?.friend;
    const stateRestaurant = history.state?.restaurant;

    // 2) 沒有 state（例如點別頁又回來）就讀 localStorage
    const savedFriendRaw = localStorage.getItem(this.friendKey);
    const savedRestaurantRaw = localStorage.getItem(this.restaurantKey);

    this.friend = stateFriend ?? (savedFriendRaw ? JSON.parse(savedFriendRaw) : this.friend);
    this.restaurant = stateRestaurant ?? (savedRestaurantRaw ? JSON.parse(savedRestaurantRaw) : this.restaurant);

    // 3) 存起來，確保下次能顯示
    localStorage.setItem(this.friendKey, JSON.stringify(this.friend));
    localStorage.setItem(this.restaurantKey, JSON.stringify(this.restaurant));

    // 4) 讀取對話紀錄
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
    // 等 DOM 渲染完再滑
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

    // ✅ AI 模擬：輸入中 + 根據你輸入內容回
    this.isTyping = true;
    const reply = this.generateReply(text);

    setTimeout(() => {
      this.messages.push({ from: 'friend', text: reply, time: this.now() });
      this.isTyping = false;
      this.save();
      this.scrollToBottom();
    }, 600);
  }

  // === AI 模擬回覆（關鍵字規則 + 模板）===
  generateReply(userText: string) {
    const t = userText.toLowerCase();

    if (t.includes('火鍋') || t.includes('鍋')) return '火鍋可以！你偏麻辣、昆布還是牛奶鍋？';
    if (t.includes('燒肉')) return '燒肉很讚～你想吃日式還是韓式？';
    if (t.includes('拉麵')) return '拉麵OK！你喜歡豚骨、醬油還是味噌？';
    if (t.includes('咖哩')) return '咖哩不錯～你想日式咖哩還是泰式綠咖哩？';

    if (t.includes('辣')) return '你也吃辣嗎？那我們可以選麻辣或韓式～你能吃到幾分辣？';
    if (t.includes('不辣') || t.includes('不吃辣')) return 'OK～那我們避開麻辣，選清湯/日式/義式都可以！';
    if (t.includes('便宜') || t.includes('預算')) return '了解～你預算大概每人多少？我可以配合挑平價的。';
    if (t.includes('隨便') || t.includes('都可以')) return '好～那我提兩個選項：火鍋 or 燒肉，你選哪個？';

    if (t.includes('你呢') || t.includes('你想')) {
      return '我都可以～但我比較想吃「可以慢慢聊」的那種，火鍋或燒肉都很適合！';
    }

    return `聽起來不錯～你說「${userText}」，那我們要不要再縮小選項：火鍋 / 燒肉 / 拉麵？`;
  }

  // === 右上回上一頁 ===
  backToPrev() {
    this.save();
    this.router.navigate(['/friend/matching'], { state: { friend: this.friend } });
  }

  // ✅ 點「結束對話」：每次都跳回饋彈窗
  endChat() {
    this.save();
    this.openFeedback();
  }

  // ✅ 右下「回饋按鈕」：只在聊天頁出現（你要的）
  openFeedback() {
    this.showFeedback = true;
    this.rating = 0;
    this.hoverRating = 0;
    this.comment = '';
  }

  // 回饋：點星星
  setRating(n: number) {
    this.rating = n;
  }

  // 回饋：送出（星星必填，文字可空）
  submitFeedback() {
    if (this.rating <= 0) return;

    const payload = {
      friend: this.friend,
      restaurant: this.restaurant,
      rating: this.rating,
      comment: this.comment.trim(),
      time: new Date().toISOString(),
    };

    localStorage.setItem(this.feedbackKey, JSON.stringify(payload));
    this.showFeedback = false;

    // 送出後回你要的地方（先回 home）
    this.router.navigate(['/home']);
  }

  // 回饋：關閉（不送也可以）
  closeFeedbackModal() {
    this.showFeedback = false;
  }
}
