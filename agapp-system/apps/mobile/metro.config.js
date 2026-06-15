const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

// Only look in the mobile app's own node_modules first, then root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force every package to resolve react/react-native from the mobile app's
// own node_modules. This prevents the monorepo root (which has react@18
// for admin/api) from leaking into the mobile bundle.
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Block the root node_modules/react and root node_modules/react-dom so
// Metro can never accidentally pull React 18 in, and block the local src/
// folder which contains web-only React DOM code not compatible with React Native.
config.resolver.blockList = [
  new RegExp(
    escapeRegex(path.resolve(monorepoRoot, 'node_modules', 'react') + path.sep) + '.*'
  ),
  new RegExp(
    escapeRegex(path.resolve(monorepoRoot, 'node_modules', 'react-dom') + path.sep) + '.*'
  ),
  new RegExp(
    escapeRegex(path.resolve(projectRoot, 'src') + path.sep) + '.*'
  ),
];

module.exports = config;
