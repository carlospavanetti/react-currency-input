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

    precision = Math.max(precision, 0); // precision cannot be negative
    precision = Math.min(precision, 20); // precision cannot be greater than 20

    //if the given value is a Number, let's convert into String to manipulate that
    value = String(value);

    // extract digits. if no digits, fill in a zero.
    let digits = value.match(/\d/g) || ['0'];

    // number will be negative if we have an odd number of "-";
    // ideally, we should only ever have 0, 1 or 2 (positive number, making a number negative
    // and making a negative number positive, respectively);
    // if every digit in the array is '0', then the number should never be negative
    const allDigitsAreZero = digits.every(digit => digit === '0');
    const negativeSignCount = (value.match(/-/g) || []).length;
    const negativeSignCountAreOdd = negativeSignCount % 2 === 1;
    const numberIsNegative =
        allowNegative && !allDigitsAreZero && negativeSignCountAreOdd;

    // zero-pad a input
    while (digits.length <= precision) {
        digits.unshift('0');
    }

    if (precision > 0) {
        // add the decimal separator
        digits.splice(digits.length - precision, 0, '.');
    }

    // clean up extraneous digits like leading zeros.
    digits = Number(digits.join(''))
        .toFixed(precision)
        .split('');
    let raw = Number(digits.join(''));

    let decimalpos = digits.length - precision - 1; // -1 needed to position the decimal separator before the digits.
    if (precision > 0) {
        // set the final decimal separator
        digits[decimalpos] = decimalSeparator;
    } else {
        // when precision is 0, there is no decimal separator.
        decimalpos = digits.length;
    }

    // add in any thousand separators
    for (let x = decimalpos - 3; x > 0; x = x - 3) {
        digits.splice(x, 0, thousandSeparator);
    }

    // if we have a prefix or suffix, add them in.
    if (prefix.length > 0) {
        digits.unshift(prefix);
    }
    if (suffix.length > 0) {
        digits.push(suffix);
    }

    // if the number is negative, insert a "-" to
    // the front of the array and negate the raw value
    if (allowNegative && numberIsNegative) {
        digits.unshift('-');
        raw = -raw;
    }

    return {
        value: raw,
        maskedValue: digits.join('').trim()
    };
}

function isEmpty(value) {
    return value === null || value === undefined || String(value).length == 0;
}

const emptyResult = {
    value: 0,
    maskedValue: ''
};
