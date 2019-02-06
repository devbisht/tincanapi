/**
 * @file
 * Handles creating statements using JS.
 */

(function ($) {

  Drupal.tincanapi = {
    track: function(data, callback) {
      if (!drupalSettings.tincanapi) {
        return;
      }

      data.token = drupalSettings.tincanapi.token;

      $.ajax({
        type: 'POST',
        url: drupalSettings.baseUrl + 'ajax/tincanapi/track',
        data: data,
        complete: callback
      });
    }
  };

  /**
   * When an ctools popup is displayed, the currentPage is adapted.
   * But when the ctools popup is close, the page still thinks it
   * is on that popup page. But following the opening and closing 
   * of the popups with a history stack, the proper currentPage
   * is restored.
   */

  var history = [];
  Drupal.behaviors.tincanapi = {
    attach: function (context, settings) {
      if (drupalSettings.tincanapi) {
        if (history.length == 0 || history[history.length - 1] != drupalSettings.tincanapi.currentPage) {
          history.push(drupalSettings.tincanapi.currentPage);
        }
      }
    }
  };

  $(document).bind("CToolsDetachBehaviors", function() {
    if (drupalSettings.tincanapi && history[history.length - 1] == drupalSettings.tincanapi.currentPage) {
      history.pop();
      drupalSettings.tincanapi.currentPage = history[history.length - 1];
    }
  });

  /**
   * Update the parent, when the currentPage changes because a new
   * l-page-container is loaded.
   */

  var loadCallback = function() {
    if (drupalSettings.tincanapi)  {
      history[0] = drupalSettings.tincanapi.currentPage;
    }
  };

  if ($.fn.on) {
    $(document).on('load', '.l-page-container', loadCallback);
  } else {
    $('.l-page-container').live('load', loadCallback);
  }

})(jQuery, Drupal, drupalSettings);
