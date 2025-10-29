/// <reference types="vite/client" />

import type { OauthConfig } from "./config";

declare global {
  const __OAUTH_LIB_CONFIG__: OauthConfig | undefined;
}
