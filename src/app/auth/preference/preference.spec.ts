import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Preference } from './preference';

describe('Preference', () => {
  let component: Preference;
  let fixture: ComponentFixture<Preference>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Preference]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Preference);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
