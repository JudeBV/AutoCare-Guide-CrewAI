import { Component, ElementRef, ViewChild, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChatMessage, AutoCareResponse } from './models/chat.models';
import { ChatService } from './services/chat.service';
import { HeaderComponent } from './components/header/header.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { ChatMessageComponent } from './components/chat-message/chat-message.component';
import { ChatInputComponent } from './components/chat-input/chat-input.component';
import { EscalationModalComponent } from './components/escalation-modal/escalation-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    WelcomeComponent,
    ChatMessageComponent,
    ChatInputComponent,
    EscalationModalComponent
  ],
  template: `
    <div class="app-viewport">
      <div class="app-layout glass-surface">
        <!-- Header -->
        <app-header (clearChat)="onClearChat()"></app-header>

        <!-- Main Chat Area -->
        <main class="chat-main" #chatScrollContainer role="log" aria-live="polite" aria-label="Conversation Log">
          
          <!-- Welcome Section (Shown when no messages exist) -->
          <app-welcome 
            *ngIf="messages.length === 0" 
            (selectQuestion)="handleSendMessage($event)">
          </app-welcome>

          <!-- Conversation History -->
          <div class="messages-list" *ngIf="messages.length > 0">
            <app-chat-message
              *ngFor="let msg of messages"
              [message]="msg"
              (resendMessage)="handleResendMessage($event)"
              (retryMessage)="handleRetryMessage($event)"
              (triggerClarification)="handleClarificationRequest()"
              (triggerHumanSupport)="openEscalationModal('Customer Support')">
            </app-chat-message>

            <!-- Loading / Processing Indicator -->
            <div *ngIf="isLoading" class="typing-indicator-row animate-message-appear" role="status" aria-label="AutoCare Guide is checking your question">
              <div class="assistant-avatar-col" aria-hidden="true">
                <div class="avatar-badge">🤖</div>
              </div>
              <div class="typing-bubble">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-text">AutoCare Guide is analyzing vehicle guidelines...</span>
              </div>
            </div>
          </div>
        </main>

        <!-- Message Input Bar -->
        <app-chat-input
          [isLoading]="isLoading"
          (sendMessage)="handleSendMessage($event)"
          (stopProcessing)="handleStopProcessing()">
        </app-chat-input>

        <!-- Escalation Confirmation Modal -->
        <app-escalation-modal
          [isOpen]="isEscalationModalOpen"
          [targetDestination]="escalationTarget"
          (confirm)="confirmEscalation()"
          (cancel)="closeEscalationModal()">
        </app-escalation-modal>
      </div>
    </div>
  `,
  styles: [`
    .app-viewport {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      width: 100%;
      padding: 1.25rem;
      position: relative;
      z-index: 1;
    }
    .app-layout {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 2.5rem);
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      border-radius: var(--radius-xl);
      overflow: hidden;
      position: relative;
    }
    .chat-main {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem 1rem;
      scroll-behavior: smooth;
    }
    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .typing-indicator-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0 0.5rem;
      margin-bottom: 1.25rem;
    }
    .assistant-avatar-col {
      flex-shrink: 0;
    }
    .avatar-badge {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
      border: 1px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
    }
    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      padding: 0.75rem 1.125rem;
      border-radius: 20px 20px 20px 4px;
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      font-weight: 500;
      box-shadow: var(--shadow-sm);
    }
    .typing-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: var(--color-primary);
      display: inline-block;
      animation: typingBounce 1.4s infinite ease-in-out;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }

    @media (max-width: 768px) {
      .app-viewport {
        padding: 0;
        min-height: 100vh;
      }
      .app-layout {
        height: 100vh;
        border-radius: 0;
        border: none;
      }
      .chat-main {
        padding: 1rem 0.75rem;
      }
    }
  `]
})
export class AppComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

  messages: ChatMessage[] = [];
  isLoading = false;
  isEscalationModalOpen = false;
  escalationTarget = 'Customer Support';

  private activeSubscription?: Subscription;

  constructor(private chatService: ChatService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.activeSubscription?.unsubscribe();
  }

  private scrollToBottom(): void {
    try {
      if (this.chatScrollContainer) {
        this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  handleSendMessage(text: string): void {
    if (!text.trim() || this.isLoading) return;

    // Push User Message
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date()
    };
    this.messages.push(userMsg);
    this.isLoading = true;

    // Call Live FastAPI Chat Service
    this.activeSubscription = this.chatService.sendMessage(text.trim()).subscribe({
      next: (response: AutoCareResponse) => {
        this.isLoading = false;
        const assistantMsg: ChatMessage = {
          id: 'msg-' + (Date.now() + 1),
          sender: 'assistant',
          text: response.response,
          timestamp: new Date(),
          responseData: response
        };
        this.messages.push(assistantMsg);

        // Check if response suggests escalation
        if (response.decision === 'ESCALATE_SUPPORT' || response.decision === 'ESCALATE_SERVICE') {
          this.openEscalationModal(response.escalation_destination || 'Customer Support');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        const errorMsg: ChatMessage = {
          id: 'msg-' + (Date.now() + 1),
          sender: 'assistant',
          text: err?.message || 'AutoCare Guide is temporarily unavailable. Please try again.',
          timestamp: new Date(),
          isError: true,
          originalQuery: text.trim()
        };
        this.messages.push(errorMsg);
      }
    });
  }

  handleResendMessage(event: { id: string; newText: string }): void {
    const idx = this.messages.findIndex(m => m.id === event.id);
    if (idx !== -1) {
      // Truncate message chain after edited message
      this.messages = this.messages.slice(0, idx);
      this.handleSendMessage(event.newText);
    }
  }

  handleRetryMessage(query: string): void {
    // Remove trailing error message if present
    if (this.messages.length > 0 && this.messages[this.messages.length - 1].isError) {
      this.messages.pop();
    }
    // Remove previous user message if same query
    if (this.messages.length > 0 && this.messages[this.messages.length - 1].text === query) {
      this.messages.pop();
    }
    this.handleSendMessage(query);
  }

  handleStopProcessing(): void {
    if (this.isLoading) {
      this.activeSubscription?.unsubscribe();
      this.isLoading = false;
      const cancelledMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        sender: 'assistant',
        text: 'Request processing was stopped by user.',
        timestamp: new Date()
      };
      this.messages.push(cancelledMsg);
    }
  }

  onClearChat(): void {
    this.activeSubscription?.unsubscribe();
    this.isLoading = false;
    this.messages = [];
  }

  handleClarificationRequest(): void {
    this.handleSendMessage('Could you please clarify what details you need about my car issue?');
  }

  openEscalationModal(target: string): void {
    this.escalationTarget = target;
    this.isEscalationModalOpen = true;
  }

  closeEscalationModal(): void {
    this.isEscalationModalOpen = false;
  }

  confirmEscalation(): void {
    this.isEscalationModalOpen = false;
    const confirmMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      text: `[ESCALATION CONFIRMED] Your query has been forwarded to our ${this.escalationTarget} team. Ticket #${Math.floor(100000 + Math.random() * 900000)} created.`,
      timestamp: new Date()
    };
    this.messages.push(confirmMsg);
  }
}
