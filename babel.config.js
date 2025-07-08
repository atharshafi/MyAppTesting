// babel.config.js
export const presets = ['module:@react-native/babel-preset'];
export const plugins = [
  /* Enables Vision‑Camera / Worklets */
  ['react-native-worklets-core/plugin'],

  /* Enables runOnJS() and other Reanimated helpers.
     ⚠️  MUST stay LAST in this list. */
  'react-native-reanimated/plugin',
];
