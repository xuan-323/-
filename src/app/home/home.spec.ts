import { ComponentFixture, TestBed } from '@angular/core/testing';

// 修正導入：使用正確的類別名稱 HomeComponent
import { HomeComponent } from './home.component'; 

describe('HomeComponent', () => { // 修正描述名稱
  let component: HomeComponent; // 修正類別名稱
  let fixture: ComponentFixture<HomeComponent>; // 修正類別名稱

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent] // 修正類別名稱
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent); // 修正類別名稱
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});