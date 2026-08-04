import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ChatService } from './chat.service';
import { AutoCareResponse } from '../models/chat.models';
import { environment } from '../../environments/environment';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChatService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send POST request to environment.apiUrl with message body', () => {
    const mockResponse: AutoCareResponse = {
      decision: 'ANSWER',
      category: 'Dashboard Warning Lights',
      confidence_level: 'HIGH',
      matched_faq_ids: ['AC-FAQ-001'],
      evidence: [],
      assumptions: [],
      conflicts: [],
      escalation_destination: null,
      reason: 'Direct match',
      response: 'Orange check engine light guidance'
    };

    service.sendMessage('What does the orange check-engine light mean?').subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const expectedUrl = environment.apiUrl.endsWith('/chat')
      ? environment.apiUrl
      : `${environment.apiUrl.replace(/\/+$/, '')}/chat`;
    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ message: 'What does the orange check-engine light mean?' });
    req.flush(mockResponse);
  });
});
