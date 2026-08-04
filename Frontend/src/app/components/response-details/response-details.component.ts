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
        class="details-toggle btn-interactive min-touch-target" 
        (click)="isExpanded = !isExpanded"
        [attr.aria-expanded]="isExpanded"
        aria-label="Toggle response explanation details">
        <span class="toggle-left">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
          stroke-width="2.2" 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          aria-hidden="true">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <div class="details-content-wrapper" [class.content-expanded]="isExpanded" role="region" aria-label="Response Explanation">
        <div class="details-content glass-card">
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Decision Type:</span>
              <span class="meta-value badge animate-badge-glow" [ngClass]="getDecisionClass(response.decision)">{{ response.decision }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">Confidence Level:</span>
              <span class="meta-value badge animate-badge-glow" [ngClass]="getConfidenceClass(response.confidence_level)">{{ response.confidence_level }}</span>
            </div>

            <div class="meta-item" *ngIf="response.category">
              <span class="meta-label">Category:</span>
              <span class="meta-value">{{ response.category }}</span>
            </div>

            <div class="meta-item" *ngIf="response.matched_faq_ids && response.matched_faq_ids.length > 0">
              <span class="meta-label">Matched FAQ Source:</span>
              <div class="faq-tags-wrap">
                <span class="meta-value faq-tag" *ngFor="let id of response.matched_faq_ids">{{ id }}</span>
              </div>
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
                <strong>{{ item.source }}:</strong> {{ item.insight }} <span class="reason-note">(Reason: {{ item.reason }})</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .details-accordion {
      margin-top: 0.875rem;
      border-top: 1px dashed var(--color-border);
      padding-top: 0.625rem;
    }
    .details-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0.4rem 0.625rem;
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: background var(--motion-fast), color var(--motion-fast);
    }
    .details-toggle:hover {
      background: rgba(139, 92, 246, 0.08);
      color: var(--color-primary);
    }
    .toggle-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .chevron {
      transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .chevron-open {
      transform: rotate(180deg);
    }
    
    /* Smooth CSS Height & Opacity Transition */
    .details-content-wrapper {
      display: grid;
      grid-template-rows: 0fr;
      opacity: 0;
      transition: grid-template-rows 220ms ease-out, opacity 200ms ease-out;
      overflow: hidden;
    }
    .details-content-wrapper.content-expanded {
      grid-template-rows: 1fr;
      opacity: 1;
      margin-top: 0.625rem;
    }
    .details-content {
      min-height: 0;
      padding: 0.875rem;
      background: rgba(248, 250, 252, 0.85);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .meta-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-weight: 600;
    }
    .meta-value {
      font-weight: 700;
      color: var(--color-navy);
    }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.625rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      width: fit-content;
      font-weight: 800;
    }
    .badge-answer { background: #dcfce7; color: #166534; }
    .badge-emergency { background: #fee2e2; color: #991b1b; }
    .badge-clarify { background: #e0f2fe; color: #075985; }
    .badge-refuse { background: #fef3c7; color: #92400e; }
    .badge-high { background: #dcfce7; color: #166534; }
    .badge-low { background: #fef3c7; color: #92400e; }
    .badge-contradictory { background: #fee2e2; color: #991b1b; }
    .faq-tags-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    .faq-tag {
      background: #e2e8f0;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.75rem;
      color: var(--color-navy);
    }
    .evidence-section {
      margin-top: 0.875rem;
      border-top: 1px dashed var(--color-border);
      padding-top: 0.625rem;
    }
    .evidence-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-muted);
      margin: 0 0 0.375rem 0;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .evidence-list {
      margin: 0;
      padding-left: 1.25rem;
      color: var(--color-text-main);
      line-height: 1.5;
    }
    .evidence-list li {
      margin-bottom: 0.375rem;
    }
    .reason-note {
      color: var(--color-text-muted);
      font-style: italic;
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
