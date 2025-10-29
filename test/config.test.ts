import { getConfig, setConfig } from "@/config.js";
import { expect, test } from "vitest";

test("set and get config", () => {
    setConfig({
        serviceUrl: "service",
        botUrl: "url",
        webAppDirectLink: "link",
    });

    const config = getConfig();
    expect(config.serviceUrl).toBe("service");
    expect(config.botUrl).toBe("url");
    expect(config.webAppDirectLink).toBe("link");
});
