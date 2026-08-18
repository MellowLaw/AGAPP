# Performance & Stress Load Testing Benchmark
**AGAPP System — Automated Governance and Public Service Platform**
*Standard: High-Concurrency Load Simulation with Grafana k6*

---

## 1. Load Testing Architecture & Objectives

The purpose of this performance test suite is to validate that the **AGAPP API Gateway, Next.js Web Portal, and Supabase Postgres database** maintain sub-second response times and zero error rates under simultaneous peak citizen traffic (e.g., during municipal advisories or tax clearance seasons).

```
+───────────────────────────────────────────────────────────────────────────────────+
|                               LOAD SIMULATION PROFILE                             |
+───────────────────────────────────────────────────────────────────────────────────+
|  Virtual Users (VUs):  100 -> 500 -> 2,000 Concurrent Virtual Citizens            |
|  Target Duration:      10 Minutes (Ramp-up -> Sustained Peak -> Ramp-down)         |
|  Throughput Goal:      > 500 Requests / Second (RPS)                               |
|  Latency Threshold:    p(95) < 500ms, p(99) < 1,000ms                              |
|  Reliability Target:   Error Rate < 0.1%                                           |
+───────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Executable k6 Load Test Script (`k6-load-test.js`)

Save the following script and run via `k6 run k6-load-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom Metrics
const errorRate = new Rate('http_error_rate');
const serviceLatency = new Trend('service_request_latency');
const chatbotLatency = new Trend('chatbot_ask_latency');

export const options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp-up to 100 users
    { duration: '3m', target: 500 },  // Scale to 500 concurrent users
    { duration: '4m', target: 2000 }, // Peak storm load: 2,000 concurrent users
    { duration: '2m', target: 0 },    // Ramp-down to recovery
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
    'http_error_rate': ['rate<0.01'],                  // Error rate < 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Scenario 1: Citizen Feed & Public Services
  group('1. Public Services Directory', () => {
    const res = http.get(`${BASE_URL}/api/services?lguId=liliw-laguna`, { headers });
    const success = check(res, {
      'status is 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
    serviceLatency.add(res.timings.duration);
  });

  sleep(1);

  // Scenario 2: Chatbot In-Memory / Tagged Query
  group('2. AI Chatbot FAQ Ingestion', () => {
    const payload = JSON.stringify({
      message: 'Paano po kumuha ng barangay clearance sa Liliw?',
      history: [],
    });
    const res = http.post(`${BASE_URL}/api/chat`, payload, { headers });
    const success = check(res, {
      'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    });
    errorRate.add(!success);
    chatbotLatency.add(res.timings.duration);
  });

  sleep(2);

  // Scenario 3: Community Hazard Map Feed
  group('3. Community Reports Live Feed', () => {
    const res = http.get(`${BASE_URL}/api/reports/feed?lguId=liliw-laguna`, { headers });
    const success = check(res, {
      'status is 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(1);
}
```

---

## 3. Performance Benchmark Target Metrics

| Endpoint / Action | Peak Concurrency | Expected $p95$ Latency | Success Rate Target |
|---|:---:|:---:|:---:|
| `GET /api/services` (E-Services Directory) | 2,000 VUs | $< 180\text{ms}$ | $> 99.9\%$ |
| `POST /api/chat` (AI / FAQ Ingestion) | 2,000 VUs | $< 350\text{ms}$ | $> 99.5\%$ |
| `GET /api/reports/feed` (Geotagged Map Points) | 2,000 VUs | $< 220\text{ms}$ | $> 99.9\%$ |
| `POST /api/services/apply` (Clearance Filing) | 500 VUs | $< 450\text{ms}$ | $> 99.8\%$ |
| `POST /api/treasury/verify-qr` (Cashier Scan) | 200 VUs | $< 120\text{ms}$ | $100\%$ |
