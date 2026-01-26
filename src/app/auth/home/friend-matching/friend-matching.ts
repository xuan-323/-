import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-friend-matching',
  imports: [CommonModule],
  templateUrl: './friend-matching.html',
  styleUrls: ['./friend-matching.css'],
})
export class FriendMatchingComponent {

  tag = history.state?.tag ?? '不知道';

  candidates = [
    {
      name: 'Alex',
      mbti: 'ENFP',
      intro: '愛聊天、什麼都能聊',
      avatar: 'https://i.pravatar.cc/300?img=12'
    },
    {
      name: 'Mina',
      mbti: 'INFJ',
      intro: '安靜但很貼心',
      avatar: 'https://i.pravatar.cc/300?img=32'
    }
  ];

  constructor(private router: Router) {}

  selectFriend(friend: any) {
    this.router.navigate(['/friend/success'], {
      state: { friend }
    });
  }

  shuffle() {
    this.candidates = [...this.candidates].sort(() => Math.random() - 0.5);
  }
}
