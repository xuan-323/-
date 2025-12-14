import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {

  username = 'Foodie_Kai';
  gender: 'male' | 'female' | 'secret' = 'male';
  bio = '';
  avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDo_dS3I7cLVetcAaETDLI7FwVZMhZGWG6SytE9U9ol8xtSThswI0QQvZOAw5ebalvkpB3sbx4S0a7UbgHM1Z54nkVcROHtw4HTK5Ut2BXSAfCK1JFb5MhZ-aASOFP6fOjTcrY3x84zirZj2fqwf375gvfUODMH4iPCDncAOfwsyYhiz3aB2F19F1KxLNp52yecmLf6dFVCGm9BJGGll6_h_VPymraCVNiedRNK3x43qy2HvrNHH3BlhrAfJBRgGmilJ96mxcnRQ76V';

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/home']);
  }

  changeAvatar() {
    alert('之後可接圖片上傳');
  }

  saveProfile() {
    console.log({
      username: this.username,
      gender: this.gender,
      bio: this.bio,
    });
    alert('已儲存（目前僅前端）');
  }
}
