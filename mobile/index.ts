import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// Works for Expo Go (JS-only) and native binaries (EAS / expo run); native modules need a dev or release build, not Expo Go alone.
registerRootComponent(App);
