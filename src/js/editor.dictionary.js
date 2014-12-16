/* -- text.extension --*/
(function(Editor, $, window, document, undefined) {
  Editor.extend({
    name: 'options-ext',
    structure: [],
    subscribe: ['#text'],
    onFocusIn: function(_, node) {
      if(this.state.selection.isCollapsed) {
        return;
      }
      var text = $(node).text();

    }

  });
}(window.editor, window.jQuery, window, window.document));