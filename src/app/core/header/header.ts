import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-header',
  imports: [RouterModule, ThemeToggle],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {}
