import test from "node:test";

test.skip("BR-TRANS-001 new_order -> needs_documentation returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-002 new_order -> submitted with doc_link returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-003 needs_documentation -> submitted with doc_link returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-004 submitted -> pending_review returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-005 submitted -> needs_documentation with reason_code returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-006 pending_review -> approved returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-007 pending_review -> denied with reason_code returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-008 pending_review -> info_request with reason_code returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-009 pending_review -> peer_to_peer returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-010 info_request -> pending_review with reason_code returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-011 info_request -> submitted with doc_link returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-012 peer_to_peer -> pending_review with reason_code returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-013 approved -> closed with appointment_link returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-014 denied -> closed with next_step_note returns 200 and writes one audit row", () => {});
test.skip("BR-TRANS-015 peer_to_peer -> approved returns 400 invalid_transition", () => {});
test.skip("BR-TRANS-016 peer_to_peer -> denied returns 400 invalid_transition", () => {});
test.skip("BR-TRANS-017 denied -> submitted returns 400 invalid_transition", () => {});
test.skip("BR-TRANS-018 closed -> any status returns 400 invalid_transition", () => {});
test.skip("BR-TRANS-019 missing doc_link returns 400 missing_doc_link", () => {});
test.skip("BR-TRANS-020 missing reason_code returns 400 missing_reason_code", () => {});
test.skip("BR-TRANS-021 missing appointment_link returns 400 missing_appointment", () => {});
test.skip("BR-TRANS-022 missing next_step_note returns 400 missing_next_step", () => {});
test.skip("BR-TRANS-023 consent false transition payload suppresses patient message and returns 200", () => {});

test.skip("BR-RESET-001 POST /api/cases/:id/reset returns 200 and writes one demo_events row", () => {});
test.skip("BR-CLONE-001 POST /api/cases/:id/clone returns 201 and creates an independent clone", () => {});

test.skip("BR-ASSERT-001 every error response uses the shared { error, message } body shape", () => {});
test.skip("BR-ASSERT-002 invalid transitions fail before mutation", () => {});
test.skip("BR-ASSERT-003 successful transitions write exactly one audit row", () => {});
test.skip("BR-ASSERT-004 reset and clone write only to demo_events", () => {});