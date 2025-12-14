<script lang="ts">
    import { authClient } from '$lib/auth-client';
    const session = authClient.useSession;
</script>

<div style="font-family: sans-serif;">
    <h1>You have been successfully authenticated as:</h1>
    <h2>E-Mail: {$session.data?.user.email}</h2>
    <h2>Name: {$session.data?.user.name}</h2>
</div>
