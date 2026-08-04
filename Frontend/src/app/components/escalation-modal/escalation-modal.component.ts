import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-escalation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-icon">🙋</span>
          <h3 id="modal-title" class="modal-title">Confirm Escalation to Human Support</h3>
        </div>

        <p class="modal-body">
          You are about to submit your vehicle query to our <strong>{{ targetDestination || 'Customer Support' }}</strong> team. A support representative will review your message history and contact you.
        </p>

        <div class="modal-notice">
          ℹ️ Note: This will create a support ticket. No automatic billing or vehicle booking will occur without your explicit consent.
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" (click)="onCancel()">Cancel</button>
          <button type="button" class="btn-confirm" (click)="onConfirm()">Confirm Escalation</button>
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
      background-color: rgba(15, 23, 42, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }
    .modal-card {
      background-color: var(--color-surface);
      border-radius: 14px;
      padding: 1.5rem;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      border: 1px solid var(--color-border);
    }
    .modal-header {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-bottom: 0.875rem;
    }
    .modal-icon {
      font-size: 1.5rem;
    }
    .modal-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-navy);
      margin: 0;
    }
    .modal-body {
      font-size: 0.9375rem;
      color: var(--color-text-main);
      line-height: 1.45;
      margin: 0 0 1rem 0;
    }
    .modal-notice {
      font-size: 0.8125rem;
      background-color: #f1f5f9;
      padding: 0.625rem;
      border-radius: 8px;
      color: var(--color-text-muted);
      margin-bottom: 1.25rem;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.625rem;
    }
    .btn-cancel {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      background-color: white;
      color: var(--color-navy);
      font-weight: 600;
      cursor: pointer;
    }
    .btn-confirm {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: none;
      background-color: var(--color-primary);
      color: white;
      font-weight: 600;
      cursor: pointer;
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
