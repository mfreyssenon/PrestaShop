// Import utils
import testContext from '@utils/testContext';

// Import commonTests
import loginCommon from '@commonTests/BO/loginBO';

// Import pages
// Import BO pages
import productSettingsPage from '@pages/BO/shopParameters/productSettings';
import addProductPage from '@pages/BO/catalog/products/add';
// Import FO pages
import {productPage} from '@pages/FO/classic/product';

import {expect} from 'chai';
import type {BrowserContext, Page} from 'playwright';
import {
  boDashboardPage,
  boProductsPage,
  FakerProduct,
  foClassicHomePage,
  foClassicSearchResultsPage,
  utilsPlaywright,
} from '@prestashop-core/ui-testing';

const baseContext: string = 'functional_BO_shopParameters_productSettings_productsStock_labelOutOfStock';

describe('BO - Shop Parameters - product Settings : Set label out-of-stock with  '
  + 'allowed/denied backorders', async () => {
  let browserContext: BrowserContext;
  let page: Page;

  const productData: FakerProduct = new FakerProduct({
    type: 'standard',
    quantity: 0,
    labelWhenOutOfStock: ' ',
    labelWhenInStock: ' ',
  });

  // before and after functions
  before(async function () {
    browserContext = await utilsPlaywright.createBrowserContext(this.browser);
    page = await utilsPlaywright.newTab(browserContext);
  });

  after(async () => {
    await utilsPlaywright.closeBrowserContext(browserContext);
  });

  describe('Set label out-of-stock with allowed/denied backorders', async () => {
    it('should login in BO', async function () {
      await loginCommon.loginBO(this, page);
    });

    it('should go to \'Catalog > Products\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToProductsPage', baseContext);

      await boDashboardPage.goToSubMenu(
        page,
        boDashboardPage.catalogParentLink,
        boDashboardPage.productsLink,
      );
      await boProductsPage.closeSfToolBar(page);

      const pageTitle = await boProductsPage.getPageTitle(page);
      expect(pageTitle).to.contains(boProductsPage.pageTitle);
    });

    it('should click on new product button and go to new product page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnNewProductPage', baseContext);

      const isModalVisible = await boProductsPage.clickOnNewProductButton(page);
      expect(isModalVisible).to.be.equal(true);

      await boProductsPage.selectProductType(page, productData.type);

      await boProductsPage.clickOnAddNewProduct(page);

      const pageTitle = await addProductPage.getPageTitle(page);
      expect(pageTitle).to.contains(addProductPage.pageTitle);
    });

    it('should create product', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'createProduct', baseContext);

      const createProductMessage = await addProductPage.setProduct(page, productData);
      expect(createProductMessage).to.equal(addProductPage.successfulUpdateMessage);
    });

    it('should go to \'Shop parameters > Product Settings\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToProductSettingsPage', baseContext);

      await addProductPage.goToSubMenu(
        page,
        addProductPage.shopParametersParentLink,
        addProductPage.productSettingsLink,
      );

      const pageTitle = await productSettingsPage.getPageTitle(page);
      expect(pageTitle).to.contains(productSettingsPage.pageTitle);
    });

    const tests = [
      {
        args: {
          action: 'enable',
          enable: true,
          backordersAction: 'allowed',
          label: 'You can order',
          labelToCheck: 'You can order',
        },
      },
      {
        args: {
          action: 'enable', enable: true, backordersAction: 'allowed', label: ' ', labelToCheck: '',
        },
      },
      {
        args: {
          action: 'disable', enable: false, backordersAction: 'denied', label: ' ', labelToCheck: '',
        },
      },
      {
        args: {
          action: 'disable',
          enable: false,
          backordersAction: 'denied',
          label: 'Out-of-Stock',
          labelToCheck: 'Out-of-Stock',
        },
      },
    ];

    tests.forEach((test, index: number) => {
      it(`should ${test.args.action} allow ordering of out-of-stock products`, async function () {
        await testContext.addContextItem(
          this,
          'testIdentifier',
          `${test.args.action}AllowOrderingOutOfStock${index}`,
          baseContext,
        );

        const result = await productSettingsPage.setAllowOrderingOutOfStockStatus(page, test.args.enable);
        expect(result).to.contains(productSettingsPage.successfulUpdateMessage);
      });

      it(`should set Label of out-of-stock products with ${test.args.backordersAction} backorders`, async function () {
        await testContext.addContextItem(
          this,
          'testIdentifier',
          `setLabelOutOfStock${index}`,
          baseContext,
        );

        let result;

        if (test.args.enable) {
          result = await productSettingsPage.setLabelOosAllowedBackorders(page, test.args.label);
        } else {
          result = await productSettingsPage.setLabelOosDeniedBackorders(page, test.args.label);
        }

        expect(result).to.contains(productSettingsPage.successfulUpdateMessage);
      });

      it('should view my shop', async function () {
        await testContext.addContextItem(
          this,
          'testIdentifier',
          `viewMyShop${test.args.action}${index}`,
          baseContext,
        );

        page = await productSettingsPage.viewMyShop(page);

        const isHomePage = await foClassicHomePage.isHomePage(page);
        expect(isHomePage, 'Home page was not opened').to.eq(true);
      });

      it('should search for the product and go to product page', async function () {
        await testContext.addContextItem(
          this,
          'testIdentifier',
          `goToProductPage${test.args.action}${index}`,
          baseContext,
        );

        // Search and go to product page
        await foClassicHomePage.searchProduct(page, productData.name);
        await foClassicSearchResultsPage.goToProductPage(page, 1);

        const pageTitle = await productPage.getPageTitle(page);
        expect(pageTitle).to.contains(productData.name);
      });

      it('should check label out-of-stock', async function () {
        await testContext.addContextItem(
          this,
          'testIdentifier',
          `checkOrderingOutOfStock${test.args.action}${index}`,
          baseContext,
        );

        // Check quantity and availability label
        const lastQuantityIsVisible = await productPage.isAddToCartButtonEnabled(page);
        expect(lastQuantityIsVisible).to.be.equal(test.args.enable);

        const availabilityLabel = await productPage.getProductAvailabilityLabel(page);
        expect(availabilityLabel).to.contains(test.args.labelToCheck);
      });

      it('should go back to BO', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goBackToBo${index}`, baseContext);

        page = await productPage.closePage(browserContext, page, 0);

        const pageTitle = await productSettingsPage.getPageTitle(page);
        expect(pageTitle).to.contains(productSettingsPage.pageTitle);
      });
    });

    it('should go to \'Catalog > Products\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToProductsPageToDeleteProduct', baseContext);

      await productSettingsPage.goToSubMenu(
        page,
        productSettingsPage.catalogParentLink,
        productSettingsPage.productsLink,
      );

      const pageTitle = await boProductsPage.getPageTitle(page);
      expect(pageTitle).to.contains(boProductsPage.pageTitle);
    });

    it('should click on delete product button', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnDeleteProduct', baseContext);

      const isModalVisible = await boProductsPage.clickOnDeleteProductButton(page);
      expect(isModalVisible).to.be.equal(true);
    });

    it('should delete product', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'deleteProduct', baseContext);

      const textMessage = await boProductsPage.clickOnConfirmDialogButton(page);
      expect(textMessage).to.equal(boProductsPage.successfulDeleteMessage);
    });

    it('should reset all filters', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetAllFilters', baseContext);

      await boProductsPage.resetFilter(page);

      const numberOfProducts = await boProductsPage.resetAndGetNumberOfLines(page);
      expect(numberOfProducts).to.be.above(0);
    });
  });
});
