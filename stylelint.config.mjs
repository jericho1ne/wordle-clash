export default {
  overrides: [
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss',
    },
  ],
  rules: {
    'at-rule-empty-line-before': ['always', { except: ['first-nested'] }],
    'rule-empty-line-before': ['always', { except: ['first-nested'] }],
  },
}
