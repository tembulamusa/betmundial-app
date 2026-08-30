module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // react-native-dotenv plugin removed: nothing in the app imports from "@env";
  // env vars are read via react-native-config's `Config` object instead
  // (see src/components/utils/makeRequest.ts).
};