import {getConfig} from "./config.js";
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
    validUntil: string
}

const config = getConfig();

const api = axios.create({
    baseURL: config.baseUrl,
});

export async function createAuthSession(sessionTime: AuthSessionTime = {}) {
    const response = await api.post<AuthSession>(config.createEndpoint, sessionTime);
    return response.data;
}

export async function auth(sessionId: string, validUntil: string, signal: AbortSignal) {
    const controller = new AbortController();
    const validUntilDate = new Date(validUntil).getTime();

    signal.addEventListener('abort', () => controller.abort())

    while (true) {
        if (validUntilDate - Date.now() <= 0) {
            throw new Error('Auth timeout');
        }

        const response = await api.post(config.authEndpoint, null, {
            params: {
                sessionId
            },
            withCredentials: true,
            signal: controller.signal
        });
        // аутентификация успешна
        if (response.status === 200) {
            return;
        }
        // пользователь пока не вошел, отправляем еще раз запрос
        if (response.status === 204) {
            continue;
        }
        // Любой другой статус ошибка
        throw new Error(`Auth failed: ${response.status}`);
    }
}