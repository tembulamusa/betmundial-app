const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

const config = {
    resolver: {
        sourceExts: [
            ...defaultConfig.resolver.sourceExts,
            "css",
            "svg", // ✅ ADD SVG HERE
        ],
        assetExts: defaultConfig.resolver.assetExts.filter(
            (ext) => ext !== "css" && ext !== "svg" // ✅ REMOVE SVG FROM ASSETS
        ),
        resolverMainFields: ["react-native", "browser", "main"],
    },

    transformer: {
        babelTransformerPath: require.resolve("react-native-svg-transformer"), // ✅ USE SVG TRANSFORMER

        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: true,
            },
        }),
    },

    cacheStores: [],
};

module.exports = mergeConfig(defaultConfig, config);