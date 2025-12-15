import { auth } from '$lib/auth'; // path to your auth file
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from "$app/environment";

const setSessionHook: Handle = async ({
                                          event,
                                          resolve
                                      }) => {
    // this hook needs to run first to set session properly before running the next hook
    return svelteKitHandler({ auth, event, resolve, building });
};

const checkAuthHook: Handle = async ({
                                         event,
                                         resolve
                                     }) => {
    // if the user is signed in, the session should be here if the setSessionHook hook has been run
    const headers = event.request.headers;
    const session = await auth.api.getSession({
        headers
    });

    if (!session) {
        // redirect if no session is found
        const res = await auth.api.signInSocial({
            body: {
                provider: 'keycloak',
                callbackURL: event.url.href
            }
        });

        redirect(302, res.url!);
    }

    // set user data as you wish
    event.locals.user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
    };

    // resolve as usual
    return resolve(event);
};

export function handleError({ error }) {
    console.error(error);
}

export const handle = sequence(
    setSessionHook,
    checkAuthHook
);