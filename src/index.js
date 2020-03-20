import './object-assign-polyfill';

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import mask from './mask.js';

// IE* parseFloat polyfill
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/parseFloat#Polyfill
Number.parseFloat = parseFloat;

function FunctionalComponent(props) {
    const customProps = onlyCustomFrom(props);
    return (
        <input
            ref={props._ref}
            type={props.inputType}
            value={props.maskedValue}
            onChange={props.handleChange}
            onFocus={props.handleFocus}
            onMouseUp={props.handleFocus}
            {...customProps}
        />
    );
}

class CurrencyInput extends Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.setSelectionRange = this.setSelectionRange.bind(this);
        this.state = prepareProps(this.props);
        this.props.liftMaskedValue(this.state.maskedValue);
        this.inputSelectionEnd = 1;
    }

    /**
     * General function used to cleanup and define the final props used for rendering
     * @returns {{ maskedValue: {String}, value: {Number} }}
     */

    // /**
    //  * Component lifecycle function.
    //  * Invoked when a component is receiving new props. This method is not called for the initial render.
    //  *
    //  * @param nextProps
    //  * @see https://facebook.github.io/react/docs/component-specs.html#updating-componentwillreceiveprops
    //  */
    // UNSAFE_componentWillReceiveProps(nextProps) {
    //     this.setState(this.prepareProps(nextProps));
    // }

    /**
     * Component lifecycle function.
     * @returns {XML}
     * @see https://facebook.github.io/react/docs/react-component.html#componentdidmount
     */
    componentDidMount() {
        firstEffect(
            this.theInput,
            this.state.maskedValue,
            this.props.suffix,
            this.setSelectionRange,
            this.props.autoFocus
        );
    }

    /**
     * Component lifecycle function
     * @returns {XML}
     * @see https://facebook.github.io/react/docs/react-component.html#componentwillupdate
     */
    UNSAFE_componentWillUpdate() {
        let node = ReactDOM.findDOMNode(this.theInput);
        this.inputSelectionEnd = node.selectionEnd;
    }

    /**
     * Component lifecycle function.
     * @returns {XML}
     * @see https://facebook.github.io/react/docs/react-component.html#componentdidupdate
     */
    componentDidUpdate(prevProps, prevState) {
        nextEffect(
            prevState,
            this.theInput,
            this.state.maskedValue,
            this.props.decimalSeparator,
            this.props.thousandSeparator,
            this.props.precision,
            this.props.prefix,
            this.props.suffix,
            this.setSelectionRange,
            this.inputSelectionEnd
        );
    }

    /**
     * Set selection range only if input is in focused state
     * @param node DOMElement
     * @param start number
     * @param end number
     */
    setSelectionRange(node, start, end, setForComponent) {
        if (document.activeElement === node) {
            node.setSelectionRange(start, end);
        }
        if (setForComponent) {
            this.inputSelectionEnd = end;
        }
    }

    /**
     * onChange Event Handler
     * @param event
     */
    handleChange(event) {
        handleChange_(event, this.props, this.setState.bind(this));
    }

    /**
     * onFocus Event Handler
     * @param event
     */
    handleFocus(event) {
        this.inputSelectionEnd = handleFocus_(
            event,
            this.theInput,
            this.props.prefix,
            this.props.suffix,
            this.props.selectAllOnFocus
        );
    }

    handleBlur(event) {
        this.inputSelectionEnd = 0;
    }

    /**
     * Component lifecycle function.
     * @returns {XML}
     * @see https://facebook.github.io/react/docs/component-specs.html#render
     */
    render() {
        const _ref = (input => {
            this.theInput = input;
        }).bind(this);
        return (
            <FunctionalComponent
                _ref={_ref}
                inputType={this.props.inputType}
                maskedValue={this.state.maskedValue}
                handleChange={this.handleChange}
                handleFocus={this.handleFocus}
                {...this.props}
            />
        );
    }
}

/**
 * Prop validation.
 * @see https://facebook.github.io/react/docs/component-specs.html#proptypes
 */

CurrencyInput.propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    decimalSeparator: PropTypes.string,
    thousandSeparator: PropTypes.string,
    precision: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    inputType: PropTypes.string,
    allowNegative: PropTypes.bool,
    allowEmpty: PropTypes.bool,
    prefix: PropTypes.string,
    suffix: PropTypes.string,
    selectAllOnFocus: PropTypes.bool
};

CurrencyInput.defaultProps = {
    onChange: function(maskValue, value, event) {
        /*no-op*/
    },
    onChangeEvent: function(event, maskValue, value) {
        /*no-op*/
    },
    liftMaskedValue: function(maskedValue) {},
    autoFocus: false,
    value: '0',
    decimalSeparator: '.',
    thousandSeparator: ',',
    precision: '2',
    inputType: 'text',
    allowNegative: false,
    prefix: '',
    suffix: '',
    selectAllOnFocus: false
};

export default CurrencyInput;

function prepareProps(props) {
    const { maskedValue, value } = mask(
        initialValueFrom(props),
        props.precision,
        props.decimalSeparator,
        props.thousandSeparator,
        props.allowNegative,
        props.prefix,
        props.suffix
    );
    return { maskedValue, value };
}

function firstEffect(
    theInput,
    maskedValue,
    suffix,
    setSelectionRange,
    autoFocus
) {
    let node = ReactDOM.findDOMNode(theInput);
    let selectionStart, selectionEnd;

    if (autoFocus) {
        theInput.focus();
        selectionEnd = maskedValue.length - suffix.length;
        selectionStart = selectionEnd;
    } else {
        selectionEnd = Math.min(
            node.selectionEnd,
            theInput.value.length - suffix.length
        );
        selectionStart = Math.min(node.selectionStart, selectionEnd);
    }

    setSelectionRange(node, selectionStart, selectionEnd);
}

function nextEffect(
    prevState,
    theInput,
    maskedValue,
    decimalSeparator,
    thousandSeparator,
    precision,
    prefix,
    suffix,
    setSelectionRange,
    inputSelectionEnd
) {
    let node = ReactDOM.findDOMNode(theInput);
    let isNegative = (theInput.value.match(/-/g) || []).length % 2 === 1;
    let minPos = prefix.length + (isNegative ? 1 : 0);
    let selectionEnd = Math.max(
        minPos,
        Math.min(inputSelectionEnd, theInput.value.length - suffix.length)
    );
    let selectionStart = Math.max(
        minPos,
        Math.min(inputSelectionEnd, selectionEnd)
    );

    let regexEscapeRegex = /[-[\]{}()*+?.,\\^$|#\s]/g;
    let separatorsRegex = new RegExp(
        decimalSeparator.replace(regexEscapeRegex, '\\$&') +
            '|' +
            thousandSeparator.replace(regexEscapeRegex, '\\$&'),
        'g'
    );
    let currSeparatorCount = (maskedValue.match(separatorsRegex) || []).length;
    let prevSeparatorCount = (
        prevState.maskedValue.match(separatorsRegex) || []
    ).length;
    let adjustment = Math.max(currSeparatorCount - prevSeparatorCount, 0);

    selectionEnd = selectionEnd + adjustment;
    selectionStart = selectionStart + adjustment;

    precision = Number(precision);

    let baselength =
        suffix.length +
        prefix.length +
        (precision > 0 ? decimalSeparator.length : 0) + // if precision is 0 there will be no decimal part
        precision +
        1; // This is to account for the default '0' value that comes before the decimal separator

    if (maskedValue.length == baselength) {
        // if we are already at base length, position the cursor at the end.
        selectionEnd = theInput.value.length - suffix.length;
        selectionStart = selectionEnd;
    }

    setSelectionRange(node, selectionStart, selectionEnd, true);
}

function handleChange_(event, props, setState) {
    event.preventDefault();
    let { maskedValue, value } = mask(
        event.target.value,
        props.precision,
        props.decimalSeparator,
        props.thousandSeparator,
        props.allowNegative,
        props.prefix,
        props.suffix
    );
    event.persist(); // fixes issue #23
    setState({ maskedValue, value }, () => {
        props.onChange(maskedValue, value, event);
        props.onChangeEvent(event, maskedValue, value);
        props.liftMaskedValue(maskedValue);
    });
}

function handleFocus_(event, theInput, prefix, suffix, selectAllOnFocus) {
    if (!theInput) return;

    //Whenever we receive focus check to see if the position is before the suffix, if not, move it.
    let selectionEnd = theInput.value.length - suffix.length;
    let isNegative = (theInput.value.match(/-/g) || []).length % 2 === 1;
    let selectionStart = prefix.length + (isNegative ? 1 : 0);
    selectAllOnFocus &&
        event.target.setSelectionRange(selectionStart, selectionEnd);
    return selectionEnd;
}

function onlyCustomFrom(props) {
    const customProps = { ...props }; // babeljs converts to Object.assign, then polyfills.
    delete customProps.onChange;
    delete customProps.onChangeEvent;
    delete customProps.value;
    delete customProps.decimalSeparator;
    delete customProps.thousandSeparator;
    delete customProps.precision;
    delete customProps.inputType;
    delete customProps.allowNegative;
    delete customProps.allowEmpty;
    delete customProps.prefix;
    delete customProps.suffix;
    delete customProps.selectAllOnFocus;
    delete customProps.autoFocus;

    delete customProps._ref;
    delete customProps.inputType;
    delete customProps.maskedValue;
    delete customProps.handleChange;
    delete customProps.handleFocus;

    delete customProps.liftMaskedValue;
    return customProps;
}

function initialValueFrom(props) {
    let initialValue = props.value;
    if (initialValue === null) {
        initialValue = props.allowEmpty ? null : '';
    } else {
        if (typeof initialValue == 'string') {
            initialValue = Number.parseFloat(
                // now we can parse.
                unmask(
                    initialValue,
                    props.decimalSeparator,
                    props.thousandSeparator
                )
            );
        }
        initialValue = Number(initialValue).toLocaleString(undefined, {
            style: 'decimal',
            minimumFractionDigits: props.precision,
            maximumFractionDigits: props.precision
        });
    }
    return initialValue;
}

function unmask(value, decimalSeparator, thousandSeparator) {
    // Some people, when confronted with a problem, think "I know, I'll use regular expressions."
    // Now they have two problems.

    // Strip out thousand separators, prefix, and suffix, etc.
    if (thousandSeparator === '.') {
        // special handle the . thousand separator
        value = value.replace(/\./g, '');
    }

    if (decimalSeparator != '.') {
        // fix the decimal separator
        value = value.replace(new RegExp(decimalSeparator, 'g'), '.');
    }

    //Strip out anything that is not a digit, -, or decimal separator
    value = value.replace(/[^0-9-.]/g, '');
    return value;
}
