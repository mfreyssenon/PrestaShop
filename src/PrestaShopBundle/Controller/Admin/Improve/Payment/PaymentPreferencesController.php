<?php
/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to https://devdocs.prestashop.com/ for more information.
 *
 * @author    PrestaShop SA and Contributors <contact@prestashop.com>
 * @copyright Since 2007 PrestaShop SA and Contributors
 * @license   https://opensource.org/licenses/OSL-3.0 Open Software License (OSL 3.0)
 */

namespace PrestaShopBundle\Controller\Admin\Improve\Payment;

use PrestaShop\PrestaShop\Core\Form\FormHandlerInterface;
use PrestaShop\PrestaShop\Core\Module\DataProvider\PaymentModuleListProviderInterface;
use PrestaShopBundle\Controller\Admin\PrestaShopAdminController;
use PrestaShopBundle\Security\Attribute\AdminSecurity;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class PaymentPreferencesController is responsible for "Improve > Payment > Preferences" page.
 */
class PaymentPreferencesController extends PrestaShopAdminController
{
    /**
     * Show payment preferences page.
     *
     * @param Request $request
     *
     * @return Response
     */
    #[AdminSecurity("is_granted('read', request.get('_legacy_controller'))", message: 'Access denied.')]
    public function indexAction(
        Request $request,
        #[Autowire(service: 'prestashop.admin.payment_preferences.form_handler')]
        FormHandlerInterface $paymentPreferencesFormHandler,
        #[Autowire(service: 'prestashop.adapter.module.payment_module_provider')]
        PaymentModuleListProviderInterface $paymentModulesListProvider
    ): Response {
        $legacyController = $request->attributes->get('_legacy_controller');

        $isSingleShopContext = $this->getShopContext()->getShopConstraint()->isSingleShopContext();

        $paymentPreferencesForm = null;
        $paymentModulesCount = 0;

        if ($isSingleShopContext) {
            $paymentModulesCount = count($paymentModulesListProvider->getPaymentModuleList());
            $paymentPreferencesForm = $paymentPreferencesFormHandler->getForm()->createView();
        }

        return $this->render('@PrestaShop/Admin/Improve/Payment/Preferences/payment_preferences.html.twig', [
            'enableSidebar' => true,
            'help_link' => $this->generateSidebarLink($legacyController),
            'paymentPreferencesForm' => $paymentPreferencesForm,
            'isSingleShopContext' => $isSingleShopContext,
            'paymentModulesCount' => $paymentModulesCount,
            'layoutTitle' => $this->trans('Preferences', [], 'Admin.Navigation.Menu'),
        ]);
    }

    /**
     * Process payment modules preferences form.
     *
     * @param Request $request
     *
     * @return RedirectResponse
     */
    #[AdminSecurity("is_granted('update', request.get('_legacy_controller')) && is_granted('create', request.get('_legacy_controller')) && is_granted('delete', request.get('_legacy_controller'))", message: 'Access denied.', redirectRoute: 'admin_payment_preferences')]
    public function processFormAction(
        Request $request,
        #[Autowire(service: 'prestashop.admin.payment_preferences.form_handler')]
        FormHandlerInterface $paymentPreferencesFormHandler
    ): RedirectResponse {
        $paymentPreferencesForm = $paymentPreferencesFormHandler->getForm();
        $paymentPreferencesForm->handleRequest($request);

        if ($paymentPreferencesForm->isSubmitted()) {
            $paymentPreferences = $paymentPreferencesForm->getData();

            $errors = $paymentPreferencesFormHandler->save($paymentPreferences);
            if (empty($errors)) {
                $this->addFlash('success', $this->trans('Successful update', [], 'Admin.Notifications.Success'));

                return $this->redirectToRoute('admin_payment_preferences');
            }

            $this->addFlashErrors($errors);
        }

        return $this->redirectToRoute('admin_payment_preferences');
    }
}
