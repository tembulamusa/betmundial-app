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
    height = 50,
    marginVertical = 8,
}) => {
    return (
        <View style={styles.container}>
            {Array.from({ length: count }).map((_, index) => (
                <ShimmerPlaceholder
                    key={index}
                    visible={false}
                    shimmerColors={['rgba(12, 32, 76, 0.2)', 'rgba(24, 50, 110, 0.35)', 'rgba(12, 32, 76, 0.2)']}
                    shimmerStyle={styles.shimmerItem}
                    style={[styles.shimmerContainer, {
                        height,
                        marginVertical,
                    }]}
                />
            ))}
        </View>
    );
};

export default ShimmerLoader;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 4,
        paddingVertical: 8,
        width: '100%',
    },
    shimmerContainer: {
        width: '100%',
        borderRadius: 8,
        backgroundColor: 'rgba(10, 32, 72, 0.45)',
    },
    shimmerItem: {
        backgroundColor: 'rgba(12, 38, 90, 0.35)',
        borderRadius: 4,
    },
});
