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
        paddingHorizontal: 0,
        paddingVertical: 8,
        width: '100%',
    },
    shimmerContainer: {
        width: '100%',
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    shimmerItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
    },
});
