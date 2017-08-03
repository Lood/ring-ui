import React from 'react';
import classNames from 'classnames';
import chevronDownIcon from '@jetbrains/icons/chevron-down.svg';
import closeIcon from '@jetbrains/icons/close.svg';

import RingComponentWithShortcuts from '../ring-component/ring-component_with-shortcuts';
import Avatar, {Size as AvatarSize} from '../avatar/avatar';
import Popup from '../popup/popup';
import List from '../list/list';
import Input, {Size} from '../input/input';
import Icon from '../icon/icon';
import Button from '../button/button';
import sniffr from '../global/sniffer';
import getUID from '../global/get-uid';

import SelectPopup from './select__popup';
import styles from './select.css';

/**
 * @name Select
 * @category Components
 * @tags 3.0
 * @description Displays a select.
 * @example-file ./select.examples.html
 */

const ngModelStateField = 'selected';

function noop() {}

/**
 * @enum {number}
 */
const Type = {
  BUTTON: 0,
  INPUT: 1,
  CUSTOM: 2
};

/**
 * @name Select
 * @constructor
 * @extends {RingComponentWithShortcuts}
 */
export default class Select extends RingComponentWithShortcuts {
  static Type = Type;
  static Size = Size;
  static ngModelStateField = ngModelStateField;

  static defaultProps = {
    data: [],
    filter: false, // enable filter (BUTTON or CUSTOM mode)
    multiple: false, // multiple can be an object - see demo for more information
    clear: false, // enable clear button that clears the "selected" state
    loading: false, // show a loading indicator while data is loading
    disabled: false, // disable select

    loadingMessage: 'Loading...',
    notFoundMessage: 'No options found',

    type: Type.BUTTON,
    size: Size.M,
    targetElement: null, // element to bind the popup to (select BUTTON or INPUT by default)
    hideSelected: false, // INPUT mode: clears the input after an option is selected (useful when the selection is displayed in some custom way elsewhere)
    allowAny: false, // INPUT mode: allows any value to be entered, hides the dropdown icon
    hideArrow: false, // hide dropdown arrow icon

    maxHeight: 600, // height of the options list, including the filter and the 'Add' button
    directions: [
      Popup.PopupProps.Directions.BOTTOM_RIGHT,
      Popup .PopupProps.Directions.BOTTOM_LEFT,
      Popup.PopupProps.Directions.TOP_LEFT,
      Popup.PopupProps.Directions.TOP_RIGHT
    ],

    selected: null, // current selection (item / array of items)

    label: '', // BUTTON label or INPUT placeholder (nothing selected)
    selectedLabel: '', // BUTTON label or INPUT placeholder (something selected)
    hint: null, // hint text to display under the list

    shortcuts: false,

    onBeforeOpen: noop,
    onLoadMore: noop,
    onOpen: noop,
    onClose: noop,
    onFilter: noop, // search string as first argument
    onFocus: noop,
    onBlur: noop,
    onKeyDown: noop,

    onSelect: noop, // single + multi
    onDeselect: noop, // multi
    onChange: noop, // multi

    onAdd: noop, // search string as first argument

    onDone: noop,
    onReset: noop,

    tags: null,
    onRemoveTag: noop
  };

  state = {
    data: [],
    shownData: [],
    selected: (this.props.multiple ? [] : null),
    selectedIndex: null,
    filterValue: this.props.filter && this.props.filter.value || '',
    shortcuts: false,
    popupShortcuts: false,
    showPopup: false
  };

  ngModelStateField = ngModelStateField;
  _popup = null;
  _addButton = null;
  _multipleMap = {};

  getShortcutsProps() {
    return {
      map: {
        enter: this._onEnter,
        esc: this._onEsc,
        up: this._inputShortcutHandler,
        down: this._inputShortcutHandler,
        right: noop,
        left: noop,
        'shift+up': noop,
        'shift+down': noop,
        space: noop
      },
      scope: getUID('select-')
    };
  }

  _onEnter = () => {
    this.props.onDone();

    if (!this._popup.isVisible() && this.props.allowAny) {
      return true;
    }

    return undefined;
  }

  _onEsc = event => {
    if (!this._popup.isVisible()) {
      return true;
    } else if (this.props.multiple || !this.props.getInitial) {
      return false;
    }

    const selected = {
      key: Math.random(),
      label: this.props.getInitial()
    };

    this.setState({
      selected,
      filterValue: this.getValueForFilter(selected)
    }, () => {
      this.props.onChange(selected, event);
      this.props.onReset();
    });

    return undefined;
  }

  _inputShortcutHandler = () => {
    if (this.state.focused && this._popup && !this._popup.isVisible()) {
      this._clickHandler();
    }
  }

  _handleMultipleToggling(multiple) {
    const empty = Select._getEmptyValue(multiple);
    this.setState({selected: empty}, () => {
      this.props.onChange(empty);
    });
    this._rebuildMultipleMap(empty, multiple);
  }

  getValueForFilter(selected) {
    return selected && this.isInputMode() ? this._getItemLabel(selected) : this.state.filterValue;
  }

  willMount() {
    this.updateState(this.props, true);
  }

  didMount() {
    this._rebuildMultipleMap(this.state.selected, this.props.multiple);
  }

  willReceiveProps(newProps) {
    this.updateState(newProps);
  }

  didUpdate(prevProps, prevState) {
    const {showPopup} = this.state;

    if (prevState.showPopup && !showPopup) {
      this.props.onClose();
    } else if (!prevState.showPopup && showPopup) {
      this.props.onOpen();
    }
  }

  updateState(props, initial) {
    if ('data' in props && props.data !== this.props.data) {
      const shownData = this.getListItems(this.filterValue(), props.data);
      this.setState({shownData});

      if (this.state.selected && props.data !== this.props.data) {
        const selected = this.state.selected;
        this.setState({
          selected,
          selectedIndex: this._getSelectedIndex(
            selected,
            props.data
          ),
          prevFilterValue: this.getValueForFilter(selected)
        });
        this._rebuildMultipleMap(selected, this.props.multiple);
      }
    }

    if ('selected' in props && (
      initial ||
      props.selected !== this.props.selected
    )) {
      const selected = props.selected || Select._getEmptyValue(this.props.multiple);
      this.setState({
        selected,
        selectedIndex: this._getSelectedIndex(
          selected,
          props.data || this.props.data
        ),
        prevFilterValue: this.getValueForFilter(selected)
      });
      this._rebuildMultipleMap(selected, this.props.multiple);
    }

    if (props.multiple !== this.props.multiple) {
      this._handleMultipleToggling(props.multiple);
    }
  }

  static _getEmptyValue(multiple) {
    return multiple ? [] : null;
  }

  _getSelectedIndex(selected, data) {
    if ((this.props.multiple && !selected.length) || (!this.props.multiple && !selected)) {
      return null;
    }

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      if (item.key === undefined) {
        continue;
      }

      if (
        (this.props.multiple && item.key === selected[0].key) ||
        (!this.props.multiple && item.key === selected.key)
      ) {
        return i;
      }
    }

    return null;
  }

  popupRef = el => {
    this._popup = el;
  };

  _getResetOption() {
    const isOptionsSelected = this.state.selected && this.state.selected.length;
    const hasTagsResetProp = this.props.tags && this.props.tags.reset;
    if (!isOptionsSelected || !hasTagsResetProp) {
      return null;
    }

    const {reset} = this.props.tags;
    return {
      isResetItem: true,
      separator: reset.separator,
      key: reset.label,
      rgItemType: List.ListProps.Type.ITEM,
      label: reset.label,
      glyph: reset.glyph,
      iconSize: Icon.Size.Size14,
      className: 'ring-select__clear-tags',
      onClick: event => {
        this.clear(event);
        this._resetMultipleSelectionMap();
        this.clearFilter();
        this.props.onFilter('');
        this.setState({
          shownData: this.state.shownData.splice(0, reset.separator ? 2 : 1)
        });
        this._redrawPopup();
      }
    };
  }

  _prependResetOption(shownData) {
    const resetOption = this._getResetOption();
    const margin = {rgItemType: List.ListProps.Type.MARGIN};
    if (resetOption) {
      const resetItems = [margin, resetOption, margin];
      if (resetOption.separator) {
        resetItems.push({
          rgItemType: List.ListProps.Type.SEPARATOR
        });
      }
      return resetItems.concat(shownData);
    }
    return shownData;
  }

  _renderPopup() {
    const anchorElement = this.props.targetElement || this.node;
    const {showPopup, shownData} = this.state;
    const _shownData = this._prependResetOption(shownData);
    let message = null;

    if (this.props.loading) {
      message = this.props.loadingMessage;
    } else if (!shownData.length) {
      message = this.props.notFoundMessage;
    }

    return (
      <SelectPopup
        data={_shownData}
        message={message}
        toolbar={showPopup && this.getToolbar()}
        loading={this.props.loading}
        activeIndex={this.state.selectedIndex}
        hidden={!showPopup}
        ref={this.popupRef}
        maxHeight={this.props.maxHeight}
        minWidth={this.props.minWidth}
        directions={this.props.directions}
        className={this.props.popupClassName}
        top={this.props.top}
        left={this.props.left}
        filter={this.isInputMode() ? false : this.props.filter} // disable popup filter in INPUT mode
        filterValue={this.state.filterValue}
        anchorElement={anchorElement}
        onCloseAttempt={this._onCloseAttempt}
        onSelect={this._listSelectHandler}
        onFilter={this._filterChangeHandler}
        onClear={this.clearFilter}
        onLoadMore={this.props.onLoadMore}
        isInputMode={this.isInputMode()}
        selected={this.state.selected}
        tags={this.props.tags}
        compact={this.props.compact}
        renderOptimization={this.props.renderOptimization}
      />
    );
  }

  _showPopup() {
    if (!this.node) {
      return;
    }

    const shownData = this.getListItems(this.filterValue());
    this.setState({
      showPopup: !!shownData.length || !this.props.allowAny,
      shownData
    });
  }

  _hidePopup(tryFocusAnchor) {
    if (this.node && this.state.showPopup) {
      this.setState({
        showPopup: false,
        filterValue: ''
      });

      if (tryFocusAnchor) {
        const restoreFocusNode = this.props.targetElement ||
          this.node.query('[data-test=ring-select__focus]');
        restoreFocusNode.focus();
      }
    }
  }

  addHandler = () => {
    this._hidePopup();
    this.props.onAdd(this.filterValue());
  }

  getToolbar() {
    const isToolbarHasElements = this._addButton || this.props.hint;
    if (!isToolbarHasElements) {
      return null;
    }

    let hint = null;
    let addButton = null;

    if (this.props.hint) {
      hint = (
        <List.ListHint
          key={this.props.hint + Type.ITEM}
          label={this.props.hint}
        />
      );
    }

    if (this._addButton) {
      const {prefix, label} = this._addButton;
      addButton = (
        <Button
          text={true}
          delayed={true}
          className={styles.button}
          onClick={this.addHandler}
        >
          {prefix ? `${prefix} ${label}` : label}
        </Button>
      );
    }

    return (
      <div className={styles.toolbar}>
        {addButton}
        {hint}
      </div>
    );
  }

  getLowerCaseLabel(item) {
    if (
      List.isItemType(List.ListProps.Type.SEPARATOR, item) ||
      List.isItemType(List.ListProps.Type.HINT, item) ||
      item.label == null
    ) {
      return null;
    }

    return item.label.toLowerCase();
  }

  getListItems(rawFilterString, data = this.props.data) {
    let filterString = rawFilterString.trim();

    if (this.isInputMode() && this.state.selected && filterString === this.state.selected.label) {
      filterString = ''; // ignore multiple if it is exactly the selected item
    }
    const lowerCaseString = filterString.toLowerCase();

    const filteredData = [];
    let exactMatch = false;

    const check = this.props.filter.fn || ((itemToCheck, checkString) => {
      if (checkString === '') {
        return true;
      }

      const lowerCaseLabel = this.getLowerCaseLabel(itemToCheck);

      if (lowerCaseLabel == null) {
        return true;
      }

      return lowerCaseLabel.indexOf(checkString) >= 0;
    });

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (check(item, lowerCaseString, data)) {
        exactMatch = (item.label === filterString);

        if (this.props.multiple && !this.props.multiple.removeSelectedItems) {
          item.checkbox = !!this._multipleMap[item.key];
        }

        // Ignore item if it's multiple and is already selected
        if (
          !(this.props.multiple &&
            this.props.multiple.removeSelectedItems &&
            this._multipleMap[item.key])
        ) {
          filteredData.push(item);
        }
      }
    }

    this._addButton = null;
    if (
      (this.props.add && filterString && !exactMatch) ||
      (this.props.add && this.props.add.alwaysVisible)
    ) {
      if (!(this.props.add.regexp && !this.props.add.regexp.test(filterString)) &&
        !(this.props.add.minlength && filterString.length < +this.props.add.minlength) ||
        this.props.add.alwaysVisible) {

        this._addButton = {
          prefix: this.props.add.prefix,
          label: this.props.add.label || filterString
        };
      }
    }

    return filteredData;
  }

  filterValue(setValue) {
    if (typeof setValue === 'string' || typeof setValue === 'number') {
      this._setFilter(setValue);
    } else {
      return this.state.filterValue;
    }
    return undefined;
  }

  isInputMode() {
    return (this.props.type === Type.INPUT);
  }

  isButtonMode() {
    return (this.props.type === Type.BUTTON);
  }

  _clickHandler = () => {
    if (!this.props.disabled) {
      if (this.state.showPopup) {
        this._hidePopup();
      } else {
        this.props.onBeforeOpen();
        this._showPopup();
      }
    }
  }

  _filterChangeHandler = e => {
    this._setFilter(e.target.value, e);
  }

  _setFilter = (value, event = {}) => {
    if (this.isInputMode() && !this.state.focused) {
      return;
    }

    if (value === this.state.filterValue) {
      return;
    }

    const filterValue = value.replace(/^\s+/g, '');
    this.props.onFilter(filterValue);
    if (this.props.allowAny) {
      const fakeSelected = {
        key: Math.random(),
        label: filterValue
      };
      this.setState({
        selected: filterValue === '' ? null : fakeSelected,
        selectedIndex: null
      }, () => {
        this.props.onSelect(fakeSelected, event);
        this.props.onChange(fakeSelected, event);
      });
    }
    !this._popup.isVisible() && this.props.onBeforeOpen();

    this.setState({filterValue}, () => {
      this._showPopup();
    });
  }

  _resetMultipleSelectionMap() {
    this._multipleMap = {};
    return this._multipleMap;
  }

  _rebuildMultipleMap(selected, multiple) {
    if (selected && multiple) {
      this._resetMultipleSelectionMap();
      for (let i = 0; i < selected.length; i++) {
        this._multipleMap[selected[i].key] = true;
      }
    }
  }

  _redrawPopup = () => {
    if (this.props.multiple) {
      setTimeout(() => { //setTimeout solves events order and bubbling issue
        this.isInputMode() && this.clearFilter();
        this._showPopup();
      }, 0);
    }
  }

  _listSelectHandler = (selected, event) => {
    const isItem = List.isItemType.bind(null, List.ListProps.Type.ITEM);
    const isCustomItem = List.isItemType.bind(null, List.ListProps.Type.CUSTOM);
    const isSelectItemEvent = event && (event.type === 'select' || event.type === 'keydown');
    if (isSelectItemEvent) {
      event.preventDefault();
    }

    if ((!isItem(selected) && !isCustomItem(selected)) ||
        selected.disabled ||
        selected.isResetItem) {
      return;
    }

    if (!this.props.multiple) {
      this._hidePopup(isSelectItemEvent);
      this.setState({
        selected,
        selectedIndex: this._getSelectedIndex(selected, this.props.data)
      }, () => {
        const newFilterValue = this.isInputMode() && !this.props.hideSelected
          ? this._getItemLabel(selected)
          : '';
        this.filterValue(newFilterValue);
        this.props.onFilter(newFilterValue);
        this.props.onSelect(selected, event);
        this.props.onChange(selected, event);
      });
    } else {
      if (selected.key == null) {
        throw new Error('Multiple selection requires each item to have the "key" property');
      }

      const currentSelection = this.state.selected;
      if (!this._multipleMap[selected.key]) {
        this._multipleMap[selected.key] = true;
        currentSelection.push(selected);
        this.props.onSelect && this.props.onSelect(selected, event);
      } else {
        Reflect.deleteProperty(this._multipleMap, selected.key);
        for (let i = 0; i < currentSelection.length; i++) {
          if (selected.key === currentSelection[i].key) {
            currentSelection.splice(i, 1);
            break;
          }
        }
        this.props.onDeselect && this.props.onDeselect(selected);
      }

      this.setState({
        selected: currentSelection,
        selectedIndex: this._getSelectedIndex(selected, this.props.data)
      }, this._redrawPopup);

      this.props.onChange(currentSelection, event);
    }
  }

  _onCloseAttempt = (event, isEsc) => {
    if (this.isInputMode()) {
      if (!this.props.allowAny) {
        if (this.props.hideSelected || !this.state.selected || this.props.multiple) {
          this.clearFilter();
        } else if (this.state.selected) {
          this.filterValue(this._getItemLabel(this.state.selected));
        }
      }
    }

    const isTagRemoved = this.props.tags && event && event.target &&
      event.target.matches('[data-test="ring-tag-remove"]');

    if (!isTagRemoved) {
      this._hidePopup(isEsc);
    }
  }

  clearFilter = () => {
    this.filterValue('');
  }

  clear = event => {
    if (event) {
      event.stopPropagation();
    }
    const empty = Select._getEmptyValue(this.props.multiple);

    this.setState({
      selected: empty,
      selectedIndex: null
    }, () => {
      if (this.props.onChange) {
        this.props.onChange(empty, event);
      }
    });

    return false;
  }

  _focusHandler = () => {
    this.props.onFocus();

    this.setState({
      shortcuts: true,
      focused: true
    });
  }

  _blurHandler = () => {
    this.props.onBlur();

    if (this._popup && this._popup.isVisible() && !this._popup.isClickingPopup) {
      window.setTimeout(() => {
        this.setState({showPopup: false});
      });
    }

    if (!this._popup.isClickingPopup) {
      this.setState({
        shortcuts: false,
        focused: false
      });
    }
  }

  _selectionIsEmpty() {
    return (this.props.multiple && !this.state.selected.length) || !this.state.selected;
  }

  _getLabel() {
    return this.props.label || this.props.selectedLabel || 'Select an option';
  }

  _getInputPlaceholder() {
    if (!this.props.allowAny) {
      return this._getLabel();
    } else {
      return '';
    }
  }

  _getSelectedString() {
    if (this.props.multiple) {
      const labels = [];
      for (let i = 0; i < this.state.selected.length; i++) {
        labels.push(this._getItemLabel(this.state.selected[i]));
      }
      return labels.join(', ');
    } else {
      return this._getItemLabel(this.state.selected);
    }
  }

  _getItemLabel(item) {
    return item.selectedLabel || item.label;
  }

  _getIcons() {
    const icons = [];

    if (this.state.selected && this.state.selected.icon) {
      icons.push(
        <span
          className={styles.selectedIcon}
          key="selected"
          style={{backgroundImage: `url(${this.state.selected.icon})`}}
        />
      );
    }

    if (this.props.clear && this.state.selected) {
      icons.push(
        <Button
          className={styles.clearIcon}
          key="close"
          onClick={this.clear}
          icon={closeIcon}
          iconSize={Icon.Size.Size14}
        />
      );
    }

    if (!this.props.hideArrow) {
      icons.push(
        <Icon
          glyph={chevronDownIcon}
          key="hide"
          size={Icon.Size.Size14}
        />
      );
    }

    return icons;
  }

  _getAvatar() {
    return this.state.selected && this.state.selected.avatar && (
      <Avatar
        className={styles.avatar}
        url={this.state.selected.avatar}
        size={AvatarSize.Size20}
      />
    );
  }

  popupRef = el => {
    this._popup = el;
  };

  buttonRef = el => {
    this.button = el;
  };

  filterRef = el => {
    this.filter = el;
  };

  render() {
    const classes = classNames(styles.select, 'ring-js-shortcuts', this.props.className, styles[`size${this.props.size}`], {
      [styles.disabled]: this.props.disabled
    });

    const icons = this._getIcons();

    const style = {
      // eslint-disable-next-line no-magic-numbers
      paddingRight: icons.length * 20
    };

    const iconsNode = <span className={styles.icons}>{icons}</span>;

    if (this.isInputMode()) {
      return (
        <div
          className={classNames(classes, styles.inputMode)}
          onClick={this._clickHandler}
          data-test="ring-select"
        >
          <Input
            inputRef={this.filterRef}
            disabled={this.props.disabled}
            value={this.state.filterValue}
            className={classNames(styles.input, 'ring-js-shortcuts')}
            style={style}
            onChange={this._filterChangeHandler}
            onFocus={this._focusHandler}
            onBlur={this._blurHandler}
            placeholder={this._getInputPlaceholder()}
            onKeyDown={this.props.handleKeyDown}
            data-test="ring-select__focus"
          />
          {iconsNode}
          {this._renderPopup()}
        </div>
      );
    } else if (this.isButtonMode()) {
      const isIE11 = sniffr.browser.name === 'ie' && sniffr.browser.versionString === '11.0';
      const clickListenProps = isIE11
        ? {onMouseDown: this._clickHandler}
        : {onClick: this._clickHandler};

      return (
        <div
          className={classNames(classes, styles.buttonMode)}
          data-test="ring-select"
          {...clickListenProps}
        >
          {!this._selectionIsEmpty() && this.props.selectedLabel && (
            <span className={styles.selectedLabel}>{this.props.selectedLabel}</span>
          )}
          <button
            type="button"
            disabled={this.props.disabled}
            className={classNames(styles.value, {
              [styles.open]: this.state.showPopup,
              [styles.label]: this._selectionIsEmpty()
            })}
            style={style}
            data-test="ring-select__focus"
            ref={this.buttonRef}
          >
            {this._getAvatar()}
            {this._selectionIsEmpty() ? this._getLabel() : this._getSelectedString()}
          </button>
          {iconsNode}
          {this._renderPopup()}
        </div>
      );
    } else {
      return (
        <span data-test="ring-select">
          {this._renderPopup()}
        </span>
      );
    }
  }
}
