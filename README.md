SvelteKit + better-auth + Keycloak (OIDC) Example

This repo demonstrates how to integrate Keycloak (as an OpenID Connect provider) with SvelteKit using better-auth. It shows a minimal setup for server-side session handling and client-side session usage, with a ready-to-use local Keycloak configuration for manual testing.

What you get in this example

- A working OIDC login flow using better-auth’s `genericOAuth` against Keycloak
- Server hooks that ensure users are authenticated before rendering protected pages
- A simple page showing the authenticated user’s name and email
- Local development settings for HTTP (no HTTPS) with proper cookie flags

Prerequisites

- Node.js 22+ (or the version supported by your local environment)
- Docker (for running Keycloak locally)

Install & run the SvelteKit app

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```

Start a local Keycloak with Docker

Run Keycloak in dev mode on port 8080:

```bash
docker run --name keycloak -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:26.0 \
  start-dev
```

Once it’s up, open http://localhost:8080 and log in with the admin credentials you set above.

Configure Keycloak for this example

This project expects a realm named `customers` and a public client named `svelte-app` with PKCE enabled. The corresponding better-auth configuration points to the OIDC discovery endpoint at:

- `http://localhost:8080/realms/customers/.well-known/openid-configuration`

Steps in the Keycloak Admin Console:

1. Create a realm:
   - In the left top realm selector, click “Create realm”
   - Name: `customers`

2. Create a client:
   - Go to “Clients” → “Create client”
   - Client type: “OpenID Connect”
   - Client ID: `svelte-app`
   - Next → Set the following:
     - “Client authentication”: OFF (public client)
     - “Authorization”: OFF (not needed here)
     - “Standard flow”: ON
     - “Direct access grants”: OFF
     - “Service accounts”: OFF
     - “PKCE Method”: S256
   - Click “Save”

3. Configure client URLs and PKCE:
   - In the client “Settings” tab:
     - Valid redirect URIs: add `*`
     - Web origins: add `*`
   - Save changes

4. Create a test user:
   - Go to “Users” → “Add user”
   - Fill username, first/last name, email (email verified can be left off for local)
   - Save → “Credentials” tab → Set a password and disable “Temporary”

With this in place, the app will redirect unauthenticated users to Keycloak and handle the callback.

How it works in this repo

- Server-side better-auth configuration: `src/lib/auth.ts`
  ```ts
  export const auth = betterAuth({
    advanced: {
      cookies: {
        state: { attributes: { sameSite: "lax", secure: false } }
      }
    },
    plugins: [
      genericOAuth({
        config: [{
          providerId: "keycloak",
          clientId: "svelte-app",
          discoveryUrl: "http://localhost:8080/realms/customers/.well-known/openid-configuration",
          scopes: ["openid", "profile", "email"],
          pkce: true,
          redirectURI: "http://localhost:5173/api/auth/callback/keycloak"
        }]
      }),
      sveltekitCookies(getRequestEvent)
    ]
  })
  ```
  Notes:
  - `secure: false` and `sameSite: "lax"` are suitable for local HTTP dev only; for production behind HTTPS set `secure: true` and consider `sameSite` as needed.

- better-auth SvelteKit route handler: `src/routes/api/auth/[...all]/+server.ts`
  ```ts
  const handler = toSvelteKitHandler(auth)
  export { handler as GET, handler as POST }
  ```

- Global hooks: `src/hooks.server.ts`
  - `setSessionHook` wires better-auth per-request.
  - `checkAuthHook` redirects to Keycloak if there’s no session yet:
    ```ts
    const res = await auth.api.signInSocial({
      body: { provider: 'keycloak', callbackURL: event.url.href }
    })
    redirect(302, res.url!)
    ```
  - On success, user data is added to `event.locals.user`.

- Client-side usage: `src/lib/auth-client.ts`
  ```ts
  export const authClient = createAuthClient({
    baseURL: "http://localhost:5173",
    plugins: [genericOAuthClient()]
  })
  ```
  In `src/routes/+page.svelte` the session is read and displayed.

Running the full flow locally

1. Start Keycloak (Docker command above) and configure realm + client.
2. Start the SvelteKit app: `npm run dev -- --open`.
3. Open `http://localhost:5173` in your browser.
4. You should be redirected to Keycloak. Log in with your test user.
5. You’ll be redirected back to the app and see your `email` and `name` rendered.

Common pitfalls and tips

- For local HTTP dev, cookies set with `secure: false` are required; in production use HTTPS and set `secure: true`.
- If you change realm name, client ID, ports, or hostnames, update both the code and Keycloak settings accordingly.

