const fs = require('fs');
const path = require('path');

const iconMap = {
  // Navigation & General
  'House': 'Home',
  'FileText': 'DocumentText',
  'Warning': 'Danger',
  'Newspaper': 'Book',
  'ChatCircle': 'MessageSquare',
  'Gear': 'Setting2',
  'Building': 'Building',
  'SignOut': 'Logout',
  'IdentificationBadge': 'Personalcard',
  'MapPin': 'Location',
  'ListChecks': 'Scroll',
  'Plus': 'Add',
  'Trash': 'Trash',
  'Eye': 'Eye',
  'Power': 'CloseCircle',
  'UserSwitch': 'UserEdit',
  'Download': 'DocumentDownload',
  'ArrowLeft': 'ArrowLeft',
  'ArrowRight': 'ArrowRight',
  'CheckCircle': 'TickCircle',
  'Palette': 'Colorfilter',
  'UserPlus': 'UserAdd',
  'ClipboardText': 'ClipboardText',
  'ClockCountdown': 'Timer',
  'WarningCircle': 'Danger',
  'Package': 'Box',
  'MapPinLine': 'Location',
  'Key': 'Key',
  'ShieldCheck': 'ShieldTick',
  'ArrowsClockwise': 'Refresh',
  'Check': 'TickSquare',
  'X': 'CloseCircle',
  'Clock': 'Clock',
  'ShieldPlus': 'ShieldSearch',
  'Calendar': 'Calendar',
  'PencilSimple': 'Edit',
  'PaperPlane': 'Send',
  'Users': 'People',
  'EyeSlash': 'EyeSlash',
  'User': 'User',
  'MagnifyingGlass': 'SearchNormal1',
  'QrCode': 'Barcode',
  'CaretLeft': 'ArrowLeft2',
  'CaretRight': 'ArrowRight2',
  'Sun': 'Sun1',
  'Moon': 'Moon',
  'Info': 'InfoCircle',
  'Bell': 'Notification',
  'CaretDown': 'ArrowDown2',
  'CaretUp': 'ArrowUp2',
  'ChatDots': 'MessageText',
  'FilePdf': 'DocumentText',
  'Funnel': 'Filter',
  'Pencil': 'Edit',
  'Envelope': 'Sms',
  'Phone': 'Call',
  'Paperclip': 'Paperclip',
  'Shield': 'Shield',
  'Camera': 'Camera',
  'Image': 'Image',
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next' && f !== 'dist') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const targetDir = "c:\\Users\\Lawrence\\Documents\\PROJECTS\\AGAP\\agapp-system\\apps\\admin\\src";

walkDir(targetDir, filePath => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('@phosphor-icons/react')) return;

  console.log(`Processing file: ${filePath}`);

  // Find phosphor import block, strictly limited within the import brackets
  const importRegex = /import\s*\{([^\}]+)\}\s*from\s*['"]@phosphor-icons\/react['"];?/g;
  let match;
  let newContent = content;

  while ((match = importRegex.exec(content)) !== null) {
    const importBlock = match[0];
    const importedParts = match[1]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const mappedImportedParts = importedParts.map(part => {
      const tokens = part.split(/\s+as\s+/);
      const icon = tokens[0].trim();
      const alias = tokens[1] ? tokens[1].trim() : null;

      const mapped = iconMap[icon];
      if (!mapped) {
        console.warn(`Warning: No mapping found for icon "${icon}" in file ${filePath}`);
        return part;
      }
      return alias ? `${mapped} as ${alias}` : mapped;
    });

    // Remove duplicates
    const uniqueParts = [...new Set(mappedImportedParts)];
    const newImportBlock = `import { ${uniqueParts.join(', ')} } from 'iconsax-react';`;
    newContent = newContent.replace(importBlock, newImportBlock);

    // Replace JSX occurrences and variable name occurrences for each imported icon
    importedParts.forEach(part => {
      const tokens = part.split(/\s+as\s+/);
      const icon = tokens[0].trim();
      const alias = tokens[1] ? tokens[1].trim() : null;

      const targetTagName = alias || icon;
      const newIcon = iconMap[icon];
      if (!newIcon) return;

      const newTagName = alias || newIcon;

      // Replace variable references (word-bounded) if not aliased and name changed
      if (!alias && icon !== newIcon) {
        const varRegex = new RegExp(`\\b${icon}\\b`, 'g');
        newContent = newContent.replace(varRegex, newIcon);
      }

      // Replace open tag, e.g. <House -> <Home variant="Bold"
      const openTagRegex = new RegExp(`<${targetTagName}(\\s|>)`, 'g');
      newContent = newContent.replace(openTagRegex, (m, suffix) => {
        return `<${newTagName} variant="Bold"${suffix}`;
      });

      // Replace close tag, e.g. </House> -> </Home>
      const closeTagRegex = new RegExp(`</${targetTagName}>`, 'g');
      newContent = newContent.replace(closeTagRegex, `</${newTagName}>`);

      // Strip weight="..." attributes specifically from the newIcon tag
      const stripWeightRegex = new RegExp(`<${newTagName}([^>]*?)\\sweight\\s*=\\s*(?:\{[^}]*\}|"[^"]*"|'[^']*')([^>]*?>)`, 'gs');
      newContent = newContent.replace(stripWeightRegex, `<${newTagName}$1$2`);
    });
  }

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Successfully migrated ${filePath}`);
  }
});
