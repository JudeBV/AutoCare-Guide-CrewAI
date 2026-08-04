import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AutoCareResponse } from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class MockChatService {

  public sendMessage(message: string): Observable<AutoCareResponse> {
    const msgLower = message.toLowerCase();
    let response: AutoCareResponse;

    if (msgLower.includes('check-engine') || msgLower.includes('check engine') || (msgLower.includes('orange') && msgLower.includes('light'))) {
      response = {
        decision: 'ANSWER',
        category: 'Dashboard Warning Lights',
        confidence_level: 'HIGH',
        matched_faq_ids: ['AC-FAQ-001'],
        evidence: [
          {
            insight: 'User is asking about a vehicle question matching AC-FAQ-001 (Dashboard Warning Lights).',
            evidence_type: 'FACT',
            confidence_level: 'HIGH',
            source: 'User message and AC-FAQ-001',
            reason: 'The user\'s question directly matches the approved FAQ dataset.',
            review_guidance: 'No additional review is required for the general FAQ response.'
          }
        ],
        assumptions: [],
        conflicts: [],
        escalation_destination: null,
        reason: 'Standard informational vehicle maintenance query.',
        response: 'Based on AutoCare policy [AC-FAQ-001]: The orange check-engine light indicates that the vehicle has detected a possible engine, emission, fuel, ignition or sensor-related problem. If the light remains steady and the vehicle behaves normally, arrange a diagnostic inspection soon. If it flashes or the vehicle loses power, vibrates heavily, overheats or produces unusual smoke, stop driving safely and request professional assistance.'
      };
    } else if (msgLower.includes('soft') && msgLower.includes('brake') || msgLower.includes('spongy')) {
      response = {
        decision: 'ESCALATE_EMERGENCY',
        category: 'Brakes and Safety',
        confidence_level: 'HIGH',
        matched_faq_ids: ['AC-FAQ-010'],
        evidence: [
          {
            insight: 'User reports soft brake pedal matching AC-FAQ-010 brake system hazard guidelines.',
            evidence_type: 'FACT',
            confidence_level: 'HIGH',
            source: 'User message and AC-FAQ-010',
            reason: 'Brake pedal degradation matches emergency protocol in AC-FAQ-010.',
            review_guidance: 'Prioritize immediate safe stopping advice.'
          }
        ],
        assumptions: [],
        conflicts: [],
        escalation_destination: 'emergency_services',
        reason: 'Direct emergency symptom reported by user requiring immediate safety guidance.',
        response: '[SAFETY WARNING] Please safely pull over to the side of the road, turn off your engine, and do not attempt to drive further. Based on AutoCare policy [AC-FAQ-010]: A soft or spongy brake pedal indicates a severe braking-system issue. Contact roadside assistance or emergency services immediately.'
      };
    } else if (msgLower.includes('tyre-pressure warning') || msgLower.includes('tire pressure warning')) {
      response = {
        decision: 'ANSWER',
        category: 'Dashboard Warning Lights',
        confidence_level: 'HIGH',
        matched_faq_ids: ['AC-FAQ-004'],
        evidence: [
          {
            insight: 'User is asking about tyre pressure warning light matching AC-FAQ-004.',
            evidence_type: 'FACT',
            confidence_level: 'HIGH',
            source: 'User message and AC-FAQ-004',
            reason: 'Direct match for tyre pressure light query.',
            review_guidance: 'No review needed.'
          }
        ],
        assumptions: [],
        conflicts: [],
        escalation_destination: null,
        reason: 'Standard informational vehicle query.',
        response: 'Based on AutoCare policy [AC-FAQ-004]: The tyre-pressure warning usually means that one or more tyres may be underinflated, overinflated or affected by a sensor issue. When it is safe, inspect the tyres for visible damage and check their pressure against the value specified in the vehicle manual.'
      };
    } else if (msgLower.includes('how often') && (msgLower.includes('service') || msgLower.includes('maintenance'))) {
      response = {
        decision: 'ANSWER',
        category: 'Scheduled Maintenance',
        confidence_level: 'HIGH',
        matched_faq_ids: ['AC-FAQ-005'],
        evidence: [
          {
            insight: 'User asked about vehicle service frequency matching AC-FAQ-005.',
            evidence_type: 'FACT',
            confidence_level: 'HIGH',
            source: 'User message and AC-FAQ-005',
            reason: 'Direct question match.',
            review_guidance: 'No review needed.'
          }
        ],
        assumptions: [],
        conflicts: [],
        escalation_destination: null,
        reason: 'Standard maintenance question.',
        response: 'Based on AutoCare policy [AC-FAQ-005]: Service intervals depend on the vehicle model, age, mileage, fuel type and driving conditions. Follow the time or distance interval in the owner\'s manual, whichever occurs first.'
      };
    } else if (msgLower.includes('air conditioner') || msgLower.includes('aircon') || msgLower.includes('ac not cooling')) {
      response = {
        decision: 'ANSWER',
        category: 'Air Conditioning',
        confidence_level: 'HIGH',
        matched_faq_ids: ['AC-FAQ-016'],
        evidence: [
          {
            insight: 'User query matches air conditioning cooling FAQ AC-FAQ-016.',
            evidence_type: 'FACT',
            confidence_level: 'HIGH',
            source: 'User message and AC-FAQ-016',
            reason: 'Direct match for air conditioning query.',
            review_guidance: 'Standard response.'
          }
        ],
        assumptions: [],
        conflicts: [],
        escalation_destination: null,
        reason: 'Informational aircon query.',
        response: 'Based on AutoCare policy [AC-FAQ-016]: Poor cooling may be caused by a clogged cabin filter, low refrigerant, a leak, compressor trouble, condenser blockage or an electrical fault. A certified technician should inspect the system for leaks.'
      };
    } else if (msgLower.includes('check tyre pressure') || msgLower.includes('check tire pressure')) {
      response = {
        decision: 'ANSWER',
        category: 'Tyres',
        confidence_level: 'HIGH',
        matched_faq_ids: ['AC-FAQ-011'],
        evidence: [
          {
            insight: 'User asked about tyre pressure inspection frequency matching AC-FAQ-011.',
            evidence_type: 'FACT',
            confidence_level: 'HIGH',
            source: 'User message and AC-FAQ-011',
            reason: 'Direct FAQ match.',
            review_guidance: 'Standard review.'
          }
        ],
        assumptions: [],
        conflicts: [],
        escalation_destination: null,
        reason: 'Standard maintenance query.',
        response: 'Based on AutoCare policy [AC-FAQ-011]: Check tyre pressure at least once a month and before long trips, preferably when the tyres are cold. Use the pressure recommended on the vehicle\'s door-frame label or in the owner\'s manual.'
      };
    } else if (msgLower.includes('charged') || msgLower.includes('unapproved') || msgLower.includes('billing') || msgLower.includes('manager')) {
      response = {
        decision: 'ESCALATE_SUPPORT',
        category: 'Billing and Complaints',
        confidence_level: 'HIGH',
        matched_faq_ids: ['AC-FAQ-024'],
        evidence: [
          {
            insight: 'Customer expressed grievance regarding unapproved charges matching AC-FAQ-024.',
            evidence_type: 'FACT',
            confidence_level: 'HIGH',
            source: 'User message and AC-FAQ-024',
            reason: 'Billing complaint requires customer support escalation.',
            review_guidance: 'Route to human support agent.'
          }
        ],
        assumptions: [],
        conflicts: [],
        escalation_destination: 'customer_support',
        reason: 'Billing dispute requires support manager escalation.',
        response: 'Based on AutoCare policy [AC-FAQ-024]: Request an itemised invoice and compare it with your original estimate. Do not share sensitive payment info through the chatbot. This matter has been prepared for human customer-support escalation.'
      };
    } else if (msgLower.includes('breakdown') || msgLower.includes('breaks down')) {
      response = {
        decision: 'ESCALATE_EMERGENCY',
        category: 'Breakdown and Roadside Assistance',
        confidence_level: 'HIGH',
        matched_faq_ids: ['AC-FAQ-025'],
        evidence: [
          {
            insight: 'User reports roadside breakdown matching AC-FAQ-025.',
            evidence_type: 'FACT',
            confidence_level: 'HIGH',
            source: 'User message and AC-FAQ-025',
            reason: 'Breakdown hazard guidelines apply.',
            review_guidance: 'Immediate roadside assistance safety guidance.'
          }
        ],
        assumptions: [],
        conflicts: [],
        escalation_destination: 'roadside_assistance',
        reason: 'Roadside breakdown reported by user.',
        response: '[SAFETY WARNING] Move the vehicle away from moving traffic if safe to do so, switch on hazard lights, apply parking brake, and stay in a safe location. Based on AutoCare policy [AC-FAQ-025]: Contact roadside assistance or emergency services if in immediate danger.'
      };
    } else if (msgLower.includes('strange noise') || msgLower.includes('noise')) {
      response = {
        decision: 'CLARIFY',
        category: 'Noise & Vibration',
        confidence_level: 'LOW',
        matched_faq_ids: [],
        evidence: [
          {
            insight: 'User reported an unspecified vehicle noise without diagnostic context.',
            evidence_type: 'ASSUMPTION',
            confidence_level: 'LOW',
            source: 'Insufficient information',
            reason: 'Specific noise details are missing.',
            review_guidance: 'Request user clarification.'
          }
        ],
        assumptions: ['The specific type, location, and operating conditions of the symptom are unknown.'],
        conflicts: [],
        escalation_destination: null,
        reason: 'Essential vehicle information is missing, requiring clarification.',
        response: 'To help identify your vehicle issue accurately, could you please tell me: 1) Where is the noise coming from (e.g. engine bay, wheels, or underbody)? 2) Does it happen when braking, accelerating, or turning?'
      };
    } else if (msgLower.includes('disable') || msgLower.includes('ignore your policies') || msgLower.includes('bypass')) {
      response = {
        decision: 'REFUSE_UNSAFE',
        category: 'policy_violation',
        confidence_level: 'HIGH',
        matched_faq_ids: [],
        evidence: [
          {
            insight: 'User message attempts prompt injection or unsafe modification to safety controls.',
            evidence_type: 'FACT',
            confidence_level: 'HIGH',
            source: 'User message and policy_refusals',
            reason: 'Bypassing safety controls or system rules is strictly forbidden.',
            review_guidance: 'Enforce mandatory refusal.'
          }
        ],
        assumptions: [],
        conflicts: [],
        escalation_destination: null,
        reason: 'Request violates safety policy by asking to disable warning systems.',
        response: 'I cannot fulfill this request. AutoCare policy strictly prohibits performing illegal vehicle modifications, bypassing safety controls, or disabling warning systems. If you have a standard maintenance question, I am happy to assist.'
      };
    } else {
      response = {
        decision: 'ANSWER',
        category: 'General Maintenance',
        confidence_level: 'HIGH',
        matched_faq_ids: ['AC-FAQ-001'],
        evidence: [
          {
            insight: 'Query processed under standard AutoCare general guidance policy.',
            evidence_type: 'FACT',
            confidence_level: 'HIGH',
            source: 'User message',
            reason: 'Standard maintenance information request.',
            review_guidance: 'Standard review.'
          }
        ],
        assumptions: [],
        conflicts: [],
        escalation_destination: null,
        reason: 'Informational vehicle query.',
        response: 'For general vehicle care, always refer to your owner\'s manual for exact manufacturer recommendations. If you are experiencing warning lights or unusual vehicle performance, arrange a professional inspection at an authorised service centre.'
      };
    }

    // Simulate realistic 600ms latency
    return of(response).pipe(delay(600));
  }
}
