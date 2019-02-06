<?php

/**
 * @file
 * Contains \Drupal\tincanapi_sdk\Utilities.
 */

namespace Drupal\tincanapi_sdk\Utilities;


class Utilities {

  /**
   * Add a custom path and alias for a page. The SDK then uses the aliases array to resolve paths with their node path.
   *
   * @param string $path
   *   The alias path of the page, often the return value of request_path().
   * @param string $node_url
   *   The real node URL, often used in the q GET parameter.
   */
  function tincanapi_sdk_add_custom_alias($path, $node_url) {
    global $base_url;
    $variables = [];
    $variables = array($base_url . '/' . $path => $base_url . '/' . $node_url);
    return $variables;
  }


  /**
   * Adds a path to the trackable list.
   *
   * @param string $path
   *   The path to be tracked.
   */
  function tincanapi_sdk_add_trackable_path($path) {
    global $base_url;
    $variables = [];
    $variables = array($base_url . '/' . $path => 1);
    return $variables;
  }

  /**
   * Loads the SDK remotely. This is not used in the Drupal version but kept for debug purposes.
   *
   * @param string $tincan_endpoint
   *   The endpoint given as config variable.
   */
  function tincansdk_load_js_remotely($tincan_endpoint) {

    $tincan_base = '';
    if (filter_var($tincan_endpoint, FILTER_VALIDATE_URL)) {
      $parts = parse_url($tincan_endpoint);

      $scheme = isset($parts['scheme']) ? $parts['scheme'] . '://' : '';
      $host   = isset($parts['host']) ? $parts['host'] : '';
      $port   = isset($parts['port']) ? ':' . $parts['port'] : '';

      $tincan_base = "$scheme$host$port";
    }

    if (!trim($tincan_base)) {
      return;
    }
    return $tincan_base . '/packages/iminds/tincansdk/dist/tincansdk.js';

  }

  /**
   * Sets the javascript SDK config file.
   */
  function tincanapi_sdk_config() {
    global $base_url;
    $config = implode(
          '',
          [
            'window.tincanAsyncInit = function () {',
            'TINCAN.init({',
            'strict_endpoint: "' . $base_url . '/ajax/tincanapi/track_statement"',
            '});',

          // Provide a current timestamp.
            'TINCAN.setOption("timestamp", "' . date('Y-m-d\TH:i:s.uP') . '");',

          // Page should not be tracked, disable the initial statement.
            'TINCAN.disablePage();',
            'TINCAN.disableVideo();',

          // Enable or disable logging.
            'TINCAN.setOption("log", true);',
            'TINCAN.setOption("track_exits", true);',
            'TINCAN.setOption("actor", "hidden");',
            '};',
          ]
      );
    return $config;

  }

  /**
   * Loads the SDK locally.
   */
  function tincansdk_load_js_local($module_path) {
    return $module_path . '/js/tincansdk.js';
  }

}