import CSSModules from 'react-css-modules';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TransitionMotion, spring } from 'react-motion';
import { renderSubtreeIntoContainer, unmountComponentAtNode } from 'react-dom/lib/ReactMount';

/**
 * Container component. Represent API for use it:
 * props: {
 *  open: the flag is open or close modal
 *  onOpen: callback - call after modal opened
 *  onClose: callback - call after modal closed
 *  shortcut: keyCode for open modal if Control is pressed
 * }
 *
 * openModal: manual open, example: by ref
 * closeModal: manual close, example: by ref
 *
 * Also component listen keyboard events to close them or open if shortcut combination is set
 */
@CSSModules(require('./styles.scss'))
export default class ReactSmartModal extends Component {
    static propTypes = {
        open    : PropTypes.bool.isRequired,
        onOpen  : PropTypes.func,
        onClose : PropTypes.func,
        shortcut: PropTypes.number
    };

    static defaultProps = {
        open: false
    };

    constructor(props) {
        super(props);

        this.currentState = null;
    }

    componentDidMount() {
        this.renderChildren(this.props.open);

        window.addEventListener('keydown', this.onKeyDown, true);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.onKeyDown, true);

        this.renderChildren();
    }

    componentWillReceiveProps(nextProps) {
        this.renderChildren(nextProps.open);
    }

    renderChildren(isOpen) {
        if (this.currentState === isOpen) {
            return;
        } else {
            this.currentState = isOpen;
        }

        if (isOpen) {
            this.mountChildrenBody();
        } else {
            this.unmountChildrenBody();
        }
    }

    mountChildrenBody() {
        this.modalContainer           = document.createElement('div');
        this.modalContainer.className = 'react-smart-modal';

        document.body.appendChild(this.modalContainer);
        document.body.classList.add('react-smart-modal--open');

        renderSubtreeIntoContainer(
            this,
            <ReactSmartModalContainer
                {...this.props}
                closeModal={this.closeModal}
            />,
            this.modalContainer);
    }

    unmountChildrenBody() {
        if (this.modalContainer) {
            document.body.classList.remove('react-smart-modal--open');

            document.body.removeChild(this.modalContainer);

            unmountComponentAtNode(this.modalContainer);

            delete this.modalContainer;
        }
    }

    openModal = () => {
        this.renderChildren(true);
    };

    closeModal = () => {
        this.renderChildren(false);
    };

    onKeyDown = (event) => {
        if (event.keyCode === this.props.shortcut && event.ctrlKey) {
            this.openModal();
        }
    };

    render() {
        return null;
    }
}

/**
 * Component Controller. Wrapper of ReactSmartModalBody
 * Controls the display of modal. Listen events for send closeRequest to ReactSmartModal
 */
@CSSModules(require('./styles.scss'))
class ReactSmartModalContainer extends Component {
    static propTypes = {
        closeModal: PropTypes.func.isRequired,
        onClose   : PropTypes.func,
        onOpen    : PropTypes.func
    };

    constructor(props) {
        super(props);

        this.state = {
            items: []
        };
    }

    componentDidMount() {
        this.setState({
            items: [{ key: 'modal', opacity: 1 }]
        });

        window.addEventListener('keydown', this.onKeyDown, true);

        if (this.props.onOpen) {
            this.props.onOpen();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.onKeyDown, true);

        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    requestCloseModal() {
        this.setState({
            items: []
        });
    }

    onCloseButtonClick = (event) => {
        event.stopPropagation();

        this.requestCloseModal();
    };

    onOverlayClick = (event) => {
        event.stopPropagation();

        this.requestCloseModal();
    };

    onBodyClick = (event) => {
        event.stopPropagation();
    };

    onKeyDown = (event) => {
        if (event.keyCode === 27) { // 27 - ESC_CODE
            event.preventDefault();

            this.requestCloseModal();
        }
    };

    render() {
        return (
            <TransitionMotion
                willLeave={() => ({ opacity: spring(0) })}
                willEnter={() => ({ opacity: 0 })}
                styles={this.state.items.map(item => ({
                    key  : item.key,
                    style: { opacity: spring(item.opacity) },
                }))}
            >

                {interpolatedStyles =>
                    <div>
                        {interpolatedStyles.map(config => {
                            return (
                                <ReactSmartModalBody
                                    key={config.key}
                                    style={{ ...config.style }}
                                    onCloseButtonClick={this.onCloseButtonClick}
                                    onOverlayClick={this.onOverlayClick}
                                    onBodyClick={this.onBodyClick}
                                    {...this.props}
                                >
                                    <div className="label">{this.props.children}</div>
                                </ReactSmartModalBody>
                            );
                        })}
                    </div>
                }
            </TransitionMotion>
        );
    }
}

/**
 * Represent component. Body of modal.
 * Needed because TransitionMotion is't have callback on willLeave complete
 */
@CSSModules(require('./styles.scss'))
class ReactSmartModalBody extends Component {
    static propTypes = {
        onCloseButtonClick: PropTypes.func.isRequired,
        onOverlayClick    : PropTypes.func.isRequired,
        onBodyClick       : PropTypes.func.isRequired,
        closeModal        : PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
    }

    componentWillUnmount() {
        setTimeout(this.props.closeModal);
    }

    render() {
        return (
            <div styleName='react-smart-modal-overlay'
                 style={{ ...this.props.style }}
                 onClick={this.props.onOverlayClick}
            >
                <div
                    styleName='react-smart-modal-body'
                    onClick={this.props.onBodyClick}
                >
                    <div
                        styleName='react-smart-modal-body__close-button'
                        onClick={this.props.onCloseButtonClick}
                    >
                        &#x2716;
                    </div>
                    {this.props.children}
                </div>
            </div>
        );
    }
}