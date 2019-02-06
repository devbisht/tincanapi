<?php /**
 * @file
 * Contains \Drupal\tincanapi_sdk\Controller\DefaultController.
 */

namespace Drupal\tincanapi_sdk\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\tincanapi\Utilities\Utilities;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Default controller for the tincanapi_sdk module.
 */
class DefaultController extends ControllerBase {

  public function tincanapi_sdk_ajax_callback() {

    $data = @json_decode(@file_get_contents("php://input"), TRUE);
    if (!is_array($data)) {
      return new JsonResponse([]);
    }

    $context = [];
    $context['is_ajax'] = 1;

    $utils = new Utilities();
    $output = $utils->tincanapi_track_data($data, $context);
    return new JsonResponse($output);
  }

}
