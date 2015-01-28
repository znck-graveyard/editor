/* -- text.extension --*/
(function(Editor, $, window, undefined) {
  function Text() {
    this.view = Editor.createView([
      {
        name: "headings",
        type: "select",
        buttons: ["h1,,<b>H1</b>", "h2,,<b>H2</b>", "h3,,<b>H3</b>"],
        sep: true
      },
      {
        buttons: ["bold,,<b>B</b>", "italic,,<b><i>i</i></b>"],
        type: "checkbox",
        sep: true
      },
      {
        name: "aligns",
        buttons: ["align-left,align-left", "align-center,align-center"],
        type: "radio",
        sep: true
      },
      {
        buttons: ["link,link", "code,,{}", "quote,quote-right"],
        break: true
      },
      {
        buttons: ["link-cancel,times", "link-add,check"],
        group: true
      }
    ]);
  }

  Text.prototype = {
    name: 'text',
    subscribe: [
      "@cmd+b", "@ctrl+b",
      "@cmd+i", "@ctrl+i",
      "@alt+enter", "@shift+enter",
      "#text",
      "div",
      "a",
      "span",
      "code",
      "p",
      "blockquote", "q",
      "b", "i", "strong", "em",
      "h1", "h2", "h3", "h4", "h5", "h6"
    ],
    onClick: function(id, value) {
      /** @namespace this.R.h3 */
      /** @namespace this.R.h1 */
      /** @namespace this.R.h2 */
      /** @namespace this.R.bold */
      /** @namespace this.R.alignLeft */
      var node;
      /** @namespace this.R.italic */

      console.log(id + " " + value);
      switch (id) {
        case this.R.h1:
          return Editor.execFormatBlock('h1');
        case this.R.h2:
          return Editor.execFormatBlock('h2');
        case this.R.h3:
          return Editor.execFormatBlock('h3');
        case this.R.quote:
          return Editor.execFormatBlock('blockquote');
        case this.R.bold:
          return document.execCommand('bold', false, null);
        case this.R.italic:
          return document.execCommand('italic', false, null);
        case this.R.alignLeft:
          document.execCommand('justifyleft', false, null);
          break;
        case this.R.alignCenter:
          document.execCommand('justifycenter', false, null);
          break;
        case this.R.link:
          this.openDialog();
          break;
        case this.R.linkAdd:
          this.dilogStatus = false;
          this.addLink(this.input.val());
          break;
        case this.R.linkCancel:
          this.dilogStatus = false;
          this.removeLink();
          break;
        case this.R.code:
          Editor.execFormatCode();
          break;
      }
    },
    focusIn: function() {
      if (this.dilogStatus === true) {
        return;
      }

      if (false !== this.placeholder && Editor.elements.editable.children().length > 2) {
        Editor.elements.editable.find('p[data-placeholder]').removeAttr('data-placeholder');
        this.placeholder = false;
      }

      if (!this.base.state.selection.isCollapsed) {
        this.loadMenu();
        this.loadState();
        this.draw();
        this.view.show();
      } else {
        this.focusOut();
      }
    },
    loadMenu: function() {
    },
    focusOut: function() {
      if (this.dilogStatus === true) {
        return;
      }
      this.isActive = false;
      this.view.hide();
    },
    onEvent: function(cmd) {
      switch (cmd) {
        case '@cmd+b':
        case '@ctrl+b':
          this.base.execCommand('bold');
          return true;
        case '@cmd+i':
        case '@ctrl+i':
          this.base.execCommand('italic');
          return true;
        case '@shift+enter':
          this.base.execInsertNewLine();
          return true;
      }
      return false;
    },
    draw: function() {
      var position = this.base.state.position;
      this.view.css({
        top: position.top - this.view.height() - 8,
        left: position.hcenter - this.view.width() / 2
      });
    },
    init: function() {
      var menus = this.view.find('.menu'), self = this;

      menus.last().prepend(
        $('<li>').append($('<input>').attr({
          type: 'text',
          placeholder: 'Paste or type a link'
        })).on('keypress', function(e) {
          if (e.which == 13) {
            self.dilogStatus = false;
            self.addLink(self.input.val());
          }
        })
      ).hide();

      this.input = this.view.find('input');
      this.view.append($('<div>').addClass('nub nub-bottom'));
      this.tools = this.view.find('.menu').first();
      this.dilog = this.view.find('.menu').last();
      this.buttons = {
        h1: this.view.find('a[data-button-id="h1"]'),
        h2: this.view.find('a[data-button-id="h2"]'),
        h3: this.view.find('a[data-button-id="h3"]'),
        bold: this.view.find('a[data-button-id="bold"]'),
        italic: this.view.find('a[data-button-id="italic"]'),
        alignLeft: this.view.find('a[data-button-id="align-left"]'),
        alignCenter: this.view.find('a[data-button-id="align-center"]'),
        link: this.view.find('a[data-button-id="link"]'),
        code: this.view.find('a[data-button-id="code"]'),
        quote: this.view.find('a[data-button-id="quote"]'),
        add: this.view.find('a[data-button-id="link-add"]'),
        cancel: this.view.find('a[data-button-id="link-cancel"]')
      };
    },
    loadState: function() {
      var par = $(this.base.getRootNode(this.base.state.focusNode));
      var el = Editor.state.nodeList;
      this.tools.show();
      this.dilog.hide();
      this.select(this.buttons.h1, el.h1)
        .select(this.buttons.h2, el.h2)
        .select(this.buttons.h3, el.h3)
        .select(this.buttons.bold, el.b)
        .select(this.buttons.italic, el.i)
        .select(this.buttons.link, el.a)
        .select(this.buttons.alignLeft, par.css('text-align') == 'left')
        .select(this.buttons.alignCenter, par.css('text-align') == 'center')
        .select(this.buttons.quote, el.blockquote)
        .select(this.buttons.code, el.code);
    },
    openDialog: function() {
      var val = $(this.base.findNodeInEditable(this.base.state.focusNode, function(n) {
        return n.nodeName.toLowerCase() == 'a';
      })).attr('href');
      console.log(val);
      this.dilogStatus = true;
      this.tools.hide();
      this.dilog.show();
      this.draw();
      this.base.saveSelection();
      if (val) {
        this.input.val(val);
      } else {
        this.input.val('');
      }
      this.input.focus();
    },
    addLink: function(link) {
      if (!link) {
        link = '#--ignore';
      }
      this.base.restoreSelection();
      this.base.execCommand('createLink', link);
      this.loadState();
    },
    removeLink: function() {
      var el, range;
      this.base.restoreSelection();
      el = this.base.findNodeInEditable(this.base.state.selection.focusNode, function(n) {
        return n.nodeName.toLowerCase() == 'a';
      });
      if (el.nodeName.toLowerCase() == 'a') {
        $(el).contents().unwrap();
      }
    },
    select: function(button, is) {
      if (is) {
        button.attr('selected', '');
      } else {
        button.removeAttr('selected');
      }
      return this;
    }
  };

  Editor.install(new Text());
}(window.Editor, window.jQuery, window));