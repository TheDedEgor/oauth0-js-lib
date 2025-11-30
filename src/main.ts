import axios from "axios";
import styles from './style.css?raw';
import {getConfig} from "./config.js";
import {QRModal} from "./modal.js";

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

injectStyles();

const config = getConfig();

const api = axios.create({
    baseURL: config.baseUrl,
});

const modalInstance = new QRModal();

export async function showQrLogin(sessionTime: AuthSessionTime = {}) {
    return modalInstance.show(sessionTime);
}

export function closeQrLogin(): void {
    modalInstance.close();
}

export async function createAuthSession(sessionTime: AuthSessionTime = {}) {
    const response = await api.post<AuthSession>(config.createEndpoint, sessionTime, {
        withCredentials: true
    });
    return response.data;
}

export function createAuthEvent(successCallback: Function = () => modalInstance.close(), errorCallback: Function = () => {}) {
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

function injectStyles() {
    if (document.getElementById('oauth0-js-lib-styles')) return;

    const styleElement = document.createElement('style');
    styleElement.id = 'oauth0-js-lib-styles';
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
}