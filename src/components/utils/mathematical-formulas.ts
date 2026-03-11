const Float = (equation, precision = 4) => {
    return Math.round(equation * (10 ** precision)) / (10 ** precision);
}

export default Float;