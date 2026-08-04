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
      class="message-row animate-message-appear" 
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
              <button type="button" class="btn-sm btn-save btn-interactive" (click)="saveEdit()">Resend</button>
              <button type="button" class="btn-sm btn-cancel btn-interactive" (click)="cancelEdit()">Cancel</button>
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
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
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
                class="retry-btn btn-interactive min-touch-target" 
                (click)="onRetryClick()">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <span>Retry Question</span>
              </button>
            </div>

            <ng-container *ngIf="!message.isError">
              <!-- Emergency Safety Banner -->
              <div *ngIf="isEmergency()" class="emergency-banner animate-badge-glow" role="alert" aria-live="assertive">
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
              <div *ngIf="isComplaint()" class="complaint-banner animate-badge-glow" role="status">
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

              <!-- Prominent LOW or CONTRADICTORY Confidence Alert -->
              <div *ngIf="isLowOrContradictoryConfidence()" class="confidence-alert animate-badge-glow" role="status">
                <div class="confidence-header">
                  <span class="alert-icon">⚠️</span>
                  <span>Uncertain Diagnostic Confidence ({{ message.responseData?.confidence_level }})</span>
                </div>
                <p class="confidence-body">
                  Essential diagnostic details are missing or contradictory. Please do not rely on this output without verification.
                </p>
                <div class="confidence-actions">
                  <button type="button" class="action-btn btn-interactive min-touch-target" (click)="onClarificationRequest()">Ask for clarification</button>
                  <button type="button" class="action-btn action-btn-secondary btn-interactive min-touch-target" (click)="onHumanSupportRequest()">Request human support</button>
                </div>
              </div>

              <!-- Standard Informational Badge -->
              <div class="disclaimer-badge" *ngIf="isInformational()">
                ✨ AutoCare Maintenance Guide
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
                  <div class="feedback-buttons">
                    <button 
                      type="button" 
                      class="feedback-btn btn-interactive min-touch-target" 
                      (click)="submitFeedback('helpful')"
                      aria-label="Mark response as helpful">
                      👍 Yes
                    </button>
                    <button 
                      type="button" 
                      class="feedback-btn btn-interactive min-touch-target" 
                      (click)="submitFeedback('unhelpful')"
                      aria-label="Mark response as not helpful">
                      👎 No
                    </button>
                  </div>
                </div>

                <!-- Unhelpful Reason Options -->
                <div *ngIf="message.feedback === 'unhelpful' && !message.feedbackAcknowledged" class="reason-selector animate-message-appear">
                  <p class="reason-title">What best describes the issue?</p>
                  <div class="reason-chips">
                    <button 
                      *ngFor="let reason of availableReasons"
                      type="button" 
                      class="reason-chip btn-interactive min-touch-target"
                      [class.selected]="selectedReasons.includes(reason)"
                      (click)="toggleReason(reason)">
                      {{ reason }}
                    </button>
                  </div>
                  <button type="button" class="btn-sm btn-save btn-interactive min-touch-target" (click)="confirmFeedbackReasons()">Submit feedback</button>
                </div>

                <!-- Feedback Acknowledgment -->
                <div *ngIf="message.feedbackAcknowledged || message.feedback === 'helpful'" class="feedback-ack" role="status">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
  styles: []
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
