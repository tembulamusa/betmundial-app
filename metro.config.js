const path = require("path");
const fs = require("fs");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { FileStore } = require("metro-cache");

const defaultConfig = getDefaultConfig(__dirname);

// Keep cache inside the project — Windows TEMP\metro-cache often hits ENOTEMPTY on clear
const metroCacheRoot = path.join(__dirname, "node_modules", ".cache", "metro");

try {
    fs.mkdirSync(metroCacheRoot, { recursive: true });
} catch (_) {
    // ignore
}

/**
 * Windows can throw ENOTEMPTY/EBUSY while Metro clears cache dirs.
 * Swallow those so release bundling can continue.
 */
class SafeFileStore extends FileStore {
    clear() {
        try {
            super.clear();
        } catch (error) {
            if (
                error &&
                (error.code === "ENOTEMPTY" ||
                    error.code === "EBUSY" ||
                    error.code === "EPERM" ||
                    error.code === "ENOENT")
            ) {
                return;
            }
            throw error;
        }
    }
}

const config = {
    resolver: {
        sourceExts: [
            ...defaultConfig.resolver.sourceExts,
            "css",
            "svg",
        ],
        assetExts: defaultConfig.resolver.assetExts.filter(
            (ext) => ext !== "css" && ext !== "svg"
        ),
        resolverMainFields: ["react-native", "browser", "main"],
        blockList: [
            /android[\\/]\.cxx[\\/].*/,
            /android[\\/]\.gradle[\\/].*/,
            /android[\\/]app[\\/]build[\\/].*/,
            /android[\\/]build[\\/].*/,
            /android[\\/]app[\\/]\.cxx[\\/].*/,
        ],
    },

    watcher: {
        additionalExts: ["css"],
        healthCheck: {
            enabled: true,
            interval: 30000,
            timeout: 10000,
        },
    },

    cacheStores: [
        new SafeFileStore({
            root: metroCacheRoot,
        }),
    ],

    transformer: {
        babelTransformerPath: require.resolve("react-native-svg-transformer"),

        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: true,
            },
        }),
    },
};

module.exports = mergeConfig(defaultConfig, config);
