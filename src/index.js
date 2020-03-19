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
        this.prepareProps = this.prepareProps.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.setSelectionRange = this.setSelectionRange.bind(this);
        this.state = this.prepareProps(this.props);

        this.inputSelectionStart = 1;
        this.inputSelectionEnd = 1;
    }

    /**
     * Exposes the current masked value.
     *
     * @returns {String}
     */
    getMaskedValue() {
        return this.state.maskedValue;
    }

    /**
     * General function used to cleanup and define the final props used for rendering
     * @returns {{ maskedValue: {String}, value: {Number} }}
     */
    prepareProps(props) {
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

    /**
     * Component lifecycle function.
     * Invoked when a component is receiving new props. This method is not called for the initial render.
     *
     * @param nextProps
     * @see https://facebook.github.io/react/docs/component-specs.html#updating-componentwillreceiveprops
     */
    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState(this.prepareProps(nextProps));
    }

    /**
     * Component lifecycle function.
     * @returns {XML}
     * @see https://facebook.github.io/react/docs/react-component.html#componentdidmount
     */
    componentDidMount() {
        let node = ReactDOM.findDOMNode(this.theInput);
        let selectionStart, selectionEnd;

        if (this.props.autoFocus) {
            this.theInput.focus();
            selectionEnd =
                this.state.maskedValue.length - this.props.suffix.length;
            selectionStart = selectionEnd;
        } else {
            selectionEnd = Math.min(
                node.selectionEnd,
                this.theInput.value.length - this.props.suffix.length
            );
            selectionStart = Math.min(node.selectionStart, selectionEnd);
        }

        this.setSelectionRange(node, selectionStart, selectionEnd);
    }

    /**
     * Component lifecycle function
     * @returns {XML}
     * @see https://facebook.github.io/react/docs/react-component.html#componentwillupdate
     */
    UNSAFE_componentWillUpdate() {
        let node = ReactDOM.findDOMNode(this.theInput);
        this.inputSelectionStart = node.selectionStart;
        this.inputSelectionEnd = node.selectionEnd;
    }

    /**
     * Component lifecycle function.
     * @returns {XML}
     * @see https://facebook.github.io/react/docs/react-component.html#componentdidupdate
     */
    componentDidUpdate(prevProps, prevState) {
        const { decimalSeparator } = this.props;
        let node = ReactDOM.findDOMNode(this.theInput);
        let isNegative =
            (this.theInput.value.match(/-/g) || []).length % 2 === 1;
        let minPos = this.props.prefix.length + (isNegative ? 1 : 0);
        let selectionEnd = Math.max(
            minPos,
            Math.min(
                this.inputSelectionEnd,
                this.theInput.value.length - this.props.suffix.length
            )
        );
        let selectionStart = Math.max(
            minPos,
            Math.min(this.inputSelectionEnd, selectionEnd)
        );

        let regexEscapeRegex = /[-[\]{}()*+?.,\\^$|#\s]/g;
        let separatorsRegex = new RegExp(
            decimalSeparator.replace(regexEscapeRegex, '\\$&') +
                '|' +
                this.props.thousandSeparator.replace(regexEscapeRegex, '\\$&'),
            'g'
        );
        let currSeparatorCount = (
            this.state.maskedValue.match(separatorsRegex) || []
        ).length;
        let prevSeparatorCount = (
            prevState.maskedValue.match(separatorsRegex) || []
        ).length;
        let adjustment = Math.max(currSeparatorCount - prevSeparatorCount, 0);

        selectionEnd = selectionEnd + adjustment;
        selectionStart = selectionStart + adjustment;

        const precision = Number(this.props.precision);

        let baselength =
            this.props.suffix.length +
            this.props.prefix.length +
            (precision > 0 ? decimalSeparator.length : 0) + // if precision is 0 there will be no decimal part
            precision +
            1; // This is to account for the default '0' value that comes before the decimal separator

        if (this.state.maskedValue.length == baselength) {
            // if we are already at base length, position the cursor at the end.
            selectionEnd =
                this.theInput.value.length - this.props.suffix.length;
            selectionStart = selectionEnd;
        }

        this.setSelectionRange(node, selectionStart, selectionEnd);
        this.inputSelectionStart = selectionStart;
        this.inputSelectionEnd = selectionEnd;
    }

    /**
     * Set selection range only if input is in focused state
     * @param node DOMElement
     * @param start number
     * @param end number
     */
    setSelectionRange(node, start, end) {
        if (document.activeElement === node) {
            node.setSelectionRange(start, end);
        }
    }

    /**
     * onChange Event Handler
     * @param event
     */
    handleChange(event) {
        event.preventDefault();
        let { maskedValue, value } = mask(
            event.target.value,
            this.props.precision,
            this.props.decimalSeparator,
            this.props.thousandSeparator,
            this.props.allowNegative,
            this.props.prefix,
            this.props.suffix
        );

        event.persist(); // fixes issue #23

        this.setState({ maskedValue, value }, () => {
            this.props.onChange(maskedValue, value, event);
            this.props.onChangeEvent(event, maskedValue, value);
        });
    }

    /**
     * onFocus Event Handler
     * @param event
     */
    handleFocus(event) {
        if (!this.theInput) return;

        //Whenever we receive focus check to see if the position is before the suffix, if not, move it.
        let selectionEnd =
            this.theInput.value.length - this.props.suffix.length;
        let isNegative =
            (this.theInput.value.match(/-/g) || []).length % 2 === 1;
        let selectionStart = this.props.prefix.length + (isNegative ? 1 : 0);
        this.props.selectAllOnFocus &&
            event.target.setSelectionRange(selectionStart, selectionEnd);
        this.inputSelectionStart = selectionStart;
        this.inputSelectionEnd = selectionEnd;
    }

    handleBlur(event) {
        this.inputSelectionStart = 0;
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
