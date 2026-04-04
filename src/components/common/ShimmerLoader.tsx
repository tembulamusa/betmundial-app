import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { theme } from '../../theme';

interface ShimmerLoaderProps {
    count?: number;
    height?: number;
    marginVertical?: number;
}

const ShimmerLoader: React.FC<ShimmerLoaderProps> = ({
    count = 3,
    height = 100,
    marginVertical = 8,
}) => {
    return (
        <View style={styles.container}>
            {Array.from({ length: count }).map((_, index) => (
                <ShimmerPlaceholder
                    key={index}
                    visible={false}
                    shimmerStyle={styles.shimmerItem}
                    style={{
                        height,
                        marginVertical,
                        borderRadius: 8,
                    }}
                />
            ))}
        </View>
    );
};

export default ShimmerLoader;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    shimmerItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
    },
});
