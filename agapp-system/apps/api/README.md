# AGAPP — Backend API & Microservices

> **Workspace**: `apps/api`  
> **Tech Stack**: NestJS 10, Express, TypeScript, Mistral AI SDK, Roboflow Serverless API  
> **Default Port**: `3000` (`http://localhost:3000/api`)

The AGAPP API is an intentionally thin microservices layer handling specialized background tasks that require server-side secrets or AI model inference:
1. **RAG Chatbot Assistant (`POST /api/chatbot/ask`)**: Multi-turn conversational retrieval-augmented assistant backed by local municipal knowledge and Mistral AI LLM fallback.
2. **AI Photo Verification (`POST /api/reports/verify-image`)**: Roboflow serverless computer vision model inference for pothole detection and stray animal verification.
3. **Push Notification Service**: PostgreSQL Realtime CDC event listener dispatching push updates to citizen mobile devices.

---

## 🤖 Context for AI Agents & Developers

- **Thin Controller Architecture**:
  - The NestJS backend does **NOT** handle generic CRUD for users, reports, services, or forum posts. All client apps query Supabase directly with Row-Level Security.
  - Do NOT create redundant API controllers that duplicate Supabase PostgREST endpoints.
- **Chatbot Knowledge Base & Security**:
  - Chatbot queries match local municipal FAQs first.
  - Unmatched queries fall back to Mistral AI with a strict system prompt preventing prompt injections and restricting responses to official municipal governance topics.
  - In-app redirects returned by the chatbot must match the client allowlist (`ReportsTab`, `ServicesTab`, `MapTab`, `Explore`, `Forum`, `Profile`).
- **Roboflow ML Endpoints**:
  - `POST /api/reports/verify-image` verifies pothole and stray pet photos via Roboflow Hosted APIs.
  - Returns `mlConfidence` (0.0 to 1.0) and `mlVerified` (boolean). Never fabricates results on missing API keys or failure.

---

## 🛠️ Development & Environment

```bash
# From agapp-system/
npm run dev:api
```

Create `.env` from `.env.example`:
```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<service-role-secret-key>
MISTRAL_API_KEY=<key>
ROBOFLOW_API_KEY=<key>
ROBOFLOW_POTHOLE_MODEL_URL=https://serverless.roboflow.com/<pothole-slug>/<version>
ROBOFLOW_STRAYPETS_MODEL_URL=https://serverless.roboflow.com/<straypets-slug>/<version>
PORT=3000
```
