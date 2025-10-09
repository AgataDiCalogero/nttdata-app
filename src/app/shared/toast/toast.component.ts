import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { ToastService } from './toast.service';

@Component({
  standalone: true,
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrls: ['./toast.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  svc = inject(ToastService);
}
