import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutoCareResponse } from '../../models/chat.models';

@Component({
  selector: 'app-response-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="details-accordion" *ngIf="response">
      <button 
        type="button" 
        class="details-toggle" 
        (click)="isExpanded = !isExpanded"
        [attr.aria-expanded]="isExpanded"
        aria-label="Toggle response explanation details">
        <span class="toggle-left">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span class="toggle-title">Why this answer? (Response details)</span>
        </span>
        <svg 
          class="chevron" 
          [class.chevron-open]="isExpanded"
          viewBox="0 0 24 24" 
          width="16" 
          height="16" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          aria-hidden="true">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <div class="details-content" *ngIf="isExpanded" role="region" aria-label="Response Explanation">
        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">Decision Type:</span>
            <span class="meta-value badge" [ngClass]="getDecisionClass(response.decision)">{{ response.decision }}</span>
          </div>

          <div class="meta-item">
            <span class="meta-label">Confidence Level:</span>
            <span class="meta-value badge" [ngClass]="getConfidenceClass(response.confidence_level)">{{ response.confidence_level }}</span>
          </div>

          <div class="meta-item" *ngIf="response.category">
            <span class="meta-label">Category:</span>
            <span class="meta-value">{{ response.category }}</span>
          </div>

          <div class="meta-item" *ngIf="response.matched_faq_ids && response.matched_faq_ids.length > 0">
            <span class="meta-label">Matched FAQ Source:</span>
            <span class="meta-value faq-tag" *ngFor="let id of response.matched_faq_ids">{{ id }}</span>
          </div>

          <div class="meta-item" *ngIf="response.escalation_destination">
            <span class="meta-label">Escalation Target:</span>
            <span class="meta-value highlight">{{ response.escalation_destination }}</span>
          </div>
        </div>

        <div class="evidence-section" *ngIf="response.evidence && response.evidence.length > 0">
          <h4 class="evidence-title">Evidence & Source Attribution:</h4>
          <ul class="evidence-list">
            <li *ngFor="let item of response.evidence">
              <strong>{{ item.source }}:</strong> {{ item.insight }} (<em>Reason: {{ item.reason }}</em>)
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .details-accordion {
      margin-top: 0.75rem;
      border-top: 1px border-subtle var(--color-border);
      padding-top: 0.5rem;
    }
    .details-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0.375rem 0.5rem;
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.15s ease;
    }
    .details-toggle:hover {
      background-color: rgba(0, 0, 0, 0.04);
      color: var(--color-navy);
    }
    .details-toggle:focus-visible {
      outline: 2px solid var(--color-primary);
    }
    .toggle-left {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    .chevron {
      transition: transform 0.2s ease;
    }
    .chevron-open {
      transform: rotate(180deg);
    }
    .details-content {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background-color: #f8fafc;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      font-size: 0.8125rem;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.625rem;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }
    .meta-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-weight: 500;
    }
    .meta-value {
      font-weight: 600;
      color: var(--color-navy);
    }
    .badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      width: fit-content;
    }
    .badge-answer { background-color: #dcfce7; color: #166534; }
    .badge-emergency { background-color: #fee2e2; color: #991b1b; }
    .badge-clarify { background-color: #e0f2fe; color: #075985; }
    .badge-refuse { background-color: #fef3c7; color: #92400e; }
    .badge-high { background-color: #dcfce7; color: #166534; }
    .badge-low { background-color: #fef3c7; color: #92400e; }
    .badge-contradictory { background-color: #fee2e2; color: #991b1b; }
    .faq-tag {
      background-color: #e2e8f0;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.75rem;
    }
    .evidence-section {
      margin-top: 0.75rem;
      border-top: 1px dashed var(--color-border);
      padding-top: 0.5rem;
    }
    .evidence-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
      margin: 0 0 0.25rem 0;
    }
    .evidence-list {
      margin: 0;
      padding-left: 1.25rem;
      color: var(--color-text-main);
    }
    .evidence-list li {
      margin-bottom: 0.25rem;
    }
  `]
})
export class ResponseDetailsComponent {
  @Input() response?: AutoCareResponse;
  isExpanded = false;

  getDecisionClass(decision: string): string {
    if (decision === 'ANSWER') return 'badge-answer';
    if (decision === 'ESCALATE_EMERGENCY') return 'badge-emergency';
    if (decision === 'CLARIFY') return 'badge-clarify';
    if (decision.startsWith('REFUSE_')) return 'badge-refuse';
    return '';
  }

  getConfidenceClass(confidence: string): string {
    if (confidence === 'HIGH') return 'badge-high';
    if (confidence === 'LOW') return 'badge-low';
    if (confidence === 'CONTRADICTORY') return 'badge-contradictory';
    return '';
  }
}
