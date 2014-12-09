/* -- text.extension --*/
(function(Editor, jQuery, window, document, undefined) {
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
    optionsMenu: {
      "image,image,IMAGE": function(selection) {
        window.alert('adding new image');
      },
      "video,youtube-play,VIDEO": function(selection) {
        window.alert('adding new image');
      },
      "embed,code,EMBED": function(selection) {
        window.alert('embed it');
      },
      "bg,image,BG IMAGE": function(selection) {
        window.alert('adding background image');
      },
      "quote,quote-right,QUOTE": function(selection) {
        window.alert('adding quote');
      },
      "line,minus,LINE": function(selection) {
        window.alert('insert a line');
      },
      "audio,volume-up,AUDIO": function(selection) {
        window.alert('adding some audio');
      },
      "gallery,gamepad,GALLERY": function(selection) {
        window.alert('an image gallery');
      },
      "map,map-marker,MAP": function(selection) {
        window.alert('posting a map');
      },
      "code,code,CODE": function(selection) {
        window.alert('put some code here');
      },
      ",anything,&nbsp;": function(){}
    },
    subscribe: [
      "img"
    ],
    onClick: function(id, value) {

      var node;
      switch (id) {
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
      //var menus = self.view.find('.menu');
      //menus.addClass('default');
      //// Add image selector window code
      //menus.last().prepend(
      //  jQuery('<li>').append(jQuery('<input>').attr({type: 'text', placeholder: 'Paste or type a link'}))
      //).hide();
    }
  });
}(window.editor, window.jQuery, window, window.document));