const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

const empty = path.resolve(__dirname, "empty.js");

config.resolver.extraNodeModules = {
  ws: empty,
  stream: empty,
  http: empty,
  https: empty,
  net: empty,
  tls: empty,
  zlib: empty,
  fs: empty,
  util: empty,
  crypto: empty,
  child_process: empty,
  module: empty,
  "@supabase/realtime-js": empty,
};

module.exports = withNativeWind(config, { input: "./app/globals.css" });
