import {betterAuth} from "better-auth";
import {genericOAuth} from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";

export const auth = betterAuth({
    advanced: {
        cookies: {
            state: {
                attributes: {
                    sameSite: "lax",
                    secure: false,
                }
            }
        }
    },
    plugins: [
        genericOAuth({
            config: [
                {
                    providerId: "keycloak",
                    clientId: "svelte-app",
                    discoveryUrl: "http://localhost:8080/realms/customers/.well-known/openid-configuration",
                    scopes: ["openid","profile","email"],
                    pkce: true,
                    redirectURI: "http://localhost:5173/api/auth/callback/keycloak"
                },
            ],
        }),
        sveltekitCookies(getRequestEvent)
    ],
})
