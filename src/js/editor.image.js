/*
(function($, window, document, E, undefined) {
  E.load(function() {
    var textMenu = E.menuElement.find('> .menu.data-image-menu');
    E.menuList.image = new Menu(textMenu, {
      move: function(position, w) {
        position.top -= textMenu.height() - 8;
        position.left += w / 2 - textMenu.width() / 2;
        return position;
      }
    });

    E.watch('IMG', function(event) {
      E.move(E.menuList.image, $(event.target));
      return true;
    });
  });
}(window.jQuery, window, window.document, window.Editor));*/
