import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // 引入 FormsModule 以支援表單雙向綁定

import { AppComponent } from './app.component';
import { LoginComponent } from './auth/login/login.component'; // 假設 LoginComponent 在這個路徑

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent // 3. 已加入 LoginComponent
  ],
  imports: [
    BrowserModule,
    FormsModule // 2. 已引入 FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }