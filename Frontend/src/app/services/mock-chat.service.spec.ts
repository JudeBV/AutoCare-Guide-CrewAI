import { TestBed } from '@angular/core/testing';
import { MockChatService } from './mock-chat.service';

describe('MockChatService', () => {
  let service: MockChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return AC-FAQ-001 mock response for check-engine light query', (done) => {
    service.sendMessage('What does the orange check-engine light mean?').subscribe(response => {
      expect(response.decision).toBe('ANSWER');
      expect(response.category).toBe('Dashboard Warning Lights');
      expect(response.confidence_level).toBe('HIGH');
      expect(response.matched_faq_ids).toContain('AC-FAQ-001');
      expect(response.escalation_destination).toBeNull();
      done();
    });
  });

  it('should return ESCALATE_EMERGENCY for soft brake pedal query', (done) => {
    service.sendMessage('My brake pedal feels soft and spongy').subscribe(response => {
      expect(response.decision).toBe('ESCALATE_EMERGENCY');
      expect(response.category).toBe('Brakes and Safety');
      expect(response.escalation_destination).toBe('emergency_services');
      done();
    });
  });

  it('should return CLARIFY for vague strange noise query', (done) => {
    service.sendMessage('My car is making a strange noise.').subscribe(response => {
      expect(response.decision).toBe('CLARIFY');
      expect(response.confidence_level).toBe('LOW');
      expect(response.matched_faq_ids).toEqual([]);
      done();
    });
  });
});
