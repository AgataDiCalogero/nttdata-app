import { inject, Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import {
  type LucideIconData,
  type LucideIconNode,
  Menu,
  LogIn,
  LogOut,
  Users,
  FileText,
  MessageSquare,
  Info,
  Moon,
  Sun,
  ExternalLink,
  Lock,
  Key,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Eye,
  Pencil,
  Plus,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Mail,
  User,
  Check,
  Save,
  Send,
  X,
  Circle,
} from 'lucide-angular';

type RegisteredIcon = {
  name: string;
  data: LucideIconData;
};

const ICON_NAMESPACE = 'lucide';
const LUCIDE_ICONS: RegisteredIcon[] = [
  { name: 'menu', data: Menu },
  { name: 'log-in', data: LogIn },
  { name: 'log-out', data: LogOut },
  { name: 'users', data: Users },
  { name: 'posts', data: FileText },
  { name: 'file-text', data: FileText },
  { name: 'message-square', data: MessageSquare },
  { name: 'info', data: Info },
  { name: 'moon', data: Moon },
  { name: 'sun', data: Sun },
  { name: 'external-link', data: ExternalLink },
  { name: 'lock', data: Lock },
  { name: 'key', data: Key },
  { name: 'alert-circle', data: AlertCircle },
  { name: 'alert-triangle', data: AlertTriangle },
  { name: 'trash-2', data: Trash2 },
  { name: 'eye', data: Eye },
  { name: 'pencil', data: Pencil },
  { name: 'plus', data: Plus },
  { name: 'chevron-left', data: ChevronLeft },
  { name: 'chevron-right', data: ChevronRight },
  { name: 'rotate-ccw', data: RotateCcw },
  { name: 'rotate-cw', data: RotateCw },
  { name: 'mail', data: Mail },
  { name: 'user', data: User },
  { name: 'check', data: Check },
  { name: 'save', data: Save },
  { name: 'send', data: Send },
  { name: 'x', data: X },
  { name: 'circle', data: Circle },
];

@Injectable({
  providedIn: 'root',
})
export class LucideMatIconService {
  private readonly registry = inject(MatIconRegistry);
  private readonly sanitizer = inject(DomSanitizer);
  private registered = false;

  constructor() {
    this.registerAll();
  }

  private registerAll(): void {
    if (this.registered) {
      return;
    }

    for (const icon of LUCIDE_ICONS) {
      const svg = this.buildSvg(icon.data);
      this.registry.addSvgIconLiteralInNamespace(
        ICON_NAMESPACE,
        icon.name,
        this.sanitizer.bypassSecurityTrustHtml(svg),
      );
    }

    this.registered = true;
  }

  private buildSvg(data: LucideIconData): string {
    const content = data
      .map(([tag, attributes]: LucideIconNode) => {
        const attr = Object.entries(attributes)
          .filter(([key]) => key !== 'key')
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');
        return `<${tag} ${attr}></${tag}>`;
      })
      .join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
  }
}
