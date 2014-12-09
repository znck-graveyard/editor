/* -- text.extension --*/
(function(Editor, jQuery, window, document, undefined) {
  var id = Editor.extend({
    name: 'text',
    structure: [
      {
        name: "headings",
        type: "select",
        buttons: ["h1,,H1", "h2,,H2", "h3,,H3"],
        sep: true
      },
      {
        buttons: ["bold,,<b>b</b>", "italic,,<i>i</i>"],
        sep: true
      },
      {
        buttons: ["align-left,align-left", "align-center,align-center"],
        sep: true
      },
      {
        buttons: ["link,link", "code,code", "quote,quote-right"],
        break: true
      },
      {
        buttons: ["link-add,check", "link-cancel,times"]
      }
    ],
    optionsMenu: {
      "text,paragraph,TEXT": function(selection) {
        window.alert('Viola adding new text');
      }
    },
    subscribe: [
      "@cmd+b","@ctrl+b",
      "@cmd+i","@ctrl+i",
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
          /* TODO test formatBlock compatibility http://www.quirksmode.org/dom/execCommand.html */
          document.execCommand('formatBlock', false, value ? 'H1' : 'P');
          break;
        case this.R.h2:
          document.execCommand('formatBlock', false, value ? 'H2' : 'P');
          break;
        case this.R.h3:
          document.execCommand('formatBlock', false, value ? 'H3' : 'P');
          break;
        case this.R.bold:
          document.execCommand('bold', false, null);
          break;
        case this.R.italic:
          document.execCommand('italic', false, null);
          break;
        case this.R.alignLeft:
          document.execCommand('justifyleft', false, null);
          break;
        case this.R.alignCenter:
          document.execCommand('justifycenter', false, null);
          break;
        case this.R.link:
          if (value) {
            this._temp = Editor.saveSelection();
          } else {
            node = this.state.node;
            while (node && node.nodeName.toLowerCase() != 'a') {
              node = node.parentNode;
            }
            if (node) {
              this.view.find('input').first().val(jQuery(node).attr('href'));
            } else {
              this.view.find('input').first().val('');
            }
          }
          this.view.find('.menu').hide().last().show();
          break;
        case this.R.linkAdd:
          node = this.state.node;
          Editor.restoreSelection(this._temp);
          while (node && node.nodeName.toLowerCase() != 'a') {
            node = node.parent;
          }
          if (node) {
            jQuery(node).attr('href', this.view.find('input').first().val());
          } else {
            document.execCommand('createLink', false, this.view.find('input').first().val());
          }
          this.hide();
          break;
        case this.R.linkCancel:
          node = this.state.node;
          while (node && node.nodeName.toLowerCase() != 'a') {
            node = node.parent;
          }
          if (node) {
            node = jQuery(node);
            node.before(node.html());
            node.remove();
          }
          this.hide();
          break;
        case this.R.quote:
          document.execCommand('formatBlock', false, value ? 'BLOCKQUOTE' : 'P');
          break;
        case this.R.code:
          if (value) {
            Editor.surroundSelection(document.createElement('code'));
          } else {
            node = this.state.node;
            while (node && node.nodeName.toLowerCase() != 'code') {
              node = node.parent;
            }
            if (node) {
              node = jQuery(node);
              node.before(node.html());
              node.remove();
            }
          }
          break;
      }
    },
    onFocusIn: function(type, node) {
      this.view.find('.menu').hide().first().show();
      if (node && node.nodeName === '#text' && this.state.selection.isCollapsed) {
        return true;
      }
      if (this.state.element && this.state.element.text().length > 0) {
        this.show();
      }
      return true;
    },
    onLoad: function(node, nodes) {
      var align;
      if (nodes.h1) {
        this.findViewById(this.R.h1).attr('selected', '');
      }
      if (nodes.h2) {
        this.findViewById(this.R.h2).attr('selected', '');
      }
      if (nodes.h3) {
        this.findViewById(this.R.h3).attr('selected', '');
      }
      if (nodes.b || nodes.strong) {
        this.findViewById(this.R.bold).attr('selected', '');
      }
      if (nodes.i || nodes.em) {
        this.findViewById(this.R.italic).attr('selected', '');
      }

      //align = jQuery(this.state.selection.selection.getRangeAt(0).commonAncestorContainer).css('text-align');
      if (align === 'center') {
        this.findViewById(this.R.alignCenter).attr('selected', '');
      } else if (align === 'left') {
        this.findViewById(this.R.alignLeft).attr('selected', '');
      }
      if (nodes.blockquote || nodes.q) {
        this.findViewById(this.R.quote).attr('selected', '');
      }
      if (nodes.a) {
        this.findViewById(this.R.link).attr('selected', '');
      }
      if (nodes.code) {
        this.findViewById(this.R.code).attr('selected', '');
      }
    },
    onEvent: function(cmd, event) {
      /* this == window */
      switch (cmd) {
        case '@cmd+b':
        case '@ctrl+b':
          event.preventDefault();
          document.execCommand('bold', false, null);
          return true;
        case '@cmd+i':
        case '@ctrl+i':
          event.preventDefault();
          document.execCommand('italic', false, null);
          return true;
        case '@shift+enter':
          event.preventDefault();
          document.execCommand('insertHTML', false, '<br>');
          return true;
        /* TODO */
        /*case '@enter':*/
        /*
         1. If cursor in line then insert newline.
         2. If at the end of line and there is an element after, then move to it.
         3. If last child, insert new paragraph.
         */
      }
      return false;
    },
    onDraw: function(where, cue) {
      var defaultPosition = this.editor.editor().position();
      if (!this.state.selection.isCollapsed) {
        return {
          top: Math.max(0, where.top - this.view.outerHeight() - 2 /* white space */),
          left: Math.max(defaultPosition.left, where.left + (this.state.selection.position.width - this.view.outerWidth()) / 2)
        };
      }
      cue = cue instanceof jQuery ? cue : jQuery(cue);
      var margin = {
        top: parseInt(cue.css("marginTop"), 10),
        left: parseInt(cue.css("marginLeft"), 10)
      };
      return {
        top: Math.max(0, where.top + margin.top - this.view.outerHeight() - 2 /* white space */),
        left: Math.max(defaultPosition.left, where.left + margin.left + (cue.outerWidth() - this.view.outerWidth()) / 2)
      };
    },
    callback: function(self) {
      var menus = self.view.find('.menu');

      menus.last().prepend(
        jQuery('<li>').append(jQuery('<input>').attr({type: 'text', placeholder: 'Paste or type a link'}))
      ).hide();
    }
  });
}(window.editor, window.jQuery, window, window.document));