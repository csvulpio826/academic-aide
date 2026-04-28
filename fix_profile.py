import re

path = '/data/.openclaw/workspace/projects/Academic_Aide/academic-aide/src/screens/ProfileScreen.tsx'
with open(path, 'r') as f:
    code = f.read()

# Typography
code = code.replace('typography.fontSize.xs', 'typography.fontSizeXS')
code = code.replace('typography.fontSize.sm', 'typography.fontSizeSM')
code = code.replace('typography.fontSize.base', 'typography.fontSizeMD')
code = code.replace('typography.fontSize.md', 'typography.fontSizeMD')
code = code.replace('typography.fontSize.lg', 'typography.fontSizeLG')
code = code.replace('typography.fontSize.xl', 'typography.fontSizeXL')

code = code.replace('typography.fontWeight.light', 'typography.fontWeightLight')
code = code.replace('typography.fontWeight.regular', 'typography.fontWeightRegular')
code = code.replace('typography.fontWeight.medium', 'typography.fontWeightMedium')
code = code.replace('typography.fontWeight.semibold', 'typography.fontWeightSemiBold')
code = code.replace('typography.fontWeight.bold', 'typography.fontWeightBold')

# Colors
code = code.replace('colors.text.primary', 'colors.textPrimary')
code = code.replace('colors.text.secondary', 'colors.textSecondary')
code = code.replace('colors.text.tertiary', 'colors.textMuted')
code = code.replace('colors.cardBorder', 'colors.border')
code = code.replace('colors.card', 'colors.cardBackground')
code = code.replace('colors.error', 'colors.danger')
code = code.replace('colors.white', 'colors.background')

with open(path, 'w') as f:
    f.write(code)
