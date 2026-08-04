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
    <section class="welcome-container" aria-labelledby="welcome-heading">
      <div class="welcome-card">
        <div class="welcome-header">
          <div class="assistant-avatar" aria-hidden="true">🚗</div>
          <div>
            <h2 id="welcome-heading" class="welcome-title">Welcome to AutoCare Guide</h2>
            <p class="welcome-subtitle">Your AI automobile service and maintenance assistant</p>
          </div>
        </div>

        <p class="welcome-text">
          I am designed to help car owners understand dashboard warning lights, service intervals, maintenance guidelines, and emergency safety procedures.
        </p>

        <!-- HCAI Limitation Disclaimer -->
        <div class="limitation-banner" role="note" aria-label="Limitation Notice">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
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
              class="chip-button" 
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
      margin: 1.5rem auto;
      max-width: 720px;
      padding: 0 1rem;
    }
    .welcome-card {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 14px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }
    .welcome-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .assistant-avatar {
      font-size: 2rem;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background-color: rgba(2, 132, 199, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .welcome-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-navy);
      margin: 0;
    }
    .welcome-subtitle {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      margin: 0.25rem 0 0 0;
    }
    .welcome-text {
      font-size: 0.9375rem;
      color: var(--color-text-main);
      line-height: 1.5;
      margin: 0 0 1rem 0;
    }
    .limitation-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background-color: rgba(217, 119, 6, 0.08);
      border: 1px solid rgba(217, 119, 6, 0.25);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.8125rem;
      color: #92400e;
      margin-bottom: 1.5rem;
      line-height: 1.45;
    }
    .limitation-banner svg {
      flex-shrink: 0;
      margin-top: 1px;
      color: var(--color-warning);
    }
    .suggestions-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-navy);
      margin: 0 0 0.75rem 0;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 0.625rem;
    }
    .chip-button {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 0.875rem;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      background-color: #f8fafc;
      color: var(--color-navy);
      font-size: 0.875rem;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .chip-button:hover {
      background-color: rgba(2, 132, 199, 0.08);
      border-color: var(--color-primary);
      transform: translateY(-1px);
    }
    .chip-button:focus-visible {
      outline: 3px solid var(--color-primary);
    }
    .chip-icon {
      font-size: 1.125rem;
    }
    .chip-text {
      line-height: 1.35;
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
