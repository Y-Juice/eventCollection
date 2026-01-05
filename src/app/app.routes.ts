import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Explore } from './pages/explore/explore';
import { Ratings } from './pages/ratings/ratings';
import { Analytics } from './pages/analytics/analytics';
import { Profile } from './pages/profile/profile';
import { Login } from './pages/login/login';
import { Admin } from './pages/admin/admin';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'explore', component: Explore },
  { path: 'ratings', component: Ratings },
  { path: 'analytics', component: Analytics },
  { path: 'profile', component: Profile },
  { path: 'login', component: Login },
  { path: 'admin', component: Admin },
  { path: '**', redirectTo: '' }
];
