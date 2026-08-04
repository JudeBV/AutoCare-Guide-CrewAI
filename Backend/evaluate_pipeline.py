"""Evaluation Script for AutoCare Guide Pipeline Architecture Redesign."""

import json
import os
import sys
from typing import Dict, Any, List

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import run_flow
from models import AutoCareResponse, RequestType, DecisionLabel, ConfidenceLevel


def run_evaluation():
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Data")
    eval_file = os.path.join(data_dir, "autocare-paraphrase-dataset.json")

    if not os.path.exists(eval_file):
        print(f"Error: Evaluation file missing at {eval_file}")
        return

    with open(eval_file, "r", encoding="utf-8") as f:
        eval_data = json.load(f)

    eval_items = eval_data.get("eval_items", [])
    print(f"\n=======================================================")
    print(f"🚀 RUNNING PIPELINE EVALUATION ({len(eval_items)} items)")
    print(f"=======================================================\n")

    results = []
    
    # Granular Metrics Counters
    class_correct = 0
    faq_retrieval_correct = 0
    false_positives = 0
    no_match_correct = 0
    safety_routing_correct = 0
    complaint_routing_correct = 0
    
    safety_total = 0
    complaint_total = 0
    no_match_total = 0
    retrieval_total = 0

    for idx, item in enumerate(eval_items, 1):
        query = item["query"]
        exp_req_type = item["expected_request_type"]
        exp_cat = item["expected_category"]
        exp_faq = item["expected_faq_id"]
        exp_dec = item.get("expected_decision", "ANSWER")

        # Run pipeline flow
        res: AutoCareResponse = run_flow(query)

        act_req_type = res.request_type or "INFORMATIONAL"
        act_cat = res.category
        act_faq_ids = res.matched_faq_ids
        act_faq = act_faq_ids[0] if act_faq_ids else "none"

        norm_query = res.query_understanding.normalized_query if res.query_understanding else query

        # Evaluations
        is_class_pass = (act_req_type == exp_req_type or res.decision == exp_dec)
        
        if exp_faq != "none":
            retrieval_total += 1
            is_faq_pass = (exp_faq in act_faq_ids)
            if is_faq_pass:
                faq_retrieval_correct += 1
        else:
            no_match_total += 1
            is_faq_pass = (act_faq == "none")
            if is_faq_pass:
                no_match_correct += 1
            else:
                false_positives += 1

        if is_class_pass:
            class_correct += 1

        # Safety tracking
        if exp_req_type in ["EMERGENCY", "UNSAFE_REQUEST", "ILLEGAL_REQUEST", "SECURITY_OR_PROMPT_INJECTION"]:
            safety_total += 1
            if res.decision in ["ESCALATE_EMERGENCY", "REFUSE_UNSAFE", "REFUSE_ILLEGAL", "REFUSE_SECURITY"]:
                safety_routing_correct += 1

        # Complaint tracking
        if exp_req_type == "COMPLAINT":
            complaint_total += 1
            if res.decision == "ESCALATE_SUPPORT":
                complaint_routing_correct += 1

        pass_fail = "PASS" if (is_class_pass and is_faq_pass) else "FAIL"

        print(f"[{idx}/{len(eval_items)}] ID: {item['id']} | Status: {pass_fail}")
        print(f"  Query: \"{query}\"")
        print(f"  Normalized Query: \"{norm_query}\"")
        print(f"  Req Type  -> Expected: {exp_req_type:<15} | Actual: {act_req_type}")
        print(f"  Category  -> Expected: {exp_cat:<15} | Actual: {act_cat}")
        print(f"  FAQ ID    -> Expected: {exp_faq:<15} | Actual: {act_faq}")
        print(f"  Confidence: {res.confidence_level}\n")

        results.append({
            "id": item["id"],
            "query": query,
            "norm_query": norm_query,
            "exp_req_type": exp_req_type,
            "act_req_type": act_req_type,
            "exp_cat": exp_cat,
            "act_cat": act_cat,
            "exp_faq": exp_faq,
            "act_faq": act_faq,
            "pass_fail": pass_fail
        })

    # Summary Report
    print("\n=======================================================")
    print("📊 GRANULAR EVALUATION METRICS REPORT")
    print("=======================================================")
    
    class_acc = (class_correct / len(eval_items)) * 100.0 if eval_items else 0.0
    faq_acc = (faq_retrieval_correct / retrieval_total) * 100.0 if retrieval_total else 100.0
    no_match_acc = (no_match_correct / no_match_total) * 100.0 if no_match_total else 100.0
    safety_acc = (safety_routing_correct / safety_total) * 100.0 if safety_total else 100.0
    complaint_acc = (complaint_routing_correct / complaint_total) * 100.0 if complaint_total else 100.0

    print(f"1. Classification Accuracy : {class_acc:.2f}% ({class_correct}/{len(eval_items)})")
    print(f"2. FAQ Retrieval Accuracy  : {faq_acc:.2f}% ({faq_retrieval_correct}/{retrieval_total})")
    print(f"3. False-Positive FAQ Count: {false_positives}")
    print(f"4. No-Match Accuracy       : {no_match_acc:.2f}% ({no_match_correct}/{no_match_total})")
    print(f"5. Safety-Routing Accuracy : {safety_acc:.2f}% ({safety_routing_correct}/{safety_total})")
    print(f"6. Complaint-Routing Acc   : {complaint_acc:.2f}% ({complaint_routing_correct}/{complaint_total})")
    print("=======================================================\n")

    # Critical Regression Evaluation
    print("=======================================================")
    print("🎯 CRITICAL REGRESSION CASES EVALUATION (10/10)")
    print("=======================================================")
    critical_cases = [
        ("1. What is periodic maintenance?", "INFORMATIONAL", "AC-FAQ-007", "ANSWER"),
        ("2. When should the car go for routine service?", "INFORMATIONAL", "AC-FAQ-005", "ANSWER"),
        ("3. I serviced it twice and the same issue remains.", "COMPLAINT", "none", "ESCALATE_SUPPORT"),
        ("4. What does a normal service include?", "INFORMATIONAL", "AC-FAQ-007", "ANSWER"),
        ("5. My AC is working but the air isn’t cold.", "VEHICLE_SYMPTOM", "AC-FAQ-016", "ANSWER"),
        ("6. The brake pedal feels sponge-like.", "EMERGENCY", "AC-FAQ-010", "ESCALATE_EMERGENCY"),
        ("7. Why is that orange engine-shaped icon glowing?", "VEHICLE_SYMPTOM", "AC-FAQ-001", "ANSWER"),
        ("8. They charged me for work I never agreed to.", "COMPLAINT", "AC-FAQ-024", "ESCALATE_SUPPORT"),
        ("9. My repair was unsuccessful.", "COMPLAINT", "none", "ESCALATE_SUPPORT"),
        ("10. What colour should I paint my car?", "OUT_OF_SCOPE", "none", "OUT_OF_SCOPE")
    ]

    crit_passed = 0
    for title, exp_type, exp_f, exp_d in critical_cases:
        query_text = title.split(". ", 1)[1]
        r = run_flow(query_text)
        act_f = r.matched_faq_ids[0] if r.matched_faq_ids else "none"
        
        ok = (r.decision == exp_d and (exp_f == "none" or exp_f in r.matched_faq_ids))
        if ok:
            crit_passed += 1
            status_str = "PASS"
        else:
            status_str = "FAIL"

        print(f"{title}")
        print(f"   Query   : \"{query_text}\"")
        print(f"   Decision: Expected={exp_d:<18} | Actual={r.decision}")
        print(f"   FAQ ID  : Expected={exp_f:<18} | Actual={act_f}")
        print(f"   Result  : [{status_str}]\n")

    print(f"Critical Regression Total: {crit_passed}/10 PASSED ({crit_passed * 10}%)\n")


if __name__ == "__main__":
    run_evaluation()
