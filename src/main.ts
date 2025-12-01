import styles from './style.css?raw';
import {QRModal} from "./modal.js";
import type {AuthSessionTime} from "@/authApi.js";

injectStyles();

const modalInstance = new QRModal();

export async function showQrLogin(sessionTime: AuthSessionTime = {}) {
    return modalInstance.show(sessionTime);
}

export function closeQrLogin(): void {
    modalInstance.close();
}

function injectStyles() {
    if (document.getElementById('oauth0-js-lib-styles')) return;

    const styleElement = document.createElement('style');
    styleElement.id = 'oauth0-js-lib-styles';
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
}