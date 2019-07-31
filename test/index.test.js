/* eslint-disable no-restricted-globals */

'use strict';
var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Onescript = require('../lib/');
var assert = require('assert');

describe('Listrak', function() {
  var analytics;
  var onescript;
  var options = {
    apiKey: 'WEFUhplayajc'
  };
  onescript = new Onescript(options);
  var setupAnalytics = function() {
    analytics = new Analytics();
    onescript = new Onescript(options);
    analytics.use(Onescript);
    analytics.use(tester);
    analytics.add(onescript);
  };
  var tearDownAnalytics = function() {
    analytics.waitForScripts(function() {
      analytics.restore();
      analytics.reset();
      onescript.reset();
      sandbox();
      window.ltk = undefined;
      window._ltk = undefined;
      window._ltk_util = undefined;
    });
  };

  it('should have the right settings', function() {
    setupAnalytics();
    analytics.compare(Onescript, integration('Listrak')
      .option('apiKey', ''));
    tearDownAnalytics();
  });
  describe('before loading', function() {
    beforeEach(function() {
      setupAnalytics();
      analytics.stub(onescript, 'load');
    });
    describe('#initialize', function() {
      it('should create window._ltk', function() {
        analytics.assert(!window.ltk);
        analytics.initialize();
        analytics.called(onescript.load);
        analytics.assert(window.ltk);
        tearDownAnalytics();
      });
      it('should call #load', function() {
        analytics.stub(onescript, 'load');
        analytics.initialize();
        analytics.called(onescript.load);
        tearDownAnalytics();
      });
    });
  });
  describe('after loading', function() {
    before(function(done) {
      setupAnalytics();
      analytics.once('ready', done);
      analytics.initialize();
      window.analytics = analytics;
    });
    after(function() {
      tearDownAnalytics();
      window.analytics = undefined;
    });
    describe('before or without identified traits', function() {
      describe('#page', function() {
        beforeEach(function() {
          analytics.stub(onescript, 'addPageBrowse');
        });
        it('should call ltk.AddPageBrowse', function() {
          analytics.page();
          analytics.called(onescript.addPageBrowse);
        });
      });
      describe('#productViewed', function() {
        beforeEach(function() {
          analytics.stub(onescript, 'addProductBrowse');
        });
        it('should call ltk.AddProductBrowse', function() {
          analytics.track('Product Viewed', {});
          analytics.called(onescript.addProductBrowse);
        });
      });
      describe('getUserTraits', function() {
        it('should return {}', function() {
          assert.deepEqual({},onescript.getUserTraits());
        });
      });
      describe('#orderCompleted', function() {
        it('should not call _ltk.Order.Submit without an orderId', function() {
          analytics.stub(onescript, 'orderSubmit');
          analytics.track('Order Completed', {});
          analytics.didNotCall(onescript.orderSubmit);
        });
        it('should not call _ltk.Order.SetCustomer without user traits', function() {
          analytics.stub(onescript, 'orderSetCustomer');
          analytics.track('Order Completed', {});
          analytics.didNotCall(onescript.orderSetCustomer);
        });
        it('still should call _ltk.Order.Submit without user traits', function() {
          analytics.stub(onescript, 'orderSubmit');
          analytics.track('Order Completed', {
            checkout_id: 'fksdjfsdjfisjf9sdfjsd9f',
            order_id: '50314b8e9bcf000000000000',
            affiliation: 'Google Store',
            total: 27.50,
            revenue: 25.00,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'hasbros',
            currency: 'USD',
            products: [
              {
                product_id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games',
                url: 'https://www.example.com/product/path',
                image_url: 'https:///www.example.com/product/path.jpg'
              },
              {
                product_id: '505bd76785ebb509fc183733',
                sku: '46493-32',
                name: 'Uno Card Game',
                price: 3,
                quantity: 2,
                category: 'Games'
              }
            ]
          });
          analytics.called(onescript.orderSubmit);
        });
      });
    });
    describe('with identified traits', function() {
      before(function() {
        analytics.stub(onescript, 'scaSubmit');
        analytics.identify({
          userId:1,
          email: 'testuser@listrak.com',
          firstName: 'test',
          lastName: 'user'
        });
      });
      describe('getUserTraits', function() {
        it('should return traits', function() {
          assert.equal('testuser@listrak.com',onescript.getUserTraits().email);
          assert.equal('test',onescript.getUserTraits().firstName);
          assert.equal('user',onescript.getUserTraits().lastName);
        });
      });
      describe('#identify', function() {
        it('should call SetCustomer', function() {
          analytics.stub(onescript, 'scaSetCustomer');
          analytics.stub(onescript, 'scaSubmit');
          analytics.identify({
            userId:1,
            traits: {
              email: 'testuser@listrak.com',
              firstName: 'test',
              lastName: 'user'
            }
          });
          analytics.called(onescript.scaSetCustomer);
        });
        it('should call Submit', function() { 
          analytics.called(onescript.scaSubmit);
        });
      });
      describe('#orderCompleted', function() {
        it('should call _ltk.Order.SetCustomer with user traits', function() {
          analytics.stub(onescript, 'orderSetCustomer');
          analytics.track('Order Completed', {
            checkout_id: 'fksdjfsdjfisjf9sdfjsd9f',
            order_id: '50314b8e9bcf000000000000',
            affiliation: 'Google Store',
            total: 27.50,
            revenue: 25.00,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'hasbros',
            currency: 'USD',
            products: [
              {
                product_id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games',
                url: 'https://www.example.com/product/path',
                image_url: 'https:///www.example.com/product/path.jpg'
              },
              {
                product_id: '505bd76785ebb509fc183733',
                sku: '46493-32',
                name: 'Uno Card Game',
                price: 3,
                quantity: 2,
                category: 'Games'
              }
            ]
          });
          analytics.called(onescript.orderSetCustomer);
        });
        it('should call _ltk.Order.Submit with user traits', function() {
          analytics.stub(onescript, 'orderSubmit');
          analytics.track('Order Completed', {
            checkout_id: 'fksdjfsdjfisjf9sdfjsd9f',
            order_id: '50314b8e9bcf000000000000',
            affiliation: 'Google Store',
            total: 27.50,
            revenue: 25.00,
            shipping: 3,
            tax: 2,
            discount: 2.5,
            coupon: 'hasbros',
            currency: 'USD',
            products: [
              {
                product_id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games',
                url: 'https://www.example.com/product/path',
                image_url: 'https:///www.example.com/product/path.jpg'
              },
              {
                product_id: '505bd76785ebb509fc183733',
                sku: '46493-32',
                name: 'Uno Card Game',
                price: 3,
                quantity: 2,
                category: 'Games'
              }
            ]
          });
          analytics.called(onescript.orderSubmit);
        });
      });
      describe('#productAdded', function() {
        afterEach(function() {
          localStorage.ltkcart = {};
        });
        it('should call _ltk.SCA.SetCustomer with user traits', function() {
          analytics.stub(onescript, 'scaSetCustomer');
          analytics.track('Product Added', {});
          analytics.called(onescript.scaSetCustomer);
        });
        it('should call _ltk.SCA.Submit with user traits', function() {
          analytics.track('Product Added', {
            cart_id: 'skdjsidjsdkdj29j',
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 1,
            coupon: 'MAYDEALS',
            position: 3,
            url: 'https://www.example.com/product/path',
            image_url: 'https://www.example.com/product/path.jpg'
          });
          analytics.called(onescript.scaSubmit);
        });
      });
      describe('#productRemoved', function() {
        beforeEach(function() {
          localStorage.ltkcart = JSON.stringify({
            cart_id: 'skdjsidjsdkdj29j',
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 1,
            coupon: 'MAYDEALS',
            position: 3,
            url: 'https://www.example.com/product/path',
            image_url: 'https://www.example.com/product/path.jpg'
          });
        });
        afterEach(function() {
          localStorage.ltkcart = {};
        });
        it('should call _ltk.SCA.SetCustomer with user traits', function() {
          analytics.stub(onescript, 'scaSetCustomer');
          analytics.track('Product Removed', {});
          analytics.called(onescript.scaSetCustomer);
        });
        it('should call _ltk.SCA.Submit with user traits', function() {
          analytics.stub(onescript, 'scaSubmit');
          analytics.track('Product Removed', {
            cart_id: 'skdjsidjsdkdj29j',
            product_id: '507f1f77bcf86cd799439011',
            sku: 'G-32',
            category: 'Games',
            name: 'Monopoly: 3rd Edition',
            brand: 'Hasbro',
            variant: '200 pieces',
            price: 18.99,
            quantity: 1,
            coupon: 'MAYDEALS',
            position: 3,
            url: 'https://www.example.com/product/path',
            image_url: 'https://www.example.com/product/path.jpg'
          });
          analytics.called(onescript.scaSubmit);
        });
      });
    });
  });
});