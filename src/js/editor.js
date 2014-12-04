/* GUI Editor for HTML */
(function($, window, document, undefined) {
  'use strict';

  /* Used to create unique extension id */
  var lastExtensionId = -1;

  /* Class: Editor */
  function Editor() {
    this.init();
  }

  /* Class: Extension */
  function Extension(options) {
    this.id = lastExtensionId = lastExtensionId + 1;
    this.init(options);
  }

  /*
   * Private members: Extension
   * ==========================
   */
  /* Used to create unique button id */
  var lastButtonId = 0;

  /*
   * Private members: Editor
   * =======================
   */

  /* Data variables */
  /* -------------- */
  var elements = {
      /*
       *    $ root: Editor container,
       *    $ menu: Menu container,
       *    $ editor: Editable,
       *    $ options: Options menu
       */
    },
    services = {
      /*
       *    bool localStorage
       */
    },
    selection = {
      /*
       *    Selection selection,
       *    Node[] nodes,
       *    bool blur,
       *    Object position
       */
    },
    extensions = [] /* Extensions[] */,
    bindings = {
      /*
       *  event: listener
       */
    };

  /* State variables */
  /* --------------- */
  /* Editor has initiated or not */
  var booted = false;

  /* Used for scroll throttling */
  var scrollState = {}, scrollTimer = 0;

  /* Used to distinguish key down/up events from IME composition */
  var composing = false;

  /* Config variables */

  /* in ms */
  var scrollUpdateFrequency = 100;

  /* Load/Create HTML bindings */
  function bindElements() {
    var hook;

    /* 1. Load/Create editor root element */
    hook = $('[data-editor]');
    if (hook.length > 1) {
      console.log('Multiple editors not supported. Picking up first.');
      hook = hook.first();
    } else if (hook.length === 0) {
      throw "Editor root element not found";
    }
    // Plug the hook
    elements.root = hook;

    /* 2. Load/Create menu container */
    hook = elements.root.find('[data-menu-container]');
    if (hook.length === 0) {
      hook = $('<div>').attr('data-menu-container', '').addClass('menu-container');
      elements.root.append(hook);
    }
    // Plug the hook
    elements.menu = hook;

    /* 3. Load/Create editor window */
    hook = elements.root.find('[data-edit]');
    if (hook.length === 0) {
      hook = $('<article>').attr('data-edit', '')
        .append($('<h2>').attr('data-placeholder', 'Title here').addClass('title'))
        .append($('<p>'));
      elements.root.append(hook);
    }
    // Plug the hook
    elements.editor = hook;

    /* 4. Load/Create options menu - Lists all creatable object */
    hook = elements.menu.find('[data-options]');
    if (hook.length === 0) {
      hook = $('<div>')
        .attr('data-options', '')
        .append($('<div>')
          .addClass('toggle')
          .append($('<a>')
            .addClass('button icon')
            .attr({
              href: '#',
              'data-button-id': 'toggle'
            })
            .html('&times;')))
        .append($('<ul>').addClass('menu options-menu'));
      elements.menu.append(hook);
    }
    // Plug the hook
    elements.options = hook;

    /* 5. Make editor editable */
    elements.editor.attr({contenteditable: true});

    /* 6. Hide all menu */
    elements.menu.find('.menu').hide();

    /* 7. Last focused element */
    elements.lastFocused = undefined;
  }

  /* Load service states */
  function loadServices() {
    /* 1. Check if localStorage is available */
    services.localStorage = window.localStorage !== null;
  }

  /* TODO Load an extension */
  function loadExtension(extension, id) {
    /* Check if id is in list */
    var re;
    var filter;
    if (-1 === id) {
      id = extensions.length;
      extensions.push(extension);
    }

    elements.menu.append(extension.view);

    /* Create button id namespace in extension */
    extension.R = {};
    /* Load button ids */
    extension.view.find('[data-button-id]').each(function() {
      var name = $(this).attr('data-button-id').replace(/-([a-z0-9])/gi, function(match) {
        return match[1].toUpperCase();
      });
      extension.R[name] = lastButtonId = lastButtonId + 1;
      $(this).attr('data-extension-id', id);
      $(this).attr('data-id', lastButtonId);
    });

    filter = [];
    /* Load key bindings */
    extension.subscribe.forEach(function(event) {
      re = /^@.*$/gi;
      if (re.test(event)) {
        if (!bindings[event]) {
          bindings[event] = [];
        }
        bindings[event].push(extension.onEvent);
      } else {
        filter.push(event);
      }
    });
    extension.subscribe = filter;
    return id;
  }

  /* Load all extensions */
  function loadExtensions() {
    var i;
    for (i = 0; i < extensions.length; ++i) {
      loadExtension(extensions[i], i);
    }
  }

  /* Load last saved state */
  function loadState() {
    // TODO
  }

  /* Create node list for current selection */
  function createNodeList(node) {
    var list = {};
    if (node) {
      while (node.parentNode) {
        list[node.nodeName.toLowerCase()] = true;
        if (node === elements.editor[0]) {
          break;
        }
        node = node.parentNode;
      }
    }
    return list;
  }

  /* Get current selection */
  function getSelection(event) {
    var oldSelection = $.extend({}, selection);
    /* 0. Clear selection object */
    selection = {
      time: new Date()
    };
    /* 1. Get current selection */
    selection.selection = window.getSelection();
    /* 2. Create new node list */
    selection.nodes = createNodeList(selection.selection.focusNode);
    /* 3. Check if last selection is blurring or not */
    selection.blur = selection.selection.isCollapsed === true && (oldSelection.isCollapsed !== undefined && oldSelection.isCollapsed === false);
    /* 4. Get position*/
    if (false === selection.selection.isCollapsed && false === composing) {
      if ($.contains(elements.editor[0], selection.selection.focusNode)) {
        var range = selection.selection.getRangeAt(0);
        var boundary = range.getBoundingClientRect();
        selection.position = {
          top: window.pageYOffset + boundary.top,
          left: boundary.left,
          right: boundary.right,
          bottom: window.pageYOffset + boundary.bottom,
          width: boundary.width,
          height: boundary.height
        };
      }
    } else {
      var focusElement = selection.selection.focusNode ? $(selection.selection.focusNode) : $(event.target);
      if (focusElement[0].nodeName === '#text') {
        focusElement = focusElement.parent();
      }
      selection.position = {
        top: focusElement.position().top,
        left: focusElement.position().left,
        bottom: focusElement.position().top + focusElement.height(),
        right: focusElement.position().left + focusElement.width(),
        width: focusElement.width(),
        height: focusElement.height()
      };
    }

    /* 5. Attach event */
    selection.event = event;

    /* 6. Collapsed or not */
    selection.isCollapsed = selection.selection.isCollapsed;

    return oldSelection;
  }

  /* EventListener: edit view blur */
  function onEditViewBlur(type, currentSelection, event) {
    var nodeName;
    var node;
    if (!currentSelection) {
      return;
    }

    if (type === 'keyup') {
      node = currentSelection.selection.focusNode;
    } else {
      node = currentSelection.event.target;
    }

    extensions.forEach(function(extension) {
      if (extension.id !== 0 && extension.visible) {
        extension.focusOut(type, node, selection, event);
      }
    });
  }

  /* EventListener: edit view focus */
  function onEditViewFocus(type, currentSelection, event) {
    var node;
    if (!currentSelection) {
      return;
    }

    if (type === 'mouseup') {
      node = event.target;
    } else {
      node = currentSelection.selection.focusNode;
    }

    var nodeName = node.nodeName.toLowerCase();

    extensions.forEach(function(extension) {
      if (extension.subscribe.indexOf(nodeName) !== -1) {
        extension.focusIn(type, node, selection, event);
      }
    });

    /* Send event to wildcards */
    extensions.forEach(function(extension) {
      if (extension.subscribe.indexOf("*") !== -1) {
        extension.focusIn(type, nodeName, selection, event);
      }
    });
  }

  /* EventListener: keyup */
  function onKeyUp(event) {
    var oldSelection = getSelection(event);

    /* if on new view then blur out last view */
    if (selection.blur || (oldSelection.selection && oldSelection.selection.focusNode !== selection.selection.focusNode)) {
      onEditViewBlur('keyup', oldSelection, event);
    }

    if (!selection.selection.isCollapsed) {
      onEditViewFocus('keyup', selection, event);
    }
  }

  var keymap = {
    8: "backspace",
    9: "tab",
    13: "enter",
    16: "shift",
    17: "ctrl",
    18: "alt",
    19: "pause",
    20: "caps",
    27: "esc",
    32: "space",
    33: "pgup",
    34: "pgdn",
    35: "end",
    36: "home",
    37: "left",
    38: "up",
    39: "right",
    40: "down",
    45: "ins",
    46: "del",
    48: "0",
    49: "1",
    50: "2",
    51: "3",
    52: "4",
    53: "5",
    54: "6",
    55: "7",
    56: "8",
    57: "9",
    65: "a",
    66: "b",
    67: "c",
    68: "d",
    69: "e",
    70: "f",
    71: "g",
    72: "h",
    73: "i",
    74: "j",
    75: "k",
    76: "l",
    77: "m",
    78: "n",
    79: "o",
    80: "p",
    81: "q",
    82: "r",
    83: "s",
    84: "t",
    85: "u",
    86: "v",
    87: "w",
    88: "x",
    89: "y",
    90: "z",
    91: "cmd",
    93: "cmd",
    112: "f1",
    113: "f2",
    114: "f3",
    115: "f4",
    116: "f5",
    117: "f6",
    118: "f7",
    119: "f8",
    120: "f9",
    121: "f10",
    122: "f11",
    123: "f12",
    186: ";",
    187: "=",
    188: ",",
    189: "-",
    191: "\\/",
    192: "`",
    219: "\\[",
    220: "\\\\",
    221: "\\]",
    222: "'"
  };

  /* Convert keystroke into string */
  function getKeyStroke(event) {
    var metaKeys = [],
      string = [];

    if (event.which === undefined) {
      return "";
    }

    if (event.shiftKey) {
      metaKeys.push(keymap[16]);
    }
    if (event.ctrlKey) {
      metaKeys.push(keymap[17]);
    }
    if (event.altKey) {
      metaKeys.push(keymap[18]);
    }
    if (event.metaKey) {
      metaKeys.push(keymap[91]);
    }

    metaKeys.sort();

    if (metaKeys.length) {
      string.push(metaKeys.join("+"));
    }
    if ([16, 17, 18, 91, 93].indexOf(event.which) < 0) {
      string.push(event.which);
    }
    return "@" + string.join("+");
  }

  function onKeyDown(event) {
    var keyStroke = getKeyStroke(event);

    if (bindings.hasOwnProperty(keyStroke)) {
      bindings[keyStroke].some(function(callable) {
        return callable(keyStroke, selection);
      });
    }
  }

  /* EventListener: mousedown */
  function onMouseDown(event) {
    if ($.contains(elements.root, event.target)) {
      event.preventDefault();
    }
  }

  /* EventListener: mouseup */
  function onMouseUp(event) {
    /* Handle only left click */

    if ($.contains(elements.root, event.target)) {
      event.preventDefault();
    }

    if (event.which !== 1) {
      return;
    }

    var oldSelection = getSelection(event);

    if (selection.blur || (oldSelection.event && oldSelection.event.target !== selection.event.target)) {
      onEditViewBlur('mouseup', oldSelection, event);
    }

    if ($.contains(elements.editor[0], event.target)) {
      onEditViewFocus('mouseup', selection, event);
    }
  }

  /* EventListener: scroll */
  function onScroll() {
    var newState = {
      top: $(window).scrollTop(),
      left: $(window).scrollLeft(),
      timestamp: new Date().getTime()
    };

    /* Calculate deltas */
    var delta = {
      x: newState.left - scrollState.left,
      y: newState.top - scrollState.top,
      dt: newState.timestamp - scrollState.timestamp
    };

    /* Fire immediately on first scroll */
    if (delta.dt > 3 * scrollUpdateFrequency) {
      //draw(delta);
      scrollState = newState;
      scrollTimer = 0;
      return;
    }

    /* If there is any pending updates, then cancel them */
    if (0 !== scrollTimer) {
      window.clearTimeout(scrollTimer);
    }

    /* Schedule fire event */
    scrollTimer = window.setTimeout(function() {
      scrollTimer = 0;
      //draw(delta);
    }, scrollUpdateFrequency);
  }

  /* EventListener: compositionstart */
  function onCompositionStart() {
    composing = true;
  }

  /* EventListener: compositionend */
  function onCompositionEnd() {
    composing = false;
  }

  /* EventListener: window resize */
  function onResize() {
    //draw(undefined, true);
    // TODO update view
  }


  /* EventListener: edit view hover */
  function onEditViewHover(event) {
    //extensions[0].focusIn("hover", event, $(event.target), event);
  }

  /* Get button value */
  function getButtonValue(button) {
    var state = button.is('[selected]');
    switch (button.attr('data-button-type')) {
      case 'select':
        elements.menu.find('[data-button-name="' + button.attr('data-button-name') + '"]').removeAttr('selected');
        if (state) {
          button.removeAttr('selected');
        } else {
          button.attr('selected', '');
        }
        return !state ? button.attr('data-button-id') : undefined;
      case 'radio':
        elements.menu.find('[data-button-name="' + button.attr('data-button-name') + '"]').removeAttr('selected');
        if (!state) {
          button.attr('selected', '');
        }
        return button.attr('data-button-id');
      default:
        if (state) {
          button.removeAttr('selected');
        } else {
          button.attr('selected', '');
        }
        return !state;
    }
  }

  /* EventListener: menu button click */
  function onButtonClick(event) {
    var id, view, value;

    view = $(event.currentTarget);

    console.log(view);
    /* Get extension id */
    id = parseInt(view.attr('data-extension-id'), 10);
    value = getButtonValue(view);
    if (extensions[id]) {
      extensions[id].onClick(parseInt(view.attr('data-id'), 10), value, selection, view);
      event.preventDefault();
    }
  }

  /* Draw menus */
  function draw(delta) {
    extensions.forEach(function(extension) {
      if (extension.visible) {
        extension.onDraw(delta);
      }
    });
  }

  /* Bind events to editor */
  function bindEvents() {
    /* 1. Listen to global events */
    $(document).on({
      compositionend: onCompositionEnd,
      compositionstart: onCompositionStart,
      keyup: onKeyUp,
      keydown: onKeyDown,
      mousedown: onMouseDown,
      mouseup: onMouseUp
    });

    /* 1.1 Update scrollState */
    scrollState = {
      top: $(window).scrollTop(),
      left: $(window).scrollLeft(),
      timestamp: new Date().getTime()
    };

    /* 2. Events required to update UI */
    elements.menu.on('click', 'a[href="#"]', onButtonClick);
    elements.editor.on('mouseenter', '> *', onEditViewHover);
    elements.editor.on('click', '*', function(e) {
      e.preventDefault();
    });

    /* 3. Events required needing UI redrawing */
    $(window).on({resize: onResize});
  }

  /* Public */
  Editor.prototype = {
    /* Bootstrap editor */
    init: function() {
      var range;

      /* Load HTML elements */
      bindElements();

      /* Bind events */
      bindEvents();

      /* Load services */
      loadServices();

      /* Load extensions */
      loadExtensions();

      /* Create selection range */
      range = document.createRange();
      selection = window.getSelection();
      range.setStart(document.querySelector('[data-edit]'), 1);
      selection.removeAllRanges();
      selection.addRange(range);

      if (services.localStorage) {
        loadState();
      }

      booted = true;

      /* Load options menu */
      this.extend(new Extension({
        name: "options",
        loadFromSource: elements.options,
        subscribe: ['*'],
        bindings: {},
        onDraw: function(where) {
          /* 0. If open then return */

          /* 1. If hover event */

          /* 2. On key press */

          return where;
        },
        onClick: function(id, value, currentSelection, view) {
          id = view.attr('data-button-id');
          if (extensions[0].bindings.hasOwnProperty(id)) {
            extensions[0].bindings[id](currentSelection);
            extensions[0].close();
          }
        },
        open: function() {

        },
        close: function() {

        },
        isOpen: function() {

        },
        bind: function(id, listener) {
          this.bindings[id] = listener;
        }
      }));
    },
    extend: function(extension) {
      if (booted) {
        return loadExtension(extension, -1);
      }

      extensions.push(extension);
      return extensions.length - 1;
    },
    selection: function() {
      return selection;
    },
    options: function() {
      return elements.options;
    },
    menu: function() {
      return elements.menu;
    },
    editor: function() {
      return elements.editor;
    },
    extensions: function() {
      return extensions;
    },
    root: function() {
      return elements.root;
    },
    topNode: function(node) {
      if (node instanceof $) {
        node = node[0];
      }
      while (node && node.parentNode != elements.editor[0]) {
        node = node.parentNode;
      }
      return $(node);
    },
    addOption: function(extension, options) {
      var id;
      var listener,
        button,
        load = function(source, parent) {
          var ele = source.split(",");
          var but = $('<li>').attr({'data-extension-id': 0});
          if (ele[0]) {
            but.attr('data-button-id', ele[0]);
          }
          if (ele[1]) {
            but.html('<i class="fa fa-' + ele[1] + '"></i>');
          }
          if (ele[2]) {
            but.html(but.html() + ele[2]);
          }
          parent.append(but);
          return ele[0];
        };

      for (button in options) {
        if (options.hasOwnProperty(button)) {
          listener = options[button];
          id = load(extension.name + '.' + button, extensions[0].view.find('ul'));
          extensions[0].bind(id, listener);
        }
      }
    }
  };

  /*
   * Private members: Extension
   * ==========================
   */

  /* Load extension from source */
  function loadExtensionFromSource(selector, extension) {
    var s;

    /* 1. Load HTML */
    extension.view = selector instanceof $ ? selector : $(selector);

    /* 2. Load subscribed events */
    s = extension.view.attr('data-subscribe');
    if (!s) {
      extension.subscribe = [];
    }
    else {
      extension.subscribe = s.split(" ").filter(function(e) {
        return !!e;
      });
    }
  }

  function createExtension(structure, extension) {
    var buttons,
      load = function(source, attr, parent) {
        var ele = source.split(",");
        var but = $('<a>').addClass('button').attr('href', '#');
        if (ele[0]) {
          but.attr('data-button-id', ele[0]);
        }
        if (ele[1]) {
          but.html('<i class="fa fa-' + ele[1] + '"></i>');
        }
        if (ele[2]) {
          but.html(but.html() + ele[2]);
        }
        but.attr(attr);
        parent.append($('<li>').append(but));
      };

    if (!structure || !structure instanceof  Array) {
      console.log('Failed to load extension `' + extension.name + '`.');
      return false;
    }

    buttons = $('<ul>');

    structure.forEach(function(buttonGroup) {
      var sep, name;
      if (buttonGroup instanceof Object) {
        sep = buttonGroup.sep;
        name = buttonGroup.name;
        switch (buttonGroup.type) {
          /* Choose one or none */
          case 'select':
            buttonGroup.buttons.forEach(function(e) {
              load(e, {'data-button-type': 'select', 'data-button-name': name}, buttons);
            });
            break;
          /* Choose one */
          case 'radio':
            buttonGroup.buttons.forEach(function(e) {
              load(e, {'data-button-type': 'radio', 'data-button-name': name}, buttons);
            });
            break;
          default:
            buttonGroup.buttons.forEach(function(e) {
              load(e, {}, buttons);
            });
            break;
        }
        if (sep === true) {
          buttons.find('li:last-child').addClass('sep-right');
        }
      }
    });

    extension.view = $('<div>').append(buttons.addClass("menu").attr('data-extension-id', extension.id));
  }

  Extension.prototype = {
    /** @namespace options.onShow */
    state: {},
    init: function(options) {
      var f;
      /** @namespace options.name */
      /** @namespace options.loadFromSource - if set then load from HTML */
      /** @namespace options.structure - extension view structure */
      /** @namespace options.subscribe */
      /** @namespace options.onFocusIn */
      /** @namespace options.onFocusOut */
      /** @namespace options.onHide */
      /** @namespace options.optionsMenu */

      /* Name of extension: required for button click listener */
      this.name = options.name;
      if (options.loadFromSource) {
        if (false === loadExtensionFromSource(options.loadFromSource, this)) {
          return;
        }
      } else {
        if (false === createExtension(options.structure, this)) return;
        this.subscribe = [];
      }

      this.subscribe = this.subscribe.concat(options.subscribe);

      /* Fix and hide extension if not options */
      if ("options" === this.name) {
        this.visible = true;
      } else {
        this.view.css({position: 'absolute', top: 0, left: 0}).hide();
        this.visible = false;
      }

      for (f in options) {
        if (['show', 'hide', 'findViewById', 'init', 'focusIn', 'focusOut', 'state'].indexOf(f) === -1) {
          this[f] = options[f];
        }
      }
      if (options.optionsMenu) {
        editor.addOption(this, options.optionsMenu);
      }
      if (options.callback) {
        options.callback(this);
      }
    },
    focusIn: function(eventType, node, currentSelection, event) {
      var element = $(node);
      this.state = {
        eventType: eventType,
        node: node,
        element: element,
        selection: currentSelection,
        event: event,
        position: {
          top: currentSelection.position.top,
          left: currentSelection.position.left
        }
      };
      this.onFocusIn(eventType, node, currentSelection, event);
    },
    focusOut: function(eventType, node, currentSelection, event) {
      if ($.contains(this.view[0], event.target)) return;
      this.onFocusOut(eventType, node, currentSelection);
    },
    show: function() {
      var position = this.onDraw(this.state.position, this.state.node);
      this.view.css(position);
      /* clear menu */
      this.view.find('[selected]').removeAttr('selected');
      this.onLoad(this.state.node, this.state.selection.nodes);
      this.onShow();
      if (!this.view.is(':visible')) this.view.show();
      this.visible = true;
    },
    hide: function() {
      this.onHide();
      if (this.view.is(':visible')) this.view.hide();
      this.visible = false;
    },
    findViewById: function(id) {
      return elements.menu.find('[data-id=' + id + ']');
    },
    onLoad: function(/* focus, nodeList */) {
    },
    onHide: function() {
    },
    onShow: function() {
    },
    onEvent: function() {
    },
    onFocusIn: function(/* eventType, node, currentSelection, event */) {
      this.show();
    },
    onFocusOut: function(/* eventType, node, currentSelection */) {
      this.hide();
    },
    onClick: function() {
    },
    onDraw: function(where /* , focusNode */) {
      return where;
    }
  };

  /* Export classes */
  window.Editor = Editor;
  window.Editor.Extension = Extension;
  window.editor = new Editor();
}(window.jQuery, window, window.document));
/* -- fin. */
