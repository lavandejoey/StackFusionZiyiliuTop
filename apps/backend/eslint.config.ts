import eslint from "@eslint/js";
import eslintPkg from "eslint";

// Some installed ESLint versions may not export `defineConfig` at runtime.
// Provide a safe fallback that returns the config object unchanged.
const defineConfig = (eslintPkg as any).defineConfig ?? ((c: any) => c);
import tseslint from "typescript-eslint";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import stylistic from "@stylistic/eslint-plugin";
import nodePlugin from "eslint-plugin-n";

export default defineConfig(tseslint.config(
    eslint.configs.recommended,
    nodePlugin.configs["flat/recommended-script"],
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        ignores: [
            "**/node_modules/*",
            "**/*.mjs",
            "**/*.js",
            // Don't attempt to lint the ESLint config file itself
            "eslint.config.ts",
        ],
    },
    {
        languageOptions: {
            parserOptions: {
                // Use a dedicated tsconfig for ESLint that enables ESM features
                project: "./tsconfig.eslint.json",
                // Ensure typescript-eslint resolves the correct tsconfig when multiple project roots exist
                tsconfigRootDir: __dirname,
                warnOnUnsupportedTypeScriptVersion: false,
            },
        },
    },
    {
        plugins: {
            "@stylistic": stylistic,
        },
    },
    {
        // Only target project source files for linting (avoid config/build files)
        files: ["src/**/*.ts", "tests/**/*.ts"],
    },
    {
        rules: {
            "@typescript-eslint/explicit-member-accessibility": "warn",
            "@typescript-eslint/no-misused-promises": 0,
            "@typescript-eslint/no-floating-promises": 0,
            "@typescript-eslint/no-confusing-void-expression": 0,
            "@typescript-eslint/no-unnecessary-condition": 0,
            "@typescript-eslint/restrict-template-expressions": [
                "error", { allowNumber: true },
            ],
            "@typescript-eslint/restrict-plus-operands": [
                "warn", { allowNumberAndString: true },
            ],
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-unsafe-enum-comparison": 0,
            "@typescript-eslint/no-unnecessary-type-parameters": 0,
            "@stylistic/no-extra-semi": "warn",
            "max-len": [
                "warn",
                {
                    "code": 120,
                },
            ],
            "@stylistic/semi": ["warn", "always"],
            "@stylistic/member-delimiter-style": ["warn", {
                "multiline": {
                    "delimiter": "comma",
                    "requireLast": true,
                },
                "singleline": {
                    "delimiter": "comma",
                    "requireLast": false,
                },
                "overrides": {
                    "interface": {
                        "singleline": {
                            "delimiter": "semi",
                            "requireLast": false,
                        },
                        "multiline": {
                            "delimiter": "semi",
                            "requireLast": true,
                        },
                    },
                },
            }],
            "@typescript-eslint/no-non-null-assertion": 0,
            "@typescript-eslint/no-unused-expressions": "warn",
            "comma-dangle": ["warn", "always-multiline"],
            "no-console": 1,
            "no-extra-boolean-cast": 0,
            "indent": ["warn", 4],
            "quotes": ["warn", "double"],
            "n/no-process-env": 1,
            "n/no-missing-import": 0,
            "n/no-unpublished-import": 0,
            "prefer-const": "warn",
        },
    },
));
