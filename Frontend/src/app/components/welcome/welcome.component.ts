import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SuggestedQuestion {
  category: string;
  icon: string;
  text: string;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="welcome-container animate-message-appear" aria-labelledby="welcome-heading">
      <div class="welcome-card glass-card">
        <div class="welcome-header">
          <div class="assistant-avatar" aria-hidden="true">
            <span class="avatar-emoji">🚗</span>
          </div>
          <div class="welcome-title-group">
            <h2 id="welcome-heading" class="welcome-title">Welcome to AutoCare Guide</h2>
            <p class="welcome-subtitle">Your AI vehicle service & maintenance assistant</p>
          </div>
        </div>

        <p class="welcome-text">
          I am designed to help car owners understand dashboard warning lights, service intervals, maintenance guidelines, and emergency safety procedures.
        </p>

        <!-- HCAI Limitation Disclaimer -->
        <div class="limitation-banner" role="note" aria-label="Limitation Notice">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>
            <strong>Informational Assistant Only:</strong> I can explain maintenance policies and warning guidance, but I cannot physically inspect, diagnose, or repair a vehicle. For physical diagnoses, consult a certified technician.
          </span>
        </div>

        <!-- HCAI Possibilities Before First Prompt -->
        <div class="suggestions-section">
          <h3 class="suggestions-title">Common questions you can ask:</h3>
          <div class="suggestions-grid">
            <button 
              *ngFor="let q of suggestedQuestions" 
              type="button" 
              class="chip-button btn-interactive min-touch-target" 
              (click)="onSelectQuestion(q.text)"
              [attr.aria-label]="'Ask question: ' + q.text">
              <span class="chip-icon" aria-hidden="true">{{ q.icon }}</span>
              <span class="chip-text">{{ q.text }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .welcome-container {
      margin: 1.25rem auto;
      max-width: 760px;
      padding: 0 0.5rem;
    }
    .welcome-card {
      padding: 1.75rem;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
    }
    .welcome-header {
      display: flex;
      align-items: center;
      gap: 1.125rem;
      margin-bottom: 1.125rem;
    }
    .assistant-avatar {
      font-size: 1.75rem;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ede9fe 0%, #c4b5fd 50%, #a78bfa 100%);
      border: 2px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 8px 20px rgba(139, 92, 246, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .welcome-title-group {
      display: flex;
      flex-direction: column;
    }
    .welcome-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--color-navy);
      margin: 0;
      letter-spacing: -0.02em;
    }
    .welcome-subtitle {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      margin: 0.25rem 0 0 0;
      font-weight: 500;
    }
    .welcome-text {
      font-size: 0.9375rem;
      color: var(--color-text-main);
      line-height: 1.55;
      margin: 0 0 1.25rem 0;
    }
    .limitation-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: var(--radius-md);
      padding: 0.875rem 1.125rem;
      font-size: 0.8125rem;
      color: #92400e;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }
    .limitation-banner svg {
      flex-shrink: 0;
      margin-top: 2px;
      color: var(--color-warning);
    }
    .suggestions-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--color-navy);
      margin: 0 0 0.875rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.75rem;
    }
    .chip-button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: var(--color-navy);
      font-size: 0.875rem;
      font-weight: 600;
      text-align: left;
      width: 100%;
      box-shadow: var(--shadow-sm);
    }
    .chip-button:hover {
      background: rgba(255, 255, 255, 0.98);
      border-color: var(--color-accent-purple);
      color: var(--color-primary);
    }
    .chip-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }
    .chip-text {
      line-height: 1.4;
    }
    @media (max-width: 640px) {
      .welcome-card {
        padding: 1.25rem;
      }
      .suggestions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WelcomeComponent {
  @Output() selectQuestion = new EventEmitter<string>();

  suggestedQuestions: SuggestedQuestion[] = [
    { category: 'Warning Light', icon: '🚨', text: 'What does the orange check-engine light mean?' },
    { category: 'Servicing', icon: '🔧', text: 'How often should I service my car?' },
    { category: 'Air Conditioning', icon: '❄️', text: 'Why is my air conditioner not cooling?' },
    { category: 'Tyres', icon: '🛞', text: 'How often should I check tyre pressure?' },
    { category: 'Complaints', icon: '💬', text: 'What should I do if I was charged for work I did not approve?' }
  ];

  onSelectQuestion(text: string) {
    this.selectQuestion.emit(text);
  }
}
