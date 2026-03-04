import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const projectRuleOverrides = {
  rules: {
    "react-hooks/immutability": "off",
    "react-hooks/set-state-in-effect": "off",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "@typescript-eslint/no-require-imports": "off",
    "prefer-const": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
}

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  projectRuleOverrides,
]

export default eslintConfig
