<?php

/**
 * @file
 * Contains \Drupal\tincanapi\Form\TincanapiAdminForm.
 */

namespace Drupal\tincanapi\Utilities;

use Drupal\Core\Logger\RfcLogLevel;

class Utilities {
  const TINCANAPI_CUSTOM_URI = 'http://orw.iminds.be/tincan';

  /**
   * Send the data collection to the LRS.
   *
   * @param array $data
   *   An associative array that conforms to the API specification.
   * @param array $context
   *   The tracking context.
   */
  function tincanapi_track_data(array $data, array $context = array()) {
    // Store original object.
    $context['object'] = $data['object'];
  
    if (!isset($data['actor'])) {
      $data['actor'] = $this->tincanapi_get_actor();
    
        // Actor is current user, make sure we need to track this particular user if anonymous.
        if (\Drupal::currentUser()->isAnonymous() && !\Drupal::config('tincanapi.settings')->get('tincanapi_anonymous')) {
          return;
        }
      }
      elseif (is_object($data['actor'])) {
        $data['actor'] = $this->tincanapi_get_actor($data['actor']);
      }
    
      if (!isset($context['node'])) {
        $url = $data['object']['id'];
    
        $path = $this->tincanapi_get_page_path($url);
        $parts = explode('/', $path);
    
        if (2 == count($parts) && 'node' == $parts[0]) {
          $context['node'] = \Drupal::entityManager()->getStorage('node')->load($parts[1]);
        }
      }
    
      $object = $this->tincanapi_get_object('unknown', $data['object']['id']);
      $data['object'] = $object + $data['object'];

      if (isset($data["context"]["contextActivities"]["parent"][0]["id"])) {
        $parent = $this->tincanapi_get_object('unknown', $data["context"]["contextActivities"]["parent"][0]["id"]);
        $data["context"]["contextActivities"]["parent"][0]["id"] = $parent['id'];
      }
    
      if (isset($data["context"]["contextActivities"]["grouping"][0]["id"])) {
        $grouping = $this->tincanapi_get_object('unknown', $data["context"]["contextActivities"]["grouping"][0]["id"]);
        $data["context"]["contextActivities"]["grouping"][0]["id"] = $grouping['id'];
      }
    
      $hook = 'tincanapi_data_alter';
      foreach (\Drupal::moduleHandler()->getImplementations($hook) as $module) {
        $function = $module . '_' . $hook;
        $function($data, $context);
      }

      $this->tincanapi_tincanapi_data_alter($data, $context);
    
      if (isset($context['ignore']) && $context['ignore']) {
        if (isset($context['sdk_action'])) {
          //echo json_encode($context['sdk_action']);
          return $context['sdk_action'];
        }
        //die();
      }
      
      return $this->tincanapi_send("statements", "POST", $data);
  }


  /**
   * Create an 'actor' for the LRS.
   *
   * @param mixed $account
   *   Optional. A Drupal user object or a user id.
   *
   * @return array
   *   An array representing an 'actor'.
   */
  function tincanapi_get_actor($account = NULL) {

    if (is_null($account)) {
      $user = \Drupal::currentUser();
      $account = \Drupal::entityManager()->getStorage('user')->load($user->id());
    }
    else {
      if (is_int($account)) {
        $account = \Drupal::entityManager()->getStorage('user')->load($account);
      }
    }

    $actor = array();
    if (\Drupal::moduleHandler()->moduleExists('token') && \Drupal::config('tincanapi.settings')->get('tincanapi_statement_actor') && \Drupal::currentUser()->isAuthenticated()) {
      $actor['name'] = \Drupal::token()->replace(\Drupal::config('tincanapi.settings')->get('tincanapi_statement_actor'), array('user' => $account), array('clear' => TRUE));

      if (empty($actor['name'])) {
          $actor['name'] = user_format_name($account);
        }
    }
    else {
      $actor['name'] = user_format_name($account);
    }

    if ($account->mail) {
      $actor['mbox'] = 'mailto:' . $account->getEmail();
    }
    elseif (!empty($actor['name'])) {
      $actor['mbox'] = 'mailto:' . $actor['name'] . '@no-email.' . $_SERVER['SERVER_NAME'];
    }
    else {
      $site_mail = \Drupal::config('system.site')->get('mail');
      $actor['mbox'] = 'mailto:' . $site_mail;
    }

    return $actor;
  }



  /**
   * Resolves a given url to the internal path with a formatted base.
   */
  function tincanapi_internal_path($url) {
    global $base_url;

    $formatted_base_url = str_replace(
      array(
        'http://www.',
        'https://www.',
        'https://',
        'https://',
      ), 'http://', $base_url
    );

    $url = str_replace(
      array(
        'http://www.',
        'https://www.',
        'https://',
        'https://',
      ), 'http://', $url
    );

    if (!preg_match("&^[^?#]{1,}\:\/\/&", $url)) {
      return $url;
    }
    elseif (substr($url, 0, strlen($formatted_base_url)) === $formatted_base_url) {
      return substr($url, strlen($formatted_base_url) + 1);
    }
    else {
      return FALSE;
    }
  }

  /**
   * Return a 'object' for the LRS.
   *
   * @param string $entity_type
   *   The type of entity provided.
   * @param object $entity
   *   A Drupal entity.
   *
   * @return array
   *   An array representing an 'object'.
   */
  function tincanapi_get_object($entity_type, $entity) {
    global $base_url;

    $object = array();

    switch ($entity_type) {
      case 'node':
        $content_type = node_type_load($entity->getType());
        $id = $entity->id();
        $name = $entity->label();
        $type_id = $entity->getType();
        $type_name = $content_type->label();

        $object['id'] = $base_url . '/' . $entity_type . '/' . $id;
        $object['definition']['name']['en-US'] = $type_name . ': ' . $name;

        $activity_types_collection = array(
          'http://adlnet.gov/expapi/activities/' => array('assessment', 'attempt', 'course', 'file', 'interaction', 'lesson', 'link', 'media', 'meeting', 'module', 'objective', 'performance', 'profile', 'question', 'simulation'),
          'http://id.tincanapi.com/activitytype/' => array('blog', 'book', 'chat-channel', 'chat-message', 'checklist', 'checklist-item', 'code-commit', 'conference', 'conference-session', 'conference-track', 'discussion', 'email', 'essay', 'legacy-learning-standard', 'lms', 'paragraph', 'recipe', 'research-report', 'sales-opportunity', 'scenario', 'school-assignment', 'security-role', 'slide', 'slide-deck', 'source', 'tag', 'test-data-batch', 'tutor-session', 'tweet', 'unit-test', 'unit-test-suite', 'voicemail', 'webinar'),
        );

        foreach ($activity_types_collection as $url => $activity_types) {
          if (in_array($type_id, $activity_types)) {
            $object['definition']['type'] = $url . $type_id;
            break;
          }
        }

        if (!isset($object['definition']['type'])) {
          $object['definition']['type'] = self::TINCANAPI_CUSTOM_URI . '/content/type/' . $type_id;
        }
        break;

      case 'unknown':
        // Internal url.
        $internal_path = $this->tincanapi_internal_path($entity);
        if ($internal_path) {
          $int_path = \Drupal::service('path.alias_manager')->getPathByAlias($internal_path);
          $path = explode('/', $int_path);
          if ($path[0] == 'node') {
            return $this->tincanapi_get_object('node', \Drupal::entityManager()->getStorage('node')->load($path[1]));
          }
          else {
            $object['id'] = $base_url . '/' . $int_path;
          }
        }
        // External url.
        else {
          $object['id'] = $entity;
        }
        break;
    }
    if (\Drupal::config('tincanapi.settings')->get('tincanapi_simplify_id') && $this->tincanapi_internal_path($object['id'])) {
      $object['id'] = str_replace(
        array(
          'http://www.',
          'https://www.',
          'https://',
          'https://',
        ), 'http://', $object['id']
      );
    }

    return $object;
  }

  /**
   * Return a 'verb' array.
   *
   * @param string $id
   *   The id of the verb.
   * @param string $display
   *   Optional. The display name of the verb.
   *
   * @return array
   *   A 'verb' array.
   */
  function tincanapi_get_verb($id, $display = NULL) {

    if (is_null($display)) {
      $display = $id;
    }

    $verb = array();

    $verb['display']['en-US'] = $display;

    $verbs_collection = array(
      'https://w3id.org/xapi/adl/verbs/' => array('abandoned', 'logged-in', 'logged-out', 'satisfied', 'waived'),
      'http://id.tincanapi.com/verb/' => array('adjourned', 'bookmarked', 'called', 'closed-sale', 'created-opportunity', 'focused', 'hired', 'interviewed', 'mentored', 'paused', 'previewed', 'rated', 'replied-to-tweet', 'requested-attention', 'retweeted', 'reviewed', 'skipped', 'tweeted', 'unfocused', 'unregistered', 'viewed', 'voted-down', 'voted-up'),
      'https://brindlewaye.com/xAPITerms/verbs/' => array('added', 'removed', 'ran', 'walked'),
      'http://specification.openbadges.org/xapi/verbs/' => array('earned'),
      'http://future-learning.info/xAPI/verb/' => array('released', 'pressed'),
    );

    foreach ($verbs_collection as $url => $verbs) {
      if (in_array($id, $verbs)) {
        $verb['id'] = $url . $id;
        break;
      }
    }

    if (!isset($verb['id'])) {
      $verb['id'] = 'http://adlnet.gov/expapi/verbs/' . $id;
    }

    return $verb;
  }

  /**
   * Create an array with the key value and language.
   *
   * @param string $key
   *   The key for the value.
   * @param string $value
   *   The value for the object.
   * @param string $language
   *   Optional. The language.
   *
   * @return array
   *   An array with the value nested in the key and lanuage.
   */
  function tincanapi_get_language_value($key, $value, $language = 'en-US') {

    return array(
      $key => array(
        $language => $value,
      ),
    );
  }

  /**
   * Add a language based value to an existing array.
   *
   * @param array $data
   *   The data array to add the value.
   * @param string $key
   *   The key for the value.
   * @param string $value
   *   The value for the object.
   * @param string $language
   *   Optional. The language.
   */
  function tincanapi_add_language_value(array &$data, $key, $value, $language = 'en-US') {

    $data[$key] = array(
      $language => $value,
    );
  }

  /**
   * Get the page path for an absolute URL.
   *
   * @param string $url
   *   An absolute url.
   *
   * @return string
   *   The page path.
   */
  function tincanapi_get_page_path($url) {

    $url = parse_url($url);

    if (!isset($url['path'])) {
      return '';
    }

    $path = substr($url['path'], strlen(base_path()));
    return $path;
    $source = \Drupal::service('path.alias_manager')->getAliasByPath($path);
    //if ($source = drupal_lookup_path('source', $path)) {
    if ($source) {
      return $source;
    }

    return $path;
  }



  /**
   * Implements hook_data_alter().
   */
  function tincanapi_tincanapi_data_alter(&$data, &$context) {

    global $base_url;

    // Check if a parent is set from the SDK, if so, we strip the ID.
    if (isset($data['context']['contextActivities']['parent'][0]['id'])) {
      $temp_parent = $data['context']['contextActivities']['parent'][0]['id'];
      $parts = parse_url($temp_parent);
      if (isset($parts['path'])) {
        $potential_node_ids = explode('/', $parts['path']);
        if (count($potential_node_ids) === 3) {
          $potential_node_id = $potential_node_ids[2];
          $parent_node = \Drupal::entityManager()->getStorage('node')->load($potential_node_id);

          if (isset($data['object']['id'])) {
            if ($parent_node && $data['object']['id'] !== $potential_node_id) {
              $context['parent'] = $parent_node;
            }
          }
        }
      }
    }
  }

  /**
   * Send function.
   */
  function tincanapi_send($action, $method, $data) {
    
    $end_point = \Drupal::config('tincanapi.settings')->get('tincanapi_endpoint');
    $basic_auth_user = \Drupal::config('tincanapi.settings')->get('tincanapi_auth_user');
    $basic_auth_pass = \Drupal::config('tincanapi.settings')->get('tincanapi_auth_password');

    // get basic auth
    $basic_auth = \Drupal::config('tincanapi.settings')->get('tincanapi_auth_basic');

    // Sanitize endpoint.
    $end_point = trim($end_point);
    if (substr($end_point, -1) == "/") {
      $end_point = substr($end_point, 0, -1);
    }

    // Sanitize action.
    $action = trim($action);
    if (substr($end_point, 0, 1) == "/") {
      $action = substr($end_point, 1);
    }
    
    if ($method == "GET" || $method == "DELETE") {
      $action .= "?" . http_build_query($data, '', '&');
    }

    // Init call.
    $url = $end_point . '/' . $action;

    $headers = array(
      'Content-Type: application/json',
      'X-Experience-API-Version: 1.0.3',
      'Authorization: Basic ' . $basic_auth,
    );

    // Differentiate for different methods.
    $ch = curl_init($url);
    if ($method == "POST") {
      $json = json_encode($data);
      curl_setopt($ch, CURLOPT_POST, TRUE);
      curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
      $headers[] = 'Content-Length: ' . strlen($json);
    }
    elseif ($method == "PUT") {
      $json = json_encode($data);
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
      curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
      $headers[] = 'Content-Length: ' . strlen($json);
    }
    elseif ($method == "DELETE") {
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
    }

    // Doing call.
    curl_setopt($ch, CURLOPT_USERPWD, $basic_auth_user . ':' . $basic_auth_pass);
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0); // ignore ssl warning
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 0);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $response = curl_exec($ch);
  
    // Check for connection errors.
    if ($response === FALSE || $response === NULL) {
      \Drupal::logger('tincanapi')->debug(curl_error($ch), array());
      return $response;
    }

    $response = json_decode($response, TRUE);
    $error = isset($response["error"]) && $response["error"];

    // Logging.
    if (\Drupal::config('tincanapi.settings')->get('tincanapi_watchdog') || $error) {
      $debug = array(
        "request" => array(
          "url" => $url,
          "post" => $data,
        ),
        "response" => array(
          "txt" => $response,
        ),
      );

      $severity = $error ? RfcLogLevel::ERROR : RfcLogLevel::DEBUG;
      \Drupal::logger('tincanapi')->notice(json_encode($debug), array());
    }
   
    return $response;
  }

  /**
   * Get ISO 8601 duration from a timestamp.
   *
   * @param int $timestamp
   *   A timestamp.
   *
   * @return string
   *   The ISO 8601 duration.
   */
  function tincanapi_format_iso8601_duration($timestamp) {

    $units = array(
      'Y' => 365 * 24 * 3600,
      'D' => 24 * 3600,
      'H' => 3600,
      'M' => 60,
      'S' => 1,
    );

    $output = 'P';
    $time = FALSE;

    foreach ($units as $name => &$unit) {
      $value = intval($timestamp / $unit);
      $timestamp -= $value * $unit;
      $unit = $value;

      if ($unit > 0) {
        if (!$time && in_array($name, array('H', 'M', 'S'))) {
          $output .= "T";
          $time = TRUE;
        }

        $output .= strval($unit) . $name;
      }
    }

    if ('P' == $output) {
      $output .= 'T0S';
    }

    return $output;
  }

}