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
          if (!this.view.find("ul").is(":visible")) {
            this.open();
            return;
          }
          break;
        case this.R.image:
          this.addImagePlaceholder();
          break;
      }
      this.close();
    },
    addImagePlaceholder: function() {
      var img = $('<img>'),
        cont = $('<div>')
          .html('<div class="placeholder-overlay"></div>'),
        el = $('<div>').addClass("image-placeholder").html('<div class="main-container"><i class="fa fa-2x fa-camera"></i><br>Drag and drop your photos here <br>or<br><a href="#" data-id="add">Add photos manually</a></div>' +
        '<div class="sub-container"><div><a href="#" data-id="web-url">Web URL</a> <a href="#" data-id="prev">Previous Photos</a></div><div><a href="#" data-id="remove">Remove</a> <a href="#" data-id="done">Done</a><input style="display: none" type="file"></div></div>')
          .data(img),
        focus = $(this.base.getRootNode(this.base.state.focusNode)),
        self = this;

      focus.after(img);
      cont.append(el);
      this.base.elements.menuContainer.append(cont);
      this.base.saveSelection();

      el.css('position', 'absolute').css(img.position());
      el.on('click', 'a', function(e) {
        self.imageHandler(e, $(this).attr('data-id'), el, cont, img);
      });
    },
    imageHandler: function(event, node, el, cont, img) {
      switch (node) {
        case 'remove':
          img.remove();
          cont.remove();
          break;
        case 'add':
          cont.find('input[type=file]').click();
          break;
        case 'web-url':
          var self = this;
          el.find('.main-container').html('<i class="fa fa-2x fa-camera"></i><br><input type="url" placeholder="paste your link here and press Enter">')
            .find('input').focus().keypress(function(kpe) {
              if (kpe.which === 13) {
                cont.attr('data-src', $(this).val());
                self.imageHandler(kpe, 'done', el, cont, img);
              }
            });
          el.find('[data-id=web-url]').hide();
          el.find('[data-id=prev]').hide();
          break;
        case 'done':
          var src = cont.attr('data-src');
          if (!src) {
            src = el.find('input[type=url]').val();
          }
          this.base.restoreSelection();
          img.attr('src', src);
          cont.remove();
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