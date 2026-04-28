import fs from 'fs';

let code = fs.readFileSync('src/screens/ProfileScreen.tsx', 'utf8');

// Typography
code = code.replace(/typography\.fontSize\.xs/g, 'typography.fontSizeXS');
code = code.replace(/typography\.fontSize\.sm/g, 'typography.fontSizeSM');
code = code.replace(/typography\.fontSize\.base/g, 'typography.fontSizeMD');
code = code.replace(/typography\.fontSize\.md/g, 'typography.fontSizeMD');
code = code.replace(/typography\.fontSize\.lg/g, 'typography.fontSizeLG');
code = code.replace(/typography\.fontSize\.xl/g, 'typography.fontSizeXL');

code = code.replace(/typography\.fontWeight\.light/g, 'typography.fontWeightLight');
code = code.replace(/typography\.fontWeight\.regular/g, 'typography.fontWeightRegular');
code = code.replace(/typography\.fontWeight\.medium/g, 'typography.fontWeightMedium');
code = code.replace(/typography\.fontWeight\.semibold/g, 'typography.fontWeightSemiBold');
code = code.replace(/typography\.fontWeight\.bold/g, 'typography.fontWeightBold');

// Colors
code = code.replace(/colors\.text\.primary/g, 'colors.textPrimary');
code = code.replace(/colors\.text\.secondary/g, 'colors.textSecondary');
code = code.replace(/colors\.text\.tertiary/g, 'colors.textMuted');
code = code.replace(/colors\.cardBorder/g, 'colors.border');
code = code.replace(/colors\.card/g, 'colors.cardBackground');
code = code.replace(/colors\.error/g, 'colors.danger');
code = code.replace(/colors\.white/g, 'colors.background');

fs.writeFileSync('src/screens/ProfileScreen.tsx', code);
