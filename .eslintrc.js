/**
 * @type {import("eslint").Linter.Config}
 */
const config = {
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    '*.d.ts',
    '*.js',
    '*.css',
    'dist/**',
    '.github/**/*',
    '*.example.jsx',
  ],
  extends: [
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    'prettier/prettier': ['error', {
      "endOfLine": "auto"
    }],
    'no-console': ['error', { allow: ['error', 'debug', 'warn'] }],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: [
        '@typescript-eslint/eslint-plugin', 'unused-imports'
      ],
      extends: ['plugin:@typescript-eslint/recommended',],
      rules: {
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': ['off', {
          ignoreRestArgs: true,
        }],
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
        "@typescript-eslint/no-unused-vars": "off", // handled by no-unused-imports
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": [
          "warn",
          {
            "vars": "all",
            "varsIgnorePattern": "^_",
            "args": "after-used",
            "argsIgnorePattern": "^_",
            "caughtErrors": "all",
            "caughtErrorsIgnorePattern": "^_",
            "destructuredArrayIgnorePattern": "^_"
          }
        ],
      },
    },
  ]
}

module.exports = config
