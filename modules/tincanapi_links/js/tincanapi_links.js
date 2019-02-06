(function ($) {

  function trackLinkAnchor($anchor, verb) {
    var statement = new TINCAN.Statement;

    statement.setVerb(verb);

    var id = $anchor.attr('href');
    if (isLinkRelative(id)) {
      var middle = (id.charAt(0) === '/') ? '' : '/';
      id = window.location.origin + middle + id;
    }

    var title = $anchor.attr('title');
    if (!title)
      title = nameFromAnchor($anchor);

    statement.setObject({
      url: id,
      name: title
    });

    statement.addParent(TINCAN.currentPage);

    statement.submit();
  }

  function isLinkRelative (href) {
    var regex = new RegExp('^(?:[a-z]+:)?//', 'i');
    return !regex.test(href);
  }

  function isLinkExternal (href) {
    if (isLinkRelative(href))
      return false;

    var regex = new RegExp('/' + window.location.host + '/');
    return !regex.test(href);
  }

  function isTrackable (type, href) {
    if (drupalSettings.tincanapi.links['trackable_' + type]) {
      if ($.inArray(href, drupalSettings.tincanapi.links['trackable_' + type]) >= 0) {
        return true;
      }
    }

    return false;
  }

  function nameFromAnchor ($anchor) {
    var str = $anchor.text();
    str = jQuery.trim(str);
    return str;
  }

  function tincanReady () {
    var callback = function () {
      if (!drupalSettings.tincanapi.links)
        return;

      if ($(this).hasClass('tincanapi-ignore') || $(this).hasClass('tincanapi-links-ignore'))
        return;

      var link = $(this),
          href = link.attr('href');

      if (isTrackable('links', href) || isLinkExternal(href))
        trackLinkAnchor(link, 'visited');
      else if (isTrackable('downloads', href))
        trackLinkAnchor(link, 'downloaded');
    };

    if ($.fn.on) {
      $(document).on('click', 'a', callback);
    } else {
      $('a').live('click', callback);
    }
  }

  $(document).ready(function () {
    if (!drupalSettings.tincanapi)
      return;

    $(document).bind('tincanReady', tincanReady);
  });

  if (!Drupal.tincanapi) {
    Drupal.tincanapi = {};
  }

  if (!Drupal.tincanapi.links) {
    Drupal.tincanapi.links = {};
  }

  Drupal.tincanapi.links.isLinkExternal = isLinkExternal;
  Drupal.tincanapi.links.isTrackable = isTrackable;

})(jQuery, Drupal, drupalSettings);
