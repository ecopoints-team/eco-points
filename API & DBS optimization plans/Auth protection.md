1️⃣ What most developers think
Login → JWT → Done
But microservices don’t work like this 
⸻
2️⃣ Real problem in microservices
Multiple services → multiple entry points → no single control point
So security must be layered
⸻
3️⃣ API Gateway layer
Client → API Gateway → Services
Gateway checks:
→ JWT validation
→ rate limiting
→ IP filtering
→ request blocking
Invalid request → rejected here itself
⸻
4️⃣ Authentication layer (Who are you?)
Login → JWT / OAuth token issued
Every request:
→ carries token
→ verified by each service
No session dependency
⸻
5️⃣ Authorization layer (What can you do?)
Even valid user is restricted
Checks:
→ roles (RBAC)
→ permissions
→ service-level access rules
User ≠ admin access
⸻
6️⃣ Service-to-service security
Service A → Service B calls
Secured using:
→ mTLS
→ service identity
→ signed internal tokens
Internal network is NOT trusted
⸻