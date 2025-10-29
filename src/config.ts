export interface OauthConfig {
    serviceUrl: string;
    botUrl: string;
    webAppDirectLink?: string;
}

const defaultConfig: OauthConfig = {
    serviceUrl: "https://oauth0.site",
    botUrl: "https://t.me/OAuthZeroBot",
    webAppDirectLink: "web",
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
    currentConfig = { ...currentConfig, ...newConfig };
}

export function getConfig() {
    return currentConfig;
}
