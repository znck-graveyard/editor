/* -- text.extension --*/
(function(Editor, $, window, undefined) {

  function Options() {
    this.view = Editor.createView([{
      buttons: [
        "text,paragraph,TEXT",
        "image,image,IMAGE",
        "video,youtube-play,VIDEO",
        "embed,code,EMBED",
        "bg,image,BG IMAGE",
        "quote,quote-right,QUOTE",
        "line,minus,LINE",
        "audio,volume-up,AUDIO",
        "gallery,gamepad,GALLERY",
        "map,map-marker,MAP",
        "code,code,CODE",
        "temp,anything,&nbsp;"
      ]
    }]);
    this.view.prepend($('<div>').addClass("toggle").html('<a class="button icon" href="#" data-button-id="toggle">×</a>'));
  }

  Options.prototype = {
    name: "options",
    subscribe: ["*"],
    open: function() {
      var height = this.view.find('li').length * 30;
      this.view.find('.menu').css({
        height: 3,
        width: 0
      }).show()
        .animate({width: 292}, {duration: 200, queue: true})
        .animate({height: height}, {duration: 200, queue: true});
    },
    close: function() {
      var menu = this.view.find('.menu');
      menu
        .animate({height: 3}, {duration: 200, queue: true})
        .animate({width: 0}, {
          duration: 200, queue: true, complete: function() {
            menu.hide();
          }
        });
    },
    onClick: function(id, value) {
      switch (id) {
        case this.R.toggle:
          if (this.view.find("ul").is(":visible")) {
            this.close();
          } else {
            this.open();
          }
          break;
      }
    },
    focusIn: function() {
      var cue = $(Editor.getRootNode(this.base.state.focusNode));
      if (cue) {
        this.view.css({
          top: Math.max(0, cue.position().top + 8),
          left: Math.max(-8, cue.position().left - this.width - 32)
        });
      }
    },
    init: function() {
      var position = this.base.elements.editable.find(":last-child").position();
      this.view.find("ul").removeClass("default").addClass("options-menu").hide();
      this.height = this.view.find(".toggle").height() | 32;
      this.width = this.view.find(".toggle").width() | 32;
      this.view.css({
        top: Math.max(0, position.top),
        left: Math.max(-8, position.left - this.width - 32)
      });
      this.view.show();
    }
  };

  Editor.install(new Options());
}(window.Editor, window.jQuery, window));