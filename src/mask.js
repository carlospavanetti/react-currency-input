export default function mask(
    value,
    precision = 2,
    decimalSeparator = '.',
    thousandSeparator = ',',
    allowNegative = false,
    prefix = '',
    suffix = ''
) {
    // provide some default values and arg validation.
    if (isEmpty(value)) return emptyResult;

    //if the given value is a Number, let's convert into String to manipulate that
    value = String(value);

    precision = Math.max(precision, 0); // precision cannot be negative
    precision = Math.min(precision, 20); // precision cannot be greater than 20

    // extract digits. if no digits, fill in a zero.
    const digits = withSetPrecision(value, precision);
    const raw = Number(digits.join(''));

    // number will be negative if we have an odd number of "-";
    // ideally, we should only ever have 0, 1 or 2 (positive number, making a number negative
    // and making a negative number positive, respectively);
    // if raw value is 0, then the number should never be negative.
    const negativeSignCount = (value.match(/-/g) || []).length;
    const negativeSignCountAreOdd = negativeSignCount % 2 === 1;
    const numberIsNegative =
        allowNegative && raw !== 0 && negativeSignCountAreOdd;
    const minusSign = numberIsNegative ? '-' : '';

    const masked = valueWithSeparators(
        digits,
        precision,
        decimalSeparator,
        thousandSeparator
    );
    return {
        value: numberIsNegative ? -raw : raw,
        maskedValue: `${minusSign}${prefix}${masked}${suffix}`.trim()
    };
}

function isEmpty(value) {
    return value === null || value === undefined || String(value).length == 0;
}

const emptyResult = {
    value: 0,
    maskedValue: ''
};

function withSetPrecision(value, precision) {
    const pipe = (fns, input) => fns.reduce((acc, fn) => fn(acc), input);
    const pipeline = [
        digitsFromValue,
        digits => zeroPadded(digits, precision),
        digits => withDecimalSeparator(digits, precision),
        digits => cleanOfExtraneousDigits(digits, precision)
    ];
    return pipe(pipeline, value);
}

function digitsFromValue(value) {
    return value.match(/\d/g) || ['0'];
}

function zeroPadded(digits, precision) {
    const missings = digits.length - precision + 1;
    return Array(missings)
        .fill('0')
        .concat(digits);
}

function withDecimalSeparator(digits, precision) {
    const integer = digits.slice(0, digits.length - precision);
    const decimal = digits.slice(digits.length - precision);
    return precision > 0 ? [...integer, '.', ...decimal] : digits;
}

function cleanOfExtraneousDigits(digits, precision) {
    // clean up extraneous digits like leading zeros.
    return Number(digits.join(''))
        .toFixed(precision)
        .split('');
}

function valueWithSeparators(
    digits,
    precision,
    decimalSeparator,
    thousandSeparator
) {
    const masked = [...digits];
    const decimalpos = masked.length - precision - 1; // -1 needed to position the decimal separator before the digits.
    if (precision > 0) masked[decimalpos] = decimalSeparator;

    const integerStart = precision > 0 ? decimalpos : masked.length;
    for (let x = integerStart - 3; x > 0; x = x - 3) {
        masked.splice(x, 0, thousandSeparator);
    }
    return masked.join('');
}
