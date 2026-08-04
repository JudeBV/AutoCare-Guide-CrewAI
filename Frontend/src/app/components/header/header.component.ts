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
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
          <p class="header-subtitle">Vehicle service & maintenance assistant</p>
        </div>
      </div>

      <div class="header-right">
        <div class="status-indicator" aria-label="System status online">
          <span class="status-dot"></span>
          <span class="status-text">Available</span>
        </div>
        <button 
          type="button" 
          class="clear-btn btn-interactive min-touch-target" 
          (click)="onClearChat()"
          aria-label="Clear conversation history"
          title="Clear conversation">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span class="clear-label">Clear chat</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.375rem;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .logo-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-accent-purple) 0%, var(--color-primary) 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(124, 58, 237, 0.25);
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
      font-size: 1.1875rem;
      font-weight: 800;
      color: var(--color-navy);
      margin: 0;
      letter-spacing: -0.02em;
    }
    .ai-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-pill);
      background: rgba(139, 92, 246, 0.12);
      color: var(--color-primary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border: 1px solid rgba(139, 92, 246, 0.2);
    }
    .header-subtitle {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      margin: 0.125rem 0 0 0;
      font-weight: 500;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-success);
      background: var(--color-success-bg);
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-pill);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: var(--color-success);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }
    .clear-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.875rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-pill);
      background: rgba(255, 255, 255, 0.8);
      color: var(--color-text-muted);
      font-size: 0.8125rem;
      font-weight: 600;
    }
    .clear-btn:hover {
      background: rgba(255, 241, 242, 0.9);
      color: var(--color-danger);
      border-color: rgba(244, 63, 94, 0.3);
    }
    @media (max-width: 640px) {
      .app-header {
        padding: 0.875rem 1rem;
      }
      .header-subtitle {
        display: none;
      }
      .clear-label {
        display: none;
      }
      .clear-btn {
        padding: 0.5rem;
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
