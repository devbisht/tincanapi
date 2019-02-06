<?php

/**
 * @file
 * Contains \Drupal\tincanapi\Form\TincanapiAdminForm.
 */

namespace Drupal\tincanapi\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element;

class TincanapiAdminForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'tincanapi_admin_form';
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->config('tincanapi.settings');

    /*
    foreach (Element::children($form) as $variable) {
      $config->set($variable, $form_state->getValue($form[$variable]['#parents']));
    }*/
    foreach ($form_state->getValues() as $key => $value) {
      $config->set($key, $value);
    }
    $config->save();

    if (method_exists($this, '_submitForm')) {
      $this->_submitForm($form, $form_state);
    }

    parent::submitForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['tincanapi.settings'];
  }

  public function buildForm(array $form, \Drupal\Core\Form\FormStateInterface $form_state) {
    $config = $this->config('tincanapi.settings');
    $form['api'] = [
      '#type' => 'fieldset',
      '#title' => t('API Settings'),
    ];

    $form['api']['tincanapi_endpoint'] = [
      '#type' => 'textfield',
      '#title' => t('Endpoint'),
      '#description' => t('The server endpoint.  Do not include a trailing slash.'),
      '#default_value' => $config->get('tincanapi_endpoint'),
      '#required' => TRUE,
    ];

    $form['api']['tincanapi_auth_user'] = [
      '#type' => 'textfield',
      '#title' => t('User'),
      '#description' => t('The basic authenication user.'),
      '#default_value' => $config->get('tincanapi_auth_user'),
      '#required' => TRUE,
    ];

    $form['api']['tincanapi_auth_password'] = [
      '#type' => 'textfield',
      '#title' => t('Password'),
      '#description' => t('The basic authenication password.'),
      '#default_value' => $config->get('tincanapi_auth_password'),
      '#required' => TRUE,
    ];

    $form['api']['tincanapi_auth_basic'] = [
      '#type' => 'textfield',
      '#title' => t('Basic Auth (Encrypted)'),
      '#description' => t('If above username and password do not work, paste encrypted basic auth keys here (generate it from Learning locker client creation page).'),
      '#default_value' => $config->get('tincanapi_auth_basic'),
      '#required' => FALSE,
    ];

    $form['api']['tincanapi_anonymous'] = [
      '#type' => 'checkbox',
      '#title' => t('Track anonymous users.'),
      '#default_value' => $config->get('tincanapi_anonymous'),
    ];

    $form['api']['tincanapi_watchdog'] = [
      '#type' => 'checkbox',
      '#title' => t('Log server response.'),
      '#default_value' => $config->get('tincanapi_watchdog'),
    ];

    $form['api']['tincanapi_simplify_id'] = [
      '#type' => 'checkbox',
      '#title' => t('Simplify statements IDs (convert https urls to http)'),
      '#default_value' => $config->get('tincanapi_simplify_id'),
    ];

    if (\Drupal::moduleHandler()->moduleExists('token')) {
      $form['statements'] = [
        '#type' => 'fieldset',
        '#title' => t('Statement Settings'),
        '#collapsible' => TRUE,
        '#collapsed' => TRUE,
      ];

      $form['statements']['tincanapi_statement_actor'] = [
        '#type' => 'textfield',
        '#title' => t('Statement Actor'),
        '#description' => t('The token replacements for the actor name in a statement.'),
        '#default_value' => $config->get('tincanapi_statement_actor'),
      ];

      $form['statements']['token_help'] = [
        '#theme' => 'token_tree',
        '#token_types' => [
          'user'
          ],
      ];
    }

    return parent::buildForm($form, $form_state);
  }

}
?>
