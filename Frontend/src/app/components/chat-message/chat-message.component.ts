import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '../../models/chat.models';
import { ResponseDetailsComponent } from '../response-details/response-details.component';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule, FormsModule, ResponseDetailsComponent],
  template: `
    <article 
      class="message-row" 
      [class.user-row]="message.sender === 'user'" 
      [class.assistant-row]="message.sender === 'assistant'"
      [attr.aria-label]="message.sender === 'user' ? 'User message' : 'Assistant message'">
      
      <!-- User Message -->
      <ng-container *ngIf="message.sender === 'user'">
        <div class="user-bubble">
          <div *ngIf="!isEditingText" class="message-text">{{ message.text }}</div>
          
          <!-- Edit Form -->
          <div *ngIf="isEditingText" class="edit-box">
            <textarea 
              [(ngModel)]="editText" 
              class="edit-textarea" 
              rows="2"
              aria-label="Edit your message text">
            </textarea>
            <div class="edit-actions">
              <button type="button" class="btn-sm btn-save" (click)="saveEdit()">Resend</button>
              <button type="button" class="btn-sm btn-cancel" (click)="cancelEdit()">Cancel</button>
            </div>
          </div>

          <div class="bubble-footer">
            <span class="message-time">{{ message.timestamp | date:'shortTime' }}</span>
            <button 
              *ngIf="!isEditingText"
              type="button" 
              class="edit-btn" 
              (click)="startEdit()"
              aria-label="Edit and resend message"
              title="Edit and resend">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Edit</span>
            </button>
          </div>
        </div>
      </ng-container>

      <!-- Assistant Message -->
      <ng-container *ngIf="message.sender === 'assistant'">
        <div class="assistant-avatar-col" aria-hidden="true">
          <div class="avatar-badge" [class.avatar-error]="message.isError">
            {{ message.isError ? '⚠️' : '🤖' }}
          </div>
        </div>

        <div class="assistant-bubble-wrap">
          <div class="assistant-bubble" [ngClass]="getBubbleClass()">
            
            <!-- Network Failure / API Unavailable Error State -->
            <div *ngIf="message.isError" class="error-banner" role="alert">
              <div class="error-header">
                <span class="error-title">Connection Error</span>
              </div>
              <p class="error-text">{{ message.text }}</p>
              <button 
                *ngIf="message.originalQuery" 
                type="button" 
                class="retry-btn" 
                (click)="onRetryClick()">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <span>Retry</span>
              </button>
            </div>

            <ng-container *ngIf="!message.isError">
              <!-- Emergency Safety Banner -->
              <div *ngIf="isEmergency()" class="emergency-banner" role="alert" aria-live="assertive">
                <div class="emergency-header">
                  <span class="emergency-icon">🚨</span>
                  <span class="emergency-title">IMMEDIATE SAFETY ACTION REQUIRED</span>
                </div>
                <p class="emergency-instruction">
                  Please safely pull over to the side of the road, turn off your engine, and do not attempt to drive further.
                </p>
                <div class="emergency-dest" *ngIf="message.responseData?.escalation_destination">
                  <span>Escalated to: <strong>{{ message.responseData?.escalation_destination | uppercase }}</strong></span>
                </div>
                <div class="emergency-disclaimer">
                  Note: This chatbot cannot directly dispatch emergency services or roadside assistance. Please contact local emergency services or roadside recovery directly.
                </div>
              </div>

              <!-- Complaint & Support Banner -->
              <div *ngIf="isComplaint()" class="complaint-banner" role="status">
                <span class="complaint-icon">🤝</span>
                <span class="complaint-title">Customer Support & Complaint Assistance</span>
              </div>

              <!-- Refusal Warning Banner -->
              <div *ngIf="isRefusal()" class="refusal-banner" role="status">
                <span class="refusal-icon">🛡️</span>
                <span class="refusal-title">Policy & Safety Refusal</span>
              </div>

              <!-- Out of Scope Guidance Banner -->
              <div *ngIf="isOutOfScope()" class="scope-banner" role="status">
                <span class="scope-icon">ℹ️</span>
                <span class="scope-title">Out of Scope Guidance</span>
              </div>

              <!-- Prominent LOW or CONTRADICTORY Confidence Alert (Only for Diagnostic Queries) -->
              <div *ngIf="isLowOrContradictoryConfidence()" class="confidence-alert" role="status">
                <div class="confidence-header">
                  <span class="alert-icon">⚠️</span>
                  <span>Uncertain Diagnostic Confidence ({{ message.responseData?.confidence_level }})</span>
                </div>
                <p class="confidence-body">
                  Essential diagnostic details are missing or contradictory. Please do not rely on this output without verification.
                </p>
                <div class="confidence-actions">
                  <button type="button" class="action-btn" (click)="onClarificationRequest()">Ask for clarification</button>
                  <button type="button" class="action-btn action-btn-secondary" (click)="onHumanSupportRequest()">Request human support</button>
                </div>
              </div>

              <!-- Standard Informational Badge -->
              <div class="disclaimer-badge" *ngIf="isInformational()">
                ℹ️ Informational Summary — AutoCare Maintenance Guide
              </div>

              <!-- Response Text -->
              <div class="message-text">{{ message.text }}</div>

              <!-- Collapsible HCAI Response Details -->
              <app-response-details 
                *ngIf="message.responseData" 
                [response]="message.responseData">
              </app-response-details>

              <!-- HCAI Feedback Loop -->
              <div class="feedback-container">
                <div *ngIf="!message.feedback" class="feedback-prompt">
                  <span class="feedback-label">Was this answer helpful?</span>
                  <button 
                    type="button" 
                    class="feedback-btn" 
                    (click)="submitFeedback('helpful')"
                    aria-label="Mark response as helpful">
                    👍 Yes
                  </button>
                  <button 
                    type="button" 
                    class="feedback-btn" 
                    (click)="submitFeedback('unhelpful')"
                    aria-label="Mark response as not helpful">
                    👎 No
                  </button>
                </div>

                <!-- Unhelpful Reason Options -->
                <div *ngIf="message.feedback === 'unhelpful' && !message.feedbackAcknowledged" class="reason-selector">
                  <p class="reason-title">What best describes the issue?</p>
                  <div class="reason-chips">
                    <button 
                      *ngFor="let reason of availableReasons"
                      type="button" 
                      class="reason-chip"
                      [class.selected]="selectedReasons.includes(reason)"
                      (click)="toggleReason(reason)">
                      {{ reason }}
                    </button>
                  </div>
                  <button type="button" class="btn-sm btn-save" (click)="confirmFeedbackReasons()">Submit feedback</button>
                </div>

                <!-- Feedback Acknowledgment -->
                <div *ngIf="message.feedbackAcknowledged || message.feedback === 'helpful'" class="feedback-ack" role="status">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Thank you for your feedback! This helps us improve AutoCare Guide.</span>
                </div>
              </div>
            </ng-container>

            <!-- Time Stamp -->
            <div class="bubble-footer">
              <span class="message-time">{{ message.timestamp | date:'shortTime' }}</span>
            </div>

          </div>
        </div>
      </ng-container>

    </article>
  `,
  styles: [`
    .message-row {
      display: flex;
      margin-bottom: 1.25rem;
      padding: 0 1rem;
    }
    .user-row {
      justify-content: flex-end;
    }
    .assistant-row {
      justify-content: flex-start;
      gap: 0.75rem;
    }
    .user-bubble {
      max-width: 75%;
      background-color: var(--color-navy);
      color: white;
      border-radius: 16px 16px 4px 16px;
      padding: 0.875rem 1.125rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }
    .assistant-avatar-col {
      flex-shrink: 0;
      margin-top: 2px;
    }
    .avatar-badge {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: rgba(2, 132, 199, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
    }
    .avatar-error {
      background-color: #fee2e2;
    }
    .assistant-bubble-wrap {
      max-width: 80%;
    }
    .assistant-bubble {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 16px 16px 16px 4px;
      padding: 1rem 1.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .bubble-emergency {
      border-left: 5px solid var(--color-danger);
      background-color: #fff5f5;
    }
    .bubble-refuse {
      border-left: 5px solid var(--color-warning);
      background-color: #fffbeb;
    }
    .bubble-complaint {
      border-left: 5px solid #0284c7;
      background-color: #f0f9ff;
    }
    .bubble-clarify {
      border-left: 5px solid var(--color-primary);
      background-color: #f0f9ff;
    }
    .bubble-error {
      border-left: 5px solid var(--color-danger);
      background-color: #fff5f5;
    }
    .complaint-banner {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-weight: 700;
      font-size: 0.875rem;
      color: #0369a1;
      margin-bottom: 0.5rem;
    }
    .scope-banner {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-weight: 700;
      font-size: 0.875rem;
      color: #475569;
      margin-bottom: 0.5rem;
    }
    .bubble-scope {
      border-left: 5px solid var(--color-text-muted);
      background-color: #f8fafc;
    }
    .error-banner {
      color: #991b1b;
    }
    .error-header {
      font-weight: 700;
      font-size: 0.9375rem;
      margin-bottom: 0.375rem;
      color: var(--color-danger);
    }
    .error-text {
      font-size: 0.875rem;
      margin: 0 0 0.75rem 0;
      line-height: 1.4;
    }
    .retry-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      border: 1px solid var(--color-danger);
      background-color: white;
      color: var(--color-danger);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .retry-btn:hover {
      background-color: var(--color-danger);
      color: white;
    }
    .emergency-banner {
      background-color: #fee2e2;
      border: 1px solid #fca5a5;
      border-radius: 10px;
      padding: 1rem;
      margin-bottom: 0.875rem;
      color: #7f1d1d;
    }
    .emergency-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 0.9375rem;
      margin-bottom: 0.5rem;
      color: var(--color-danger);
    }
    .emergency-instruction {
      font-weight: 600;
      font-size: 0.9375rem;
      line-height: 1.4;
      margin: 0 0 0.5rem 0;
    }
    .emergency-dest {
      font-size: 0.8125rem;
      background-color: rgba(220, 38, 38, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 0.5rem;
    }
    .emergency-disclaimer {
      font-size: 0.75rem;
      color: #991b1b;
      font-style: italic;
      line-height: 1.35;
    }
    .refusal-banner {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-weight: 700;
      font-size: 0.875rem;
      color: #92400e;
      margin-bottom: 0.5rem;
    }
    .confidence-alert {
      background-color: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.75rem;
      color: #78350f;
    }
    .confidence-header {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-weight: 700;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }
    .confidence-body {
      font-size: 0.8125rem;
      margin: 0 0 0.5rem 0;
    }
    .confidence-actions {
      display: flex;
      gap: 0.5rem;
    }
    .action-btn {
      padding: 0.25rem 0.625rem;
      border-radius: 6px;
      border: 1px solid #d97706;
      background-color: #d97706;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
    .action-btn-secondary {
      background-color: transparent;
      color: #78350f;
    }
    .disclaimer-badge {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      background-color: #f1f5f9;
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      width: fit-content;
      margin-bottom: 0.75rem;
    }
    .message-text {
      font-size: 0.9375rem;
      line-height: 1.5;
      color: var(--color-text-main);
      white-space: pre-wrap;
    }
    .user-bubble .message-text {
      color: white;
    }
    .edit-box {
      margin-bottom: 0.5rem;
    }
    .edit-textarea {
      width: 100%;
      padding: 0.5rem;
      border-radius: 6px;
      border: 1px solid var(--color-primary);
      font-family: inherit;
      font-size: 0.875rem;
      resize: vertical;
    }
    .edit-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.375rem;
    }
    .btn-sm {
      padding: 0.25rem 0.625rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      border: none;
    }
    .btn-save { background-color: var(--color-primary); color: white; }
    .btn-cancel { background-color: #e2e8f0; color: var(--color-navy); }
    .bubble-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.375rem;
    }
    .message-time {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
    }
    .user-bubble .message-time {
      color: rgba(255, 255, 255, 0.75);
    }
    .edit-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.6875rem;
      cursor: pointer;
      padding: 0;
    }
    .edit-btn:hover { color: white; }
    .feedback-container {
      margin-top: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px dashed var(--color-border);
    }
    .feedback-prompt {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }
    .feedback-btn {
      padding: 0.125rem 0.5rem;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      background-color: var(--color-surface);
      font-size: 0.75rem;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .feedback-btn:hover { background-color: #f1f5f9; }
    .reason-selector {
      margin-top: 0.5rem;
      background-color: #f8fafc;
      padding: 0.625rem;
      border-radius: 8px;
      border: 1px solid var(--color-border);
    }
    .reason-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-navy);
      margin: 0 0 0.375rem 0;
    }
    .reason-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-bottom: 0.5rem;
    }
    .reason-chip {
      padding: 0.25rem 0.5rem;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      background-color: white;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .reason-chip.selected {
      background-color: rgba(2, 132, 199, 0.15);
      border-color: var(--color-primary);
      color: var(--color-primary);
      font-weight: 600;
    }
    .feedback-ack {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--color-success);
    }
  `]
})
export class ChatMessageComponent {
  @Input() message!: ChatMessage;
  @Output() resendMessage = new EventEmitter<{ id: string; newText: string }>();
  @Output() triggerClarification = new EventEmitter<void>();
  @Output() triggerHumanSupport = new EventEmitter<void>();
  @Output() retryMessage = new EventEmitter<string>();

  isEditingText = false;
  editText = '';
  availableReasons = ['Inaccurate', 'Unclear', 'Incomplete', 'Unsafe'];
  selectedReasons: string[] = [];

  startEdit() {
    this.isEditingText = true;
    this.editText = this.message.text;
  }

  saveEdit() {
    if (this.editText.trim()) {
      this.resendMessage.emit({ id: this.message.id, newText: this.editText.trim() });
      this.isEditingText = false;
    }
  }

  cancelEdit() {
    this.isEditingText = false;
  }

  getRequestType(): string {
    return this.message.responseData?.request_type || '';
  }

  isInformational(): boolean {
    return this.getRequestType() === 'INFORMATIONAL';
  }

  isComplaint(): boolean {
    return this.getRequestType() === 'COMPLAINT' || this.message.responseData?.decision === 'ESCALATE_SUPPORT';
  }

  isEmergency(): boolean {
    return this.getRequestType() === 'EMERGENCY' || this.message.responseData?.decision === 'ESCALATE_EMERGENCY';
  }

  isRefusal(): boolean {
    const req = this.getRequestType();
    const decision = this.message.responseData?.decision;
    return ['UNSAFE_REQUEST', 'ILLEGAL_REQUEST', 'SECURITY_OR_PROMPT_INJECTION'].includes(req) || !!(decision?.startsWith('REFUSE_'));
  }

  isOutOfScope(): boolean {
    return this.getRequestType() === 'OUT_OF_SCOPE' || this.message.responseData?.decision === 'OUT_OF_SCOPE';
  }

  isLowOrContradictoryConfidence(): boolean {
    const conf = this.message.responseData?.confidence_level;
    const reqType = this.getRequestType();
    // Do NOT display "Uncertain Diagnostic Confidence" for informational questions or complaints that do not request a diagnosis
    if (reqType === 'INFORMATIONAL' || reqType === 'COMPLAINT' || reqType === 'OUT_OF_SCOPE' || this.isComplaint()) {
      return false;
    }
    return conf === 'LOW' || conf === 'CONTRADICTORY';
  }

  getBubbleClass(): string {
    if (this.message.isError) return 'bubble-error';
    const decision = this.message.responseData?.decision;
    if (this.isEmergency()) return 'bubble-emergency';
    if (this.isRefusal()) return 'bubble-refuse';
    if (this.isComplaint()) return 'bubble-complaint';
    if (decision === 'CLARIFY') return 'bubble-clarify';
    if (this.isOutOfScope()) return 'bubble-scope';
    return '';
  }

  submitFeedback(type: 'helpful' | 'unhelpful') {
    this.message.feedback = type;
    if (type === 'helpful') {
      this.message.feedbackAcknowledged = true;
    }
  }

  toggleReason(reason: string) {
    if (this.selectedReasons.includes(reason)) {
      this.selectedReasons = this.selectedReasons.filter(r => r !== reason);
    } else {
      this.selectedReasons.push(reason);
    }
  }

  confirmFeedbackReasons() {
    this.message.feedbackReasons = [...this.selectedReasons];
    this.message.feedbackAcknowledged = true;
  }

  onClarificationRequest() {
    this.triggerClarification.emit();
  }

  onHumanSupportRequest() {
    this.triggerHumanSupport.emit();
  }

  onRetryClick() {
    if (this.message.originalQuery) {
      this.retryMessage.emit(this.message.originalQuery);
    }
  }
}
