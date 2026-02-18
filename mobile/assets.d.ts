/** Allow ESM-style imports of image assets (Metro resolves these to numeric IDs at runtime). */
declare module '*.png' {
  import type { ImageSourcePropType } from 'react-native';
  const value: ImageSourcePropType;
  export default value;
}
