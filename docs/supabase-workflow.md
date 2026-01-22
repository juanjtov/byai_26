### **Workflow 1: Frontend user login using Supabase Auth**

1. User opens the app and clicks Sign in.

2. Frontend calls Supabase Auth using the publishable key.

3. Supabase verifies credentials or completes OAuth flow.

4. Supabase returns a session to the frontend including an access token and refresh token.

5. Frontend stores the session and keeps the access token available for API calls.

6. When the access token expires, the Supabase client refreshes it automatically using the refresh token.

### **Workflow 2: Frontend calling your FastAPI backend**

1. User takes an action in the UI that requires backend logic.

2. Frontend sends a request to FastAPI.

3. Frontend includes the Supabase access token in the request Authorization header as a Bearer token.

4. FastAPI receives the request and extracts the token.

### **Workflow 3: Backend validating the JWT on each request**

1. FastAPI validates that the token exists and is well formed.

2. FastAPI verifies the token signature using Supabase JWT signing keys.

3. FastAPI checks token claims such as expiration and audience.

4. If valid, FastAPI considers the request authenticated and obtains the user identity from the token, like user id.

5. If invalid, FastAPI rejects the request with an unauthorized response.

### **Workflow 4: Backend performing user scoped operations with RLS enforced**

1. FastAPI determines the request is a normal user action, not admin.

2. FastAPI calls Supabase data APIs on behalf of the user.

3. FastAPI forwards the same user access token to Supabase in the Authorization header.

4. Supabase applies Row Level Security policies based on that user identity.

5. Supabase returns only the rows and operations allowed for that user.

6. FastAPI returns the result to the frontend.

### **Workflow 5: Backend performing admin or system operations using the secret key**

1. A trusted backend only process triggers an admin operation, such as a background job or an internal admin endpoint.

2. FastAPI uses the secret key stored in environment variables.

3. FastAPI calls Supabase with the secret key.

4. Supabase grants elevated access and bypasses RLS.

5. The operation completes and the backend stores results or returns them to the admin user.

### **Workflow 6: Background jobs**

1. A scheduled task or queue worker runs in the backend environment.

2. The job uses the secret key to read and write required data in Supabase.

3. The job performs heavy work like document processing, extraction, generating outputs, sending notifications.

4. The job saves job status and outputs back to Supabase.

5. The frontend polls or subscribes to job status updates through FastAPI or directly from Supabase depending on your design.

### **Workflow 7: Authorization model summary**

1. Authentication happens in Supabase Auth.

2. User identity is proven to FastAPI via the JWT access token.

3. Authorization for normal data access is enforced primarily by Supabase RLS.

4. Authorization for admin level operations is enforced by your backend logic plus the secret key being server only.

