// Adds the missing `refs` property to NativeMethods so that View/Text satisfy
// React.Component's interface when compiling JSX in a standalone tsc build.
import 'react-native';

declare module 'react-native' {
  interface NativeMethods {
    refs: { [key: string]: import('react').ReactInstance };
  }
}
