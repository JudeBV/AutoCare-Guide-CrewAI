import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-escalation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-card glass-card animate-modal">
        <div class="modal-header">
          <div class="modal-icon-badge">🙋</div>
          <h3 id="modal-title" class="modal-title">Confirm Escalation to Human Support</h3>
        </div>

        <p class="modal-body">
          You are about to submit your vehicle query to our <strong>{{ targetDestination || 'Customer Support' }}</strong> team. A support representative will review your message history and contact you.
        </p>

        <div class="modal-notice">
          ℹ️ Note: This will create a support ticket. No automatic billing or vehicle booking will occur without your explicit consent.
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-cancel btn-interactive min-touch-target" (click)="onCancel()">Cancel</button>
          <button type="button" class="btn-confirm btn-interactive min-touch-target" (click)="onConfirm()">Confirm Escalation</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-card {
      padding: 1.75rem;
      max-width: 480px;
      width: 100%;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      background: rgba(255, 255, 255, 0.95);
    }
    .animate-modal {
      animation: modalScaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .modal-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .modal-icon-badge {
      font-size: 1.5rem;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(139, 92, 246, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .modal-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-navy);
      margin: 0;
      letter-spacing: -0.01em;
    }
    .modal-body {
      font-size: 0.9375rem;
      color: var(--color-text-main);
      line-height: 1.5;
      margin: 0 0 1rem 0;
    }
    .modal-notice {
      font-size: 0.8125rem;
      background: rgba(241, 245, 249, 0.9);
      padding: 0.75rem;
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      margin-bottom: 1.375rem;
      border: 1px solid var(--color-border);
      line-height: 1.45;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .btn-cancel {
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-pill);
      border: 1px solid var(--color-border);
      background: white;
      color: var(--color-navy);
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
    }
    .btn-confirm {
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-pill);
      border: none;
      background: var(--button-gradient);
      color: white;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25);
    }
  `]
})
export class EscalationModalComponent {
  @Input() isOpen = false;
  @Input() targetDestination = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
