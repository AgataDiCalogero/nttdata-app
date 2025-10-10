import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { ToastService } from './toast.service';

@Component({
  standalone: true,
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  svc = inject(ToastService);
}
