import {getConfig} from "@/config.js";
import axios from "axios";

export interface AuthSessionTime {
    lifetimeSeconds?: number
}

export interface AuthSession {
    links: {
        link: string
        type: string
    }[]
    sessionId: string
    validUntil: string | null
}

const config = getConfig();

const api = axios.create({
    baseURL: config.baseUrl,
});

export async function createAuthSession(sessionTime: AuthSessionTime = {}) {
    const response = await api.post<AuthSession>(config.createEndpoint, sessionTime, {
        withCredentials: true
    });
    return response.data;
}

export function createAuthEvent(successCallback: Function = () => {}, errorCallback: Function = () => {}) {
    const url = new URL(config.authEventEndpoint, config.baseUrl);
    const eventSource = new EventSource(url, {
        withCredentials: true
    });
    eventSource.addEventListener('auth-success', async (e) => {
        try {
            await api.post(config.authConfirmEndpoint, null, {
                withCredentials: true
            });
            successCallback();
        } catch (err) {
            console.error(err);
            errorCallback(err);
        } finally {
            eventSource.close();
        }
    });
    eventSource.onerror = (e) => {
        console.error("EventSource failed:", e);
        eventSource.close();
    };
    return eventSource;
}