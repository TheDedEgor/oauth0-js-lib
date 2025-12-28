export interface OauthConfig {
    baseUrl: string;
    createEndpoint: string;
    authEventEndpoint: string;
    authConfirmEndpoint: string;
    linkType: 'WEB_APP' | 'BOT'
}

const defaultConfig: OauthConfig = {
    baseUrl: getDefaultBaseUrl(),
    createEndpoint: "/api/oauth0/create",
    authEventEndpoint: "/api/oauth0/auth-events",
    authConfirmEndpoint: "/api/oauth0/auth-confirm",
    linkType: 'WEB_APP'
};

// Проверяем define-конфиг (для Vite/Webpack)
const buildTimeConfig =
    typeof __OAUTH_LIB_CONFIG__ !== "undefined" ? __OAUTH_LIB_CONFIG__ : undefined;

// Проверяем глобальную переменную (для браузера)
const runtimeGlobalConfig =
    typeof globalThis !== "undefined" && (globalThis as any).OAUTH_LIB_CONFIG
        ? (globalThis as any).OAUTH_LIB_CONFIG
        : undefined;

// Итоговая конфигурация
let currentConfig: OauthConfig = {
    ...defaultConfig,
    ...buildTimeConfig,
    ...runtimeGlobalConfig,
};

export function setConfig(newConfig: OauthConfig) {
    currentConfig = {...currentConfig, ...newConfig};
}

export function getConfig() {
    return currentConfig;
}

function getDefaultBaseUrl(): string {
    if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin;
    }
    if (typeof globalThis !== "undefined" && (globalThis as any).location?.origin) {
        return (globalThis as any).location.origin;
    }
    return "";
}
