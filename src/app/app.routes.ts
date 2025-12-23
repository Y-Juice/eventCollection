import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Explore } from './pages/explore/explore';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'explore', component: Explore },
  { path: '**', redirectTo: '' }
];
