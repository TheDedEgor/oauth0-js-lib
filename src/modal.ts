import * as QRCode from 'qrcode';
import './style.css';
import {type AuthSession, type AuthSessionTime, createAuthEvent, createAuthSession} from "./authApi.js";

export class QRModal {
    private overlay: HTMLElement | null = null;
    private isOpen: boolean = false;
    private authEvent: EventSource | null = null;

    // Элементы для управления состояниями
    private contentContainer: HTMLElement | null = null;
    private loader: HTMLElement | null = null;
    private qrContainer: HTMLElement | null = null;
    private separator: HTMLElement | null = null;
    private loginButton: HTMLElement | null = null;
    private errorContainer: HTMLElement | null = null;
    private timerContainer: HTMLElement | null = null;

    // Таймер
    private timerInterval: number | null = null;

    // Промис
    private resolvePromise: ((value: void | PromiseLike<void>) => void) | null = null;
    private rejectPromise: ((reason?: any) => void) | null = null;
    private currentPromise: Promise<void> | null = null;

    private createElement(tag: string, className: string, textContent?: string): HTMLElement {
        const el = document.createElement(tag);
        el.className = className;
        if (textContent) el.textContent = textContent;
        return el;
    }

    private createModal() {
        this.overlay = this.createElement('div', 'oauth-modal-overlay');
        this.contentContainer = this.createElement('div', 'oauth-modal-content');

        const title = this.createElement('h3', '', 'Отсканируйте QR-код');
        this.contentContainer.appendChild(title);

        // Лоадер
        this.loader = this.createElement('div', 'oauth-loader');
        this.loader.innerHTML = '<div class="oauth-spinner"></div>';
        this.contentContainer.appendChild(this.loader);

        // Контейнер для QR-кода
        this.qrContainer = this.createElement('div', 'oauth-qrcode-container');
        this.contentContainer.appendChild(this.qrContainer);

        // Таймер
        this.timerContainer = this.createElement('div', 'oauth-timer-container');
        this.contentContainer.appendChild(this.timerContainer);

        // Разделитель
        this.separator = this.createElement('p', 'oauth-modal-separator', 'ИЛИ');
        this.contentContainer.appendChild(this.separator);

        // Кнопка входа
        this.loginButton = this.createElement('button', 'oauth-login-button', 'Войдите с текущего устройства');
        this.contentContainer.appendChild(this.loginButton);

        // Контейнер для ошибки
        this.errorContainer = this.createElement('div', 'oauth-error-container');
        this.errorContainer.style.display = 'none';
        this.contentContainer.appendChild(this.errorContainer);

        this.overlay.appendChild(this.contentContainer);
        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) {
                this.close();
                if (this.errorContainer?.style.display == 'block') {
                    this.rejectPromise!();
                }
            }
        });
        document.body.appendChild(this.overlay);
    }

    private async generateQR(container: HTMLElement, data: string): Promise<void> {
        try {
            container.innerHTML = '';
            const canvas = document.createElement('canvas');
            await QRCode.toCanvas(canvas, data, {width: 200, margin: 1});
            container.appendChild(canvas);
        } catch (err) {
            console.error('Ошибка при генерации QR-кода:', err);
            container.innerHTML = '<p>Не удалось загрузить QR-код</p>';
        }
    }

    private startTimer(validUntil: string) {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const updateTimer = () => {
            const now = new Date().getTime();
            const targetTime = new Date(validUntil).getTime();
            const difference = targetTime - now;

            if (difference > 0) {
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                this.timerContainer!.textContent = `Ссылка действительна еще: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            } else {
                clearInterval(this.timerInterval!);
                this.timerInterval = null;
                this.renderExpiredState();
            }
        };

        updateTimer();
        this.timerInterval = window.setInterval(updateTimer, 1000);
    }

    private setLoadingState() {
        this.loader!.style.display = 'flex';
        this.qrContainer!.style.display = 'none';
        this.separator!.style.display = 'none';
        this.loginButton!.style.display = 'none';
        this.errorContainer!.style.display = 'none';
        this.timerContainer!.style.display = 'none';
    }

    private renderSuccessState(session: AuthSession) {
        this.loader!.style.display = 'none';
        this.errorContainer!.style.display = 'none';
        this.qrContainer!.style.display = 'flex';
        this.separator!.style.display = 'block';
        this.loginButton!.style.display = 'block';

        const link = session.links[0]!.link;
        this.generateQR(this.qrContainer!, link);
        this.loginButton!.onclick = () => window.open(link);

        this.authEvent = createAuthEvent(() => {
            this.close()
            this.resolvePromise!();
        }, (err: any) => this.renderErrorState(err));

        if (session.validUntil) {
            this.timerContainer!.style.display = 'block';
            this.startTimer(session.validUntil);
        } else {
            this.timerContainer!.style.display = 'none';
        }
    }

    private renderErrorState(error: any) {
        this.loader!.style.display = 'none';
        this.qrContainer!.style.display = 'none';
        this.separator!.style.display = 'none';
        this.loginButton!.style.display = 'none';
        this.timerContainer!.style.display = 'none';
        this.errorContainer!.style.display = 'block';
        this.errorContainer!.innerHTML = `
            <p class="oauth-error-message">Ошибка: ${error.message || 'Неизвестная ошибка'}</p>
            <button class="oauth-retry-button">Повторить</button>
        `;
        this.errorContainer!.querySelector('.oauth-retry-button')!.addEventListener('click', () => {
            this.startAuthFlow()
        });
    }

    private renderExpiredState() {
        this.qrContainer!.style.display = 'none';
        this.separator!.style.display = 'none';
        this.loginButton!.style.display = 'none';
        this.errorContainer!.style.display = 'block';
        this.errorContainer!.innerHTML = `
            <p class="oauth-error-message">Срок действия ссылки истек.</p>
            <button class="oauth-retry-button">Обновить</button>
        `;
        this.errorContainer!.querySelector('.oauth-retry-button')!.addEventListener('click', () => {
            this.startAuthFlow();
        });
    }

    // Добавим свойство для хранения данных запроса
    private requestData: AuthSessionTime | null = null;

    public async show(requestData: AuthSessionTime): Promise<void> {
        if (this.isOpen) {
            // Если уже открыт, возвращаем существующий promise
            return this.currentPromise!;
        }

        this.requestData = requestData;

        this.currentPromise = new Promise<void>((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
        });

        if (!this.overlay) this.createModal();

        this.isOpen = true;
        setTimeout(() => this.overlay?.classList.add('active'), 10);

        // Запускаем процесс авторизации
        this.startAuthFlow();

        return this.currentPromise;
    }

    private async startAuthFlow() {
        if (!this.requestData) return; // Нечего делать, если нет данных

        this.setLoadingState();
        try {
            const session = await createAuthSession(this.requestData);
            this.renderSuccessState(session);
        } catch (error) {
            this.renderErrorState(error);
        }
    }

    public close(): void {
        if (!this.isOpen || !this.overlay) return;

        if (this.authEvent) {
            this.authEvent.close();
        }

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.overlay.classList.remove('active');
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            this.overlay = null;
            this.isOpen = false;
            this.requestData = null;
        }, 400); // Время должно совпадать с transition в CSS
    }
}