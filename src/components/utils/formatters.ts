export const formatToFloat = (value, decimalPlaces = 2) => {
    if (value === null || value === undefined || value === '') {
        return (0).toFixed(decimalPlaces);
    }

    const number = parseFloat(value);

    if (isNaN(number)) {
        return (0).toFixed(decimalPlaces);
    }

    return number.toFixed(decimalPlaces);
};
