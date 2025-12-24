import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Explore } from './pages/explore/explore';
import { Ratings } from './pages/ratings/ratings';
import { Analytics } from './pages/analytics/analytics';
import { Profile } from './pages/profile/profile';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'explore', component: Explore },
  { path: 'ratings', component: Ratings },
  { path: 'analytics', component: Analytics },
  { path: 'profile', component: Profile },
  { path: '**', redirectTo: '' }
];
