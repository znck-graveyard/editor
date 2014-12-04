/* -- text.extension --*/
(function(Editor, Extension, jQuery, window, document, undefined) {
  var id = Editor.extend(new Extension({
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
        }
      ],
      optionsMenu: {
        "text,,TEXT": function(selection) {
          window.alert('Viola adding new text');
        }
      },
      subscribe: ["@cmd+b", "@cmd+i", "@enter", "#text", "a", "code", "p", "b", "i", "strong", "em", "h1", "h2", "h3", "h4", "h5", "h6"],
      onClick: function(id, value) {
        /** @namespace this.R.h3 */
        /** @namespace this.R.h1 */
        /** @namespace this.R.h2 */
        /** @namespace this.R.bold */
        /** @namespace this.R.italic */
        console.log(id + " " + value);
        switch (id) {
          case this.R.h1:
            document.execCommand('formatBlock', false, value ? 'H1' : 'P');
            break;
          case this.R.h2:
            document.execCommand('formatBlock', false, value ? 'H2' : 'P');
            break;
          case this.R.h3:
            document.execCommand('formatBlock', false, value ? 'H3' : 'P');
            break;
          case this.R.bold:
            if (!document.execCommand('bold', false, null)) {
              document.execCommand('formatBlock', false, 'B');
            }
            break;
          case this.R.italic:
            if (!document.execCommand('italic', false, null)) {
              document.execCommand('formatBlock', false, 'I');
            }
            break;
        }
      },
      onFocusIn: function(type, node) {
        if (this.state.element && this.state.element.text().length > 0) {
          this.show();
        }
        return true;
      },
      onLoad: function(node, nodes) {
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
        return {top: where.top - this.view.height(), left: where.left};
      },
      callback: function(self) {
        self.view.find('.menu').addClass('default');
      }
    })
  );
}(window.editor, window.Editor.Extension, window.jQuery, window, window.document));