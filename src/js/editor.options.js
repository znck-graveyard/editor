/* -- text.extension --*/
(function(Editor, $, window, document, undefined) {
  var self = Editor.extend({
    name: 'options-ext',
    structure: [],
    optionsMenu: {
      "text,paragraph,TEXT": function(selection) {
        if (selection.node) {
          var element = Editor.topNode(selection.node);

        }
      },
      "image,image,IMAGE": function(selection) {
        console.log(selection);
        if (selection.node) {
          var element = Editor.topNode(selection.node);
          self.show();
        }
      },
      "video,youtube-play,VIDEO": function(selection) {
        if (selection.node) {
          var element = Editor.topNode(selection.node);

        }
      },
      "embed,code,EMBED": function(selection) {
        if (selection.node) {
          var element = Editor.topNode(selection.node);

        }
      },
      "bg,image,BG IMAGE": function(selection) {
        if (selection.node) {
          var element = Editor.topNode(selection.node);

        }
      },
      "quote,quote-right,QUOTE": function(selection) {
        if (selection.node) {
          var element = Editor.topNode(selection.node);

        }
      },
      "line,minus,LINE": function(selection) {
        if (selection.node) {
          var element = Editor.topNode(selection.node);

        }
      },
      "audio,volume-up,AUDIO": function(selection) {
        if (selection.node) {
          var element = Editor.topNode(selection.node);

        }
      },
      "gallery,gamepad,GALLERY": function(selection) {
        if (selection.node) {
          var element = Editor.topNode(selection.node);

        }
      },
      "map,map-marker,MAP": function(selection) {
        if (selection.node) {
          var element = Editor.topNode(selection.node);

        }
      },
      "code,code,CODE": function(selection) {
        if (selection.node) {
          var element = Editor.topNode(selection.node);

        }
      },
      "temp,anything,&nbsp;": function() {
      }
    },
    subscribe: [],
    onDraw: function() {
      return {top: 0, left: 0};
    },
    callback: function(self) {
      self.view.append($('<div>').addClass("placeholders").html('<div class="image-placeholder"><div class="main-container"><p><i class="fa fa-2x fa-camera"></i></p> <p>Drag and drop your photos here<br>or<br>Add photos manually</p></div><div class="sub-container"><div style="float: left;"><a href="#" data-button-id="url">Web URL</a><a href="#" data-button-id="prev">Previous Photos</a></div><div style="float: right;"><a href="#" data-button-id="remove">Remove</a><a href="#" data-button-id="done">Done</a></div></div></div><div class="image-placeholder"><div class="main-container"><p><i class="fa fa-2x fa-camera"></i></p><p><input type="url" placeholder="paste your link here and press enter"><br><br><br></p></div><div class="sub-container"><div style="float: right;"><a href="#" data-button-id="remove">Remove</a><a href="#" data-button-id="done">Done</a></div></div></div>'));
    }

  });
}(window.editor, window.jQuery, window, window.document));