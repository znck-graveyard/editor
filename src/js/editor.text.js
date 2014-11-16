/* -- text.extension --*/
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