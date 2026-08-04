import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header" role="banner">
      <div class="header-left">
        <div class="logo-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.2 1 12 1 12.8V16c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
        <div class="header-titles">
          <div class="title-row">
            <h1 class="header-title">AutoCare Guide</h1>
            <span class="ai-badge" aria-label="Artificial Intelligence Assistant">AI Vehicle Assistant</span>
          </div>
          <p class="header-subtitle">Vehicle service and maintenance assistant</p>
        </div>
      </div>

      <div class="header-right">
        <div class="status-indicator" aria-label="System status online">
          <span class="status-dot"></span>
          <span class="status-text">Available</span>
        </div>
        <button 
          type="button" 
          class="clear-btn" 
          (click)="onClearChat()"
          aria-label="Clear conversation history"
          title="Clear conversation">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>Clear chat</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background-color: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .logo-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--color-navy), var(--color-primary));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-titles {
      display: flex;
      flex-direction: column;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }
    .header-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-navy);
      margin: 0;
      letter-spacing: -0.01em;
    }
    .ai-badge {
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      background-color: rgba(2, 132, 199, 0.1);
      color: var(--color-primary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .header-subtitle {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      margin: 0.125rem 0 0 0;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-success);
      background-color: rgba(22, 163, 74, 0.08);
      padding: 0.25rem 0.625rem;
      border-radius: 20px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--color-success);
    }
    .clear-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      background-color: var(--color-surface);
      color: var(--color-text-muted);
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .clear-btn:hover {
      background-color: #f1f5f9;
      color: var(--color-danger);
      border-color: #cbd5e1;
    }
    .clear-btn:focus-visible {
      outline: 3px solid var(--color-primary);
    }
    @media (max-width: 640px) {
      .app-header {
        padding: 0.875rem 1rem;
      }
      .header-subtitle {
        display: none;
      }
      .clear-btn span {
        display: none;
      }
    }
  `]
})
export class HeaderComponent {
  @Output() clearChat = new EventEmitter<void>();

  onClearChat() {
    this.clearChat.emit();
  }
}
