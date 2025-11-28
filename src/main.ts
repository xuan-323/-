// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app'; // *** 假設您的主元件在 app.ts 中，且名為 AppComponent ***

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));