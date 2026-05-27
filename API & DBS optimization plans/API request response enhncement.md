1️⃣ Killed N+1 DB queries
→ 120 database calls became 3 optimized joins
2️⃣ Added Redis caching
→ Hot data stopped hitting DB repeatedly
3️⃣ Removed synchronous third-party calls
→ Moved them to async queues
4️⃣ Fixed missing indexes
→ Full table scans disappeared instantly
5️⃣ Enabled pagination + response compression
→ Payload size dropped massively
Result:
15s → 0.2s API response time