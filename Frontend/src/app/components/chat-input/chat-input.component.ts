import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="input-container" role="form" aria-label="Vehicle question submission">
      
      <!-- Character Limit Counter (Shown when approaching limit > 800) -->
      <div 
        *ngIf="messageText.length > 800" 
        class="char-counter" 
        [class.limit-reached]="messageText.length >= maxCharLimit"
        aria-live="polite">
        {{ messageText.length }} / {{ maxCharLimit }} characters
      </div>

      <div class="input-box">
        <textarea
          [(ngModel)]="messageText"
          (keydown)="onKeyDown($event)"
          [disabled]="isLoading"
          placeholder="Ask a question about your car (e.g. check engine light, tyre pressure, service interval)..."
          rows="1"
          class="message-textarea"
          [attr.maxlength]="maxCharLimit"
          aria-label="Type your vehicle question here">
        </textarea>

        <div class="action-buttons">
          <!-- Stop Processing Button -->
          <button
            *ngIf="isLoading"
            type="button"
            class="stop-btn"
            (click)="onStopProcessing()"
            aria-label="Stop processing question"
            title="Stop processing">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"></rect>
            </svg>
            <span>Stop processing</span>
          </button>

          <!-- Send Question Button -->
          <button
            *ngIf="!isLoading"
            type="button"
            class="send-btn"
            [disabled]="!canSend()"
            (click)="onSend()"
            aria-label="Send vehicle question"
            title="Send question (Enter)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <span>Send question</span>
          </button>
        </div>
      </div>

      <div class="keyboard-hint">
        <span>Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for new line</span>
      </div>

    </div>
  `,
  styles: [`
    .input-container {
      padding: 0.875rem 1rem;
      background-color: var(--color-surface);
      border-top: 1px solid var(--color-border);
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.02);
    }
    .char-counter {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      text-align: right;
      margin-bottom: 0.25rem;
    }
    .limit-reached {
      color: var(--color-danger);
      font-weight: 600;
    }
    .input-box {
      display: flex;
      align-items: flex-end;
      gap: 0.75rem;
      background-color: #f8fafc;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 0.5rem 0.75rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .input-box:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }
    .message-textarea {
      flex: 1;
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: 0.9375rem;
      color: var(--color-text-main);
      resize: none;
      max-height: 120px;
      outline: none;
      line-height: 1.45;
      padding: 0.25rem 0;
    }
    .action-buttons {
      display: flex;
      align-items: center;
    }
    .send-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      border: none;
      background-color: var(--color-primary);
      color: white;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.15s ease, transform 0.1s ease;
    }
    .send-btn:hover:not(:disabled) {
      background-color: #0369a1;
    }
    .send-btn:disabled {
      background-color: #cbd5e1;
      color: #94a3b8;
      cursor: not-allowed;
    }
    .send-btn:focus-visible {
      outline: 3px solid var(--color-navy);
    }
    .stop-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      border: 1px solid var(--color-danger);
      background-color: #fff5f5;
      color: var(--color-danger);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
    }
    .stop-btn:hover {
      background-color: #fee2e2;
    }
    .keyboard-hint {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 0.375rem;
      text-align: center;
    }
    @media (max-width: 640px) {
      .send-btn span, .stop-btn span {
        display: none;
      }
      .keyboard-hint {
        display: none;
      }
    }
  `]
})
export class ChatInputComponent {
  @Input() isLoading = false;
  @Output() sendMessage = new EventEmitter<string>();
  @Output() stopProcessing = new EventEmitter<void>();

  messageText = '';
  maxCharLimit = 1000;

  canSend(): boolean {
    return this.messageText.trim().length > 0 && !this.isLoading;
  }

  onSend() {
    if (this.canSend()) {
      this.sendMessage.emit(this.messageText.trim());
      this.messageText = '';
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  onStopProcessing() {
    this.stopProcessing.emit();
  }
}
