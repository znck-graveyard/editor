/* -- text.extension --*/
(function(Editor, $, window, undefined) {
  function Image() {
    this.view = Editor.createView([
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
    ]);
  }

  Image.prototype = {
    name: 'image',
    subscribe: ["img"],
    onClick: function(id, value) {
      switch (id) {
        /* Format */
        case this.R.small:
          break;
        case this.R.medium:
          break;
        case this.R.large:
          break;
        case this.R.smallLeft:
          break;
        case this.R.full:
          break;
        case this.R.fullText:
          break;
      }
    },
    focusIn: function() {
      var position = this.base.state.position;
      this.view.css({
        top: position.top - this.view.height() - 8,
        left: position.hcenter - this.view.width() / 2
      }).show();
    }
  };
}(window.editor, window.jQuery, window, window.document));