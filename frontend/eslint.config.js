import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
// IMPORTANT: Ensure "typescript-eslint" is correct.
// The official packages are "@typescript-eslint/parser" and "@typescript-eslint/eslint-plugin"
// If you are using a third-party package named "typescript-eslint", check that it is the new flat-config helper.
import tseslint from "typescript-eslint"

export default tseslint.config(
    {ignores: ["dist"]},       // Tells ESLint to ignore the dist folder
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ["**/*.{ts,tsx}"],  // Lint all TS/TSX files
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            // Only warn when you export components that can break fast-refresh
            "react-refresh/only-export-components": [
                "warn",
                {allowConstantExport: true}
            ]
        },
    }
)
