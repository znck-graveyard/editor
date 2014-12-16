/* -- text.extension --*/
(function(Editor, $, window, document, undefined) {
  var id = Editor.extend({
    name: 'image',
    structure: [
      {
        name: "headings",
        type: "select",
        buttons: ["medium,,Medium",
          "large,,Large", "small,,Small",
          "small-left,,Small Left",
          "full,,Full screen",
          "full-text,,Full screen with overlay text"],
        sep: true
      }
    ],
    subscribe: [
      "img"
    ],
    onClick: function(id, value) {

      var node;
      switch (id) {
        /* Format */
        case this.R.small:
          /* TODO test formatBlock compatibility http://www.quirksmode.org/dom/execCommand.html */
          document.execCommand('formatBlock', false, value ? 'H1' : 'P');
          break;
        case this.R.medium:
          document.execCommand('formatBlock', false, value ? 'H2' : 'P');
          break;
        case this.R.large:
          document.execCommand('formatBlock', false, value ? 'H3' : 'P');
          break;
        case this.R.smallLeft:
          document.execCommand('bold', false, null);
          break;
        case this.R.full:
          document.execCommand('italic', false, null);
          break;
        case this.R.fullText:
          document.execCommand('justifyleft', false, null);
          break;
      }
    },
    onFocusIn: function(type, node) {

      //if (this.state.nodes.img) {
        this.show();
      //}
      return true;
    },
    onLoad: function(node, nodes) {

    },
    onDraw: function(where) {
      return where;
    },
    callback: function(self) {

    }
  });
}(window.editor, window.jQuery, window, window.document));