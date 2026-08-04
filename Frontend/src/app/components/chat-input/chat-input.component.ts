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

      <div class="composer-card glass-card">
        
        <!-- Left Action Icons (Attachment & Microphone) -->
        <div class="left-actions">
          <button 
            type="button" 
            class="icon-btn btn-interactive min-touch-target" 
            aria-label="Add attachment"
            title="Attach file/image (Informational preview)">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>
          
          <button 
            type="button" 
            class="icon-btn btn-interactive min-touch-target" 
            aria-label="Voice input"
            title="Voice input (Microphone mode)">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
        </div>

        <!-- Main Textarea -->
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

        <!-- Right Action Button (Send or Stop) -->
        <div class="right-actions">
          <!-- Stop Processing Button -->
          <button
            *ngIf="isLoading"
            type="button"
            class="stop-btn btn-interactive min-touch-target"
            (click)="onStopProcessing()"
            aria-label="Stop processing question"
            title="Stop processing">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"></rect>
            </svg>
            <span class="btn-text">Stop</span>
          </button>

          <!-- Send Question Button -->
          <button
            *ngIf="!isLoading"
            type="button"
            class="send-btn btn-interactive min-touch-target"
            [disabled]="!canSend()"
            (click)="onSend()"
            aria-label="Send vehicle question"
            title="Send question (Enter)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <span class="btn-text">Send</span>
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
      padding: 0.875rem 1.25rem 1rem 1.25rem;
      background: rgba(255, 255, 255, 0.65);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-top: 1px solid var(--color-border);
    }
    .char-counter {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      text-align: right;
      margin-bottom: 0.375rem;
      font-weight: 500;
    }
    .limit-reached {
      color: var(--color-danger);
      font-weight: 700;
    }
    .composer-card {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.4rem 0.5rem 0.4rem 0.75rem;
      border-radius: var(--radius-pill);
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid var(--glass-border);
      box-shadow: var(--shadow-md);
      transition: border-color var(--motion-fast), box-shadow var(--motion-fast);
    }
    .composer-card:focus-within {
      border-color: var(--color-accent-purple);
      box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15), var(--shadow-md);
    }
    .left-actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 0;
    }
    .icon-btn:hover {
      background: rgba(139, 92, 246, 0.1);
      color: var(--color-primary);
    }
    .message-textarea {
      flex: 1;
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: 0.9375rem;
      color: var(--color-navy-dark);
      resize: none;
      max-height: 120px;
      outline: none;
      line-height: 1.45;
      padding: 0.4rem 0.25rem;
      font-weight: 500;
    }
    .message-textarea::placeholder {
      color: var(--color-text-light);
      font-weight: 400;
    }
    .right-actions {
      display: flex;
      align-items: center;
    }
    .send-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-pill);
      border: none;
      background: var(--button-gradient);
      color: white;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25);
    }
    .send-btn:hover:not(:disabled) {
      background: var(--button-gradient-hover);
    }
    .send-btn:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
    .stop-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-pill);
      border: 1px solid var(--color-danger);
      background: #fff1f2;
      color: var(--color-danger);
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
    }
    .stop-btn:hover {
      background: #fee2e2;
    }
    .keyboard-hint {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 0.5rem;
      text-align: center;
      font-weight: 500;
    }
    @media (max-width: 640px) {
      .input-container {
        padding: 0.75rem 0.875rem;
      }
      .btn-text {
        display: none;
      }
      .send-btn, .stop-btn {
        padding: 0.5rem;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        justify-content: center;
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
