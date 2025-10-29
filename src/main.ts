import axios from "axios";
import QRCode, { type QRCodeRenderersOptions } from "qrcode";
import { getConfig } from "./config.js";

export interface ServiceInfo {
    authUrl: string;
    serviceName: string;
    description?: string;
    logoUrl?: string;
    permanent?: boolean;
    lifetimeSeconds?: number;
}

export interface QrOptions {
    width?: number;
    height?: number;
    margin?: number;
    errorCorrectionLevel?: string;
}

const config = getConfig();

const defaultQrOptions: QRCodeRenderersOptions = {
    width: 300,
    margin: 2,
    errorCorrectionLevel: "H",
};

const api = axios.create({
    baseURL: config.serviceUrl,
});

async function createSession(data: ServiceInfo): Promise<string> {
    const response = await api.post<string>("/session/create", data);
    return response.data;
}

/**
 * Создает авторизационную сессию и возвращает ссылку авторизации для пользователя
 * @param serviceInfo информация о сервисе в который нужно авторизоваться
 * @returns авторизационная ссылка в Tg-бота
 */
export async function createAuthUrl(serviceInfo: ServiceInfo): Promise<string> {
    const sessionToken = await createSession(serviceInfo);
    return config.botUrl + "?start=" + sessionToken;
}

/**
 * Создает авторизационную сессию, а затем создает QrCode со ссылкой в WebApp Telegram для прохождения авторизация по id <canvas> в html-документе
 * @param serviceInfo информация о сервисе в который нужно авторизоваться
 * @param canvasElementId id html-элемента <canvas> в разметке
 * @param userQrOptions опции для генерации QrCode
 */
export async function createAuthQrCode(
    serviceInfo: ServiceInfo,
    canvasElementId: string,
    userQrOptions: QRCodeRenderersOptions = {}
) {
    if (!config.webAppDirectLink) {
        throw "Not found 'webAppDirectLink' in config";
    }
    const canvasElement = document.getElementById(canvasElementId);
    if (!canvasElement) {
        throw "Not found canvas element";
    }
    const sessionToken = await createSession(serviceInfo);
    const text = config.botUrl + "/" + config.webAppDirectLink + "?startapp=" + sessionToken;
    const qrOptions = { ...defaultQrOptions, ...userQrOptions };
    QRCode.toCanvas(canvasElement, text, qrOptions);
}
