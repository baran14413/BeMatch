
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bematch.bematch',
  appName: 'BeMatch',
  webDir: '.next',
  server: {
    url: 'https://studio--bematch-f168d.us-central1.hosted.app',
    cleartext: true
  }
};

export default config;
