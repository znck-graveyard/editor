/* Util */
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}
/* GUI Editor for HTML */
(function($, window, document, undefined) {
  'use strict';
  /* Class: Editor */
  function Editor() {
  }

  /*
   * Private members: Extension
   * ==========================
   */
  /* Used to create unique extension id */
  var lastExtensionId = 0;
  /* Used to create unique button id */
  var lastButtonId = 0;

  /*
   * Private members: Editor
   * =======================
   */

  /* Data variables */
  var elements = {}, services = {}, selection, extensions = [], nodes = {}, drawState = {}, bindings = {};

  /* State variables */

  /* Editor has initiated or not */

  var booted = false;
  /* Used for scroll throttling */
  var scrollState = {}, scrollTimer = 0;
  /* Used to distinguish key down/up events from IME composition */
  var composing = false;
  /* Last selection - collapsed or not */
  var lastSelectionCollapsed = false;
  /* Synchronizing extension load */
  var loadingExtensions = false;

  /* Config variables */

  /* in ms */
  var scrollUpdateFrequency = 100;

  /* Load/Create HTML bindings */
  function bindElements() {
    var hook;

    /* 1. Load/Create editor root element */
    hook = $('[data-serene-editor]');
    if (hook.length > 1) {
      console.log('Multiple editors not supported. Picking up first.');
      hook = hook.first();
    } else if (hook.length === 0) {
      hook = $('<div>').attr('data-serene-editor', '');
      $('body').append(hook);
    }
    // Plug the hook
    elements.root = hook;

    /* 2. Load/Create menu container */
    hook = elements.root.find('[data-serene-menu-container]');
    if (hook.length === 0) {
      hook = $('<div>').attr('data-serene-menu-container', '').addClass('menu-container');
      elements.root.append(hook);
    }
    // Plug the hook
    elements.menu = hook;

    /* 3. Load/Create editor window */
    hook = elements.root.find('article[data-serene-edit]');
    if (hook.length === 0) {
      hook = $('<article>').attr('data-serene-edit', '')
        .append($('<h2>').attr('data-placeholder', 'Title here').addClass('title'))
        .append($('<p>'));
      elements.root.append(hook);
    }
    // Plug the hook
    elements.editor = hook;

    /* 4. Load/Create options menu - Lists all creatable object */
    hook = elements.menu.find('[data-serene-options]');
    if (hook.length === 0) {
      hook = $('<div>').attr('data-serene-options', '')
        .append($('<div>').addClass('toggle')
          .append($('a').addClass('button icon').attr({href: '#', 'data-id': 'toggle'}).html('&times;')))
        .append($('<div>').addClass('menu options-menu').html('<div><div></div></div>'));
      elements.menu.append(hook);
    }
    // Plug the hook
    elements.options = hook;

    /* 5. Make editor editable */
    elements.editor.attr({contenteditable: true});

    /* 6. Hide all menu */
    elements.menu.find('> *').hide();

    /* 7. Last focused element */
    elements.lastFocused = undefined;
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
      mouseup: onMouseUp,
      scroll: onScroll
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

    /* 3. Events required needing UI redrawing */
    $(window).on({resize: onResize});
  }

  /* Load service states */
  function loadServices() {
    /* 1. Check if localStorage is available */
    services.localStorage = window.hasOwnProperty('localStorage') && window.localStorage !== null;
  }

  /* Load an extension */
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
    extension.view.find('a[href="#"]').each(function() {
      var name = $(this).attr('data-button-id').replace(/-([a-z0-9])/gi, function(match) {
        return match[1].toUpperCase();
      });
      extension.R[name] = lastButtonId = lastButtonId + 1;
      $(this).attr('data-extension-binder-id', id);
      $(this).attr('data-button-binder-id', lastButtonId);
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
      } else filter.push(event);
    });
    extension.subscribe = filter;
    return id;
  }

  /* Load all extensions */
  function loadExtensions() {
    var i;
    loadingExtensions = true;
    for (i = 0; i < extensions.length; ++i) {
      loadExtension(extensions[i], i);
    }
    booted = true;
    loadingExtensions = false;
  }

  /* Load last saved state */
  function loadState() {
    // TODO
  }

  /* EventListener: keyup */
  function onKeyUp(event) {
    var focusElement, blur, isSelected, where, currentSelection, t;

    t = getSelection();
    blur = t[0];
    isSelected = t[1];
    where = t[2];
    nodes = t[3];
    currentSelection = t[4];

    focusElement = $(event.target);
    /* if on new view then blur out last view */

    if (blur || elements.lastFocused && elements.lastFocused !== focusElement) {
      onEditViewBlur('keyup', elements.lastFocused);
    }


    /* Update current selection */
    selection = currentSelection;


    extensions[0].onFocusIn();

    if (isSelected) {
      focusElement = $(currentSelection.focusNode);
      onEditViewFocus('keyup', currentSelection.focusNode.nodeName.toLowerCase(), focusElement, event, where);
      elements.lastFocused = focusElement;
    } else if (elements.lastFocused) {
      onEditViewBlur('keyup', focusElement);
      elements.lastFocused = undefined;
    }
  }

  function onKeyDown(event) {
    var focusElement, keyStroke, activeKeys = [], currentSelection;
    activeKeys.push(event.which);
    if (event.shiftKey) activeKeys.push(16);
    if (event.ctrlKey) activeKeys.push(17);
    if (event.altKey) activeKeys.push(18);
    if (event.metaKey) activeKeys.push(91);

    keyStroke = getKeyStroke(activeKeys);

    if (bindings.hasOwnProperty(keyStroke)) {
      currentSelection = getSelection()[4];
      focusElement = $(currentSelection.focusNode);
      bindings[keyStroke].some(function(callable) {
        return callable(keyStroke, focusElement, event, currentSelection);
      });
    }
  }

  /* EventListener: mousedown */
  function onMouseDown(event) {

  }

  /* EventListener: mouseup */
  function onMouseUp(event) {
    var focusElement, blur, isSelected, where, nodeList, currentSelection, t;

    /* Handle only left click */
    if (event.which !== 1) return;

    t = getSelection();
    blur = t[0];
    isSelected = t[1];
    where = t[2];
    nodeList = t[3];
    currentSelection = t[4];

    focusElement = $(event.target);
    /* if clicked on new view then blur out last view */

    if (blur || elements.lastFocused && elements.lastFocused !== focusElement) {
      onEditViewBlur('mouseup', elements.lastFocused);
    }


    /* Update current selection */
    selection = currentSelection;
    /* Update node list */
    nodes = nodeList;

    if (isSelected) {
      focusElement = $(currentSelection.focusNode);
      onEditViewFocus('mouseup', currentSelection.focusNode.nodeName.toLowerCase(), focusElement, event, where);
      elements.lastFocused = focusElement;
    } else if ($.contains(elements.editor[0], event.target)) {
      onEditViewFocus('mouseup', event.target.nodeName.toLowerCase(), focusElement, event);
      elements.lastFocused = focusElement;
    } else {
      elements.lastFocused = undefined;
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
      draw(delta);
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
      draw(delta);
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
    draw(undefined, true);
  }

  /* EventListener: edit view focus */
  function onEditViewFocus(type, nodeName, view, event, where) {
    /* Calculate where */
    drawState = {};
    drawState.type = type;
    drawState.event = event;
    drawState.where = where ? where : {
      top: view.position().top,
      right: view.position().left + view.outerWidth(true),
      bottom: view.position().top + view.outerHeight(true),
      left: view.position().left,
      width: view.width(),
      height: view.height(),
      marginTop: (view.outerHeight(true) - view.height()) / 2,
      marginLeft: (view.outerWidth(true) - view.width()) / 2
    };
    drawState.view = view;
    drawState.nodeName = nodeName;

    extensions.forEach(function(extension) {
      if (extension.subscribe.find(function(e) {
          return e === nodeName;
        })) {
        // TODO not terminating
        if (extension.onFocusIn(type, nodeName, view, event)) return;
      }
    });

    /* Send event to wildcards */
    extensions.forEach(function(extension) {
      if (extension.subscribe.find(function(e) {
          return e === "*";
        })) {
        if (extension.onFocusIn(type, nodeName, view, event)) return;
      }
    });
  }

  /* EventListener: edit view blur */
  function onEditViewBlur(type, view) {
    var nodeName = view ? view[0].nodeName : undefined;

    extensions.forEach(function(extension) {
      if (extension.subscribe.find(function(e) {
          return nodeName === undefined || e === nodeName;
        })) {
        extension.onFocusOut(type, nodeName, view);
      }
    });

    /* Send event to wildcards */
    extensions.forEach(function(extension) {
      if (extension.subscribe.find(function(e) {
          return e === "*";
        })) {
        extension.onFocusOut(type, nodeName, view);
      }
    });
  }

  /* EventListener: edit view hover */
  function onEditViewHover(event) {
    drawState.hover = event;
    //extensions[0].onFocusIn("hover", event, $(event.target), event);
  }

  /* EventListener: menu button click */
  function onButtonClick(event) {
    var id, view, value;

    view = $(event.target);

    event.preventDefault();
    /* Get extension id */
    id = parseInt(view.attr('data-extension-binder-id'));
    value = getButtonValue(view);
    if (extensions[id]) {
      extensions[id].onClick(
        parseInt(view.attr('data-button-binder-id')), value, elements.lastFocused, event, view);
      nodes = getSelection()[3];
      extensions[id].show();
    }
  }

  /* Get button value */
  function getButtonValue(button) {
    var state = button.is('[selected]'), value;
    switch (button.attr('data-button-type')) {
      case 'select':
        elements.menu.find('a[data-group-name="' + button.attr('data-group-name') + '"]').removeAttr('selected');
        if (state) {
          button.removeAttr('selected');
          return button.attr('data-button-id');
        }
        return undefined;
      case 'radio':
        elements.menu.find('a[data-group-name="' + button.attr('data-group-name') + '"]').removeAttr('selected');
        return button.attr('data-button-id');
      default:
        if (state) button.removeAttr('selected');
        return !state;
    }
  }

  /* Get current selection */
  function getSelection() {
    var sel = false, rect, boundary, range, focusNode;
    /* 1. Get current selection */
    var s = window.getSelection();
    /* 2. Create new node list */
    var n = createNodeList(s.focusNode);
    /* 3. Check if last selection is blurring or not */
    var blur = s.isCollapsed === true && lastSelectionCollapsed === false;
    /* 4. Set focusNode */
    focusNode = s.focusNode;
    if (false === s.isCollapsed && false === composing) {
      if ($.contains(elements.editor[0], s.focusNode)) {
        /* 5. Is there any selection */
        sel = true;
        range = s.getRangeAt(0);
        boundary = range.getBoundingClientRect();
        /* 6. Position */
        rect = {
          top: window.pageYOffset + boundary.top,
          left: boundary.left,
          right: boundary.right,
          bottom: window.pageYOffset + boundary.bottom,
          width: boundary.width,
          height: boundary.height
        };
      }
    }

    return [blur, sel, rect, n, s];
  }

  /* Draw menus */
  function draw(delta) {
    extensions.forEach(function(extension) {
      if (extension.visible)
        extension.onDraw(delta);
    });
  }

  /* Create node list for current selection */
  function createNodeList(node) {
    var list = {};
    if (node)
      while (node.parentNode) {
        list[node.nodeName.toLowerCase()] = true;
        if (node === elements.editor[0]) break;
        node = node.parentNode;
      }
    return list;
  }

  /* Convert keystroke into string */
  function getKeyStroke(keys, regex) {
    var map, metaMap, metaKeys = [], otherKeys = [], string = [];
    regex = regex || true;

    map = {
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
    metaMap = [16, 17, 18, 91, 93];

    /* Filter keys */
    keys.forEach(function(key) {
      if (map.hasOwnProperty(key)) {
        if ($.inArray(key, metaMap) != -1) metaKeys.push(map[key]);
        else otherKeys.push(map[key]);
      }
    });

    metaKeys.sort();
    otherKeys.sort();

    if (metaKeys.length) {
      string.push(metaKeys.join("+"));
    }
    if (otherKeys.length) {
      string.push(otherKeys.join("+"));
    }
    return "@" + string.join("+");
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
      range.setStart(document.querySelector('[data-serene-edit]'), 1);
      selection.removeAllRanges();
      selection.addRange(range);

      if (services.localStorage) {
        loadState();
      }

      /* Load options menu */
      this.extend(new Extension({
        name: "options",
        loadFromSource: elements.options,
        subscribe: [],
        onDraw: function(where) {
          var view;
          var event = drawState.hover;
          /* 0. If open then return */
          if (this.isOpen()) {
            drawState.hover = undefined;
            return;
          }
          /* 1. If hover event */
          if (event) {
            if (!$.contains(elements.editor[0], event.target)) {
              drawState.hover = undefined;
              return;
            }
            view = editor.topNode(event.target);
            where = {
              top: view.position().top + view.outerHeight(true) - (this.view.height()) / 2,
              left: view.position().left
            };
          }
          /* 2. On key press */
          else {
            view = window.getSelection().getRangeAt(0).getBoundingClientRect();
            console.log([view.top, window.pageYOffset].join(" "));
            where = {
              top: window.pageYOffset + view.top + (view.height - this.view.height()) / 2,
              left: editor.topNode(selection.focusNode).position().left
            };
          }
          this.view.css({
            top: where.top,
            left: where.left - 66
          });
          drawState.hover = undefined;
        },
        onClick: function(id, value) {
          switch (id) {
            case this.R.toggle:
              if (this.isOpen()) this.close();
              else this.open();
              break;
          }
        },
        open: function() {
          this.view.find('.toggle > a').css('transform', 'rotate(0deg)');
          this.view.find(".options-menu").show("fold");
        },
        close: function() {
          this.view.find('.toggle > a').css('transform', 'rotate(45deg)');
          this.view.find('.options-menu').hide("fold");
        },
        isOpen: function() {
          if (!this.view.is(":visible")) this.view.show();
          return this.view.find(".options-menu").is(":visible");
        }
      }));
    },
    extend: function(extension) {
      /* spin lock: wait until loading is done */
      var spinning = loadingExtensions;
      while (loadingExtensions);

      if (booted || spinning) {
        return loadExtension(extension, -1);
      } else {
        extensions.push(extension);
        return extensions.length - 1;
      }
    },
    state: function() {
      return drawState;
    },
    nodes: function() {
      return nodes;
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
    topNode: function(node) {
      if (node instanceof $) node = node[0];
      while (node && node.parentNode != elements.editor[0]) {
        node = node.parentNode;
      }
      return $(node);
    }
  };

  /* Class: Extension */
  function Extension(options) {
    this.id = lastExtensionId = lastExtensionId + 1;
    this.init(options);
  }


  /*
   * Private members: Extension
   * ==========================
   */

  /* Load extension from source */
  function loadExtensionFromSource(id, extension) {
    var s;

    /* 1. Load HTML */
    extension.view = id instanceof $ ? id : $(id);

    /* 2. Load subscribed events */
    s = extension.view.attr('data-sereno-subscribe');
    if (!s) extension.subscribe = [];
    else
      extension.subscribe = s.split(" ").filter(function(e) {
        return !!e;
      });
  }

  function createExtension(structure, extension) {
    var buttons, load = function(source, attr, parent) {
      var ele = source.split(",");
      var but = $('<a>').attr("href", "#");
      if (ele[0]) but.attr('data-button-id', ele[0]);
      if (ele[1]) but.html('<i class="fa fa-' + ele[1] + '"></i>');
      if (ele[2]) but.html(but.html() + ele[2]);
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
        sep = true === buttonGroup.sep;
        name = buttonGroup.name;
        switch (buttonGroup.type) {
          case 'select':
            buttonGroup.buttons.forEach(function(e) {
              load(e, {'data-button-type': 'select', 'data-group-name': name}, buttons);
            });
            break;
          case 'radio':
            buttonGroup.buttons.forEach(function(e) {
              load(e, {'data-button-type': 'radio', 'data-group-name': name}, buttons);
            });
            break;
          default:
            buttonGroup.buttons.forEach(function(e) {
              load(e, {'data-button-type': 'checkbox'}, buttons);
            });
            break;
        }
        if (sep) {
          buttons.find('li:last-child').addClass('group');
        }
      }
    });

    extension.view = $('<div>').addClass('menu').attr('data-sereno-ext-id', extension.id).append(buttons);
  }

  Extension.prototype = {
    init: function(options) {
      /** @namespace options.name */
      /** @namespace options.loadFromSource - if set then load from HTML */
      /** @namespace options.structure - extension view structure */
      /** @namespace options.subscribe */
      /** @namespace options.onFocusIn */
      /** @namespace options.onFocusOut */
      /** @namespace options.onHide */
      /** @namespace options.onShow */

      /* Name of extension: required for button click listener */
      var find_function;
      var f;
      this.name = options.name;
      if (options.loadFromSource) {
        if (false === loadExtensionFromSource(options.loadFromSource, this)) return;
      } else {
        if (false === createExtension(options.structure, this)) return;
        this.subscribe = [];
      }

      this.subscribe = this.subscribe.concat(options.subscribe);

      /* set status = active */
      this.status = 'active';

      /* Fix and hide extension view */
      this.view.css({position: 'absolute', top: 0, left: 0}).hide();
      this.visible = false;

      /* Load events */
      find_function = function(e) {
        return e == f;
      };
      for (f in options) {
        if (!['show', 'hide', 'findViewById', 'init'].find(find_function)) {
          this[f] = options[f];
        }
      }
      /* TODO: Insert in options menu */
      this.menu = (options.init) ? options.init() : [];
    },
    onClick: function() {
    },
    onDraw: function(where) {
      where = where ? where : {top: 0, left: 0};
      this.view.css({
        top: where.top,
        left: where.left
      });
    },
    onFocusIn: function() {
      this.show();
    },
    onFocusOut: function() {
      this.hide();
    },
    onLoad: function() {
    },
    onHide: function() {
    },
    onShow: function() {
    },
    onEvent: function() {
    },
    show: function() {
      this.onDraw(drawState.where);
      /* clear menu */
      this.view.find('[selected]').removeAttr('selected');
      this.onLoad(drawState.view, nodes);
      this.onShow();
      if (!this.view.is(':visible')) this.view.show();
    },
    hide: function() {
      this.onHide();
      if (this.view.is(':visible')) this.view.hide();
    },
    findViewById: function(id) {
      return elements.menu.find('[data-button-binder-id=' + id + ']');
    }
  };

  /* Export classes */
  window.Editor = Editor;
  window.Editor.Extension = Extension;
  window.editor = new Editor();
}(window.jQuery, window, window.document));
/* -- fin. */

/* Init editor */
window.editor.init();;/*
(function($, window, document, E, undefined) {
  E.load(function() {
    var textMenu = E.menuElement.find('> .menu.data-image-menu');
    E.menuList.image = new Menu(textMenu, {
      move: function(position, w) {
        position.top -= textMenu.height() - 8;
        position.left += w / 2 - textMenu.width() / 2;
        return position;
      }
    });

    E.watch('IMG', function(event) {
      E.move(E.menuList.image, $(event.target));
      return true;
    });
  });
}(window.jQuery, window, window.document, window.Editor));*/
;/* -- text.extension --*/
(function(Editor, Extension, jQuery, window, document, undefined) {
  var id = Editor.extend(new Extension({
      name: 'text',
      loadFromSource: '#serene-editor-text-menu',
      subscribe: ["@cmd+b", "@cmd+i", "@enter", "#text", "a", "code", "p", "b", "i", "strong", "em", "h1", "h2", "h3", "h4", "h5", "h6"],
      onClick: function(id, value) {
        /** @namespace this.R.h3 */
        /** @namespace this.R.h1 */
        /** @namespace this.R.h2 */
        /** @namespace this.R.bold */
        /** @namespace this.R.italic */
        switch (id) {
          case this.R.h1:
            document.execCommand('formatBlock', false, !value ? 'h1' : 'p');
            break;
          case this.R.h2:
            document.execCommand('formatBlock', false, !value ? 'h2' : 'p');
            break;
          case this.R.h3:
            document.execCommand('formatBlock', false, !value ? 'h3' : 'p');
            break;
          case this.R.bold:
            if (!document.execCommand('bold', false, null))
              document.execCommand('formatBlock', false, 'b');
            break;
          case this.R.italic:
            if (!document.execCommand('italic', false, null))
              document.execCommand('formatBlock', false, 'i');
            break;
        }
      },
      onFocusIn: function(type, node) {
        if (editor.state().view && editor.state().view.text().length > 0)
          this.show();
        return true;
      },
      onLoad: function(view, nodes) {
        if (nodes.h1) this.findViewById(this.R.h1).attr('selected', '');
        if (nodes.h2) this.findViewById(this.R.h2).attr('selected', '');
        if (nodes.h3) this.findViewById(this.R.h3).attr('selected', '');
        if (nodes.b || nodes.strong) this.findViewById(this.R.bold).attr('selected', '');
        if (nodes.i || nodes.em) this.findViewById(this.R.italic).attr('selected', '');
      },
      onEvent: function(cmd, view, event, selection) {
        /* this == window */
        switch (cmd) {
          case '@cmd+b':
            event.preventDefault();
            document.execCommand('bold', false, null);
            break;
          case '@cmd+i':
            event.preventDefault();
            document.execCommand('italic', false, null);
            break;
          /* TODO */
          /*case '@enter':*/
          /*
           1. If cursor in line then insert newline.
           2. If at the end of line and there is an element after, then move to it.
           3. If last child, insert new paragraph.
           */
        }
      },
      onDraw: function(where) {
        if (where)
          this.view.css({
            top: where.top + where.marginTop - this.view.outerHeight(true) - 5,
            left: (where.left + where.right - this.view.width()) / 2
          });
      }
    })
  );
}(window.editor, window.Editor.Extension, window.jQuery, window, window.document));