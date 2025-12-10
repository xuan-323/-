import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router'; // 引入 Router
import { FormsModule } from '@angular/forms'; // 引入 FormsModule

// 修正導入：指向正確的檔案名稱和類別名稱
import { LoginComponent } from './login.component'; 
import { AuthService } from '../auth.service'; 

// 創建模擬服務 (Mock Services)
const mockAuthService = {

  signIn: () => Promise.resolve({ user: { uid: 'test-user' } }),
};

const mockRouter = {
  navigate: jasmine.createSpy('navigate'),
};

describe('LoginComponent', () => { // 修正描述名稱
  let component: LoginComponent; // 修正變數類型
  let fixture: ComponentFixture<LoginComponent>; // 修正變數類型
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // 導入組件本身和必要的模組
      imports: [LoginComponent, FormsModule], 
      providers: [
        { provide: Router, useValue: mockRouter }, 
        { provide: AuthService, useValue: mockAuthService }, 
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent); 
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    
    fixture.detectChanges(); 
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // 可以添加更多測試，例如測試登入邏輯
  it('should call onLogin when form is submitted', async () => {
      // 這裡可以模擬表單提交
      // component.email = 'test@example.com';
      // component.password = 'password';
      // await component.onLogin();
      // expect(mockAuthService.signIn).toHaveBeenCalled();
  });
});
//test
