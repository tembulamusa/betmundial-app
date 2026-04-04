export const normalizeKenyanPhoneNumber = (value: string) => {
    const digitsOnly = (value || "").replace(/\D/g, "");
    const lastNineDigits = digitsOnly.slice(-9);

    if (/^2540(7|1)\d{8}$/.test(digitsOnly)) {
        return `0${digitsOnly.slice(4)}`;
    }

    if (/^(7|1)\d{8}$/.test(digitsOnly)) {
        return `0${digitsOnly}`;
    }

    if (/^(07|01)\d{8}$/.test(digitsOnly)) {
        return digitsOnly;
    }

    if (/^254(7|1)\d{8}$/.test(digitsOnly)) {
        return `0${digitsOnly.slice(3)}`;
    }

    if (/^(7|1)\d{8}$/.test(lastNineDigits)) {
        return `0${lastNineDigits}`;
    }

    return digitsOnly;
};

export const isValidKenyanPhoneNumber = (value: string) => {
    const normalized = normalizeKenyanPhoneNumber(value);
    return /^(07|01)\d{8}$/.test(normalized);
};
