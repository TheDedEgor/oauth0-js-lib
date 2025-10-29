import { defineConfig } from "vite";
import path from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
    plugins: [
        dts({
            insertTypesEntry: true,
            include: ["src/**/*"],
            outDir: "dist",
            compilerOptions: {
                declaration: true,
                emitDeclarationOnly: true,
                declarationMap: false,
            },
        }),
    ],
    build: {
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            name: "oauth0-js-lib",
            fileName: (format) => `index.${format}.js`,
            formats: ["es", "umd"],
        },
        rollupOptions: {
            external: ["axios", "qrcode"],
            output: {
                globals: {
                    axios: "axios",
                    qrcode: "QRCode",
                },
            },
        },
    },
});
