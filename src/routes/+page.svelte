<script lang="ts">
    import { authClient } from '$lib/auth-client';
    const session = authClient.useSession;
    let tokens = $state();
    let tokenError= $state("");

    // Once the session is available (user signed in), fetch OAuth tokens
    $effect(() => {
        if ($session.data?.user && !tokens && !tokenError) {
            (async () => {
                try {
                    // Better Auth exposes the endpoint as /get-access-token
                    // This call includes cookies, so it will return the current user's tokens
                    const res = await authClient.getAccessToken({
                        providerId: 'keycloak'
                    });
                    // better-fetch returns an object with { data, error } — but guard for direct data just in case
                    tokens = res?.data ?? res;
                } catch (e: any) {
                    tokenError = e?.message ?? 'Failed to retrieve access token';
                }
            })();
        }
    });
</script>

<div style="font-family: sans-serif;">
    <h1>You have been successfully authenticated as:</h1>
    <h2>E-Mail: {$session.data?.user.email}</h2>
    <h2>Name: {$session.data?.user.name}</h2>
    <h2>OAuth Tokens</h2>
    {#if tokenError}
        <p style="color: #b00;">{tokenError}</p>
    {:else if tokens}
        <pre style="background:#f5f5f5; padding:12px; border-radius:8px; overflow:auto;">
{JSON.stringify(tokens, null, 2)}
        </pre>
    {:else}
        <p>Fetching tokens…</p>
    {/if}
</div>
