/* eslint-disable max-params */
/* eslint-disable no-lonely-if */
/* eslint-disable no-undef */
/* eslint-disable new-cap */
/* eslint-disable no-restricted-globals */
'use strict';

/**
 * Module dependencies.
 */
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Listrak Onescript`.
 */
var LTKIntegration = module.exports = integration('Listrak')
  .global('_ltk')
  .global('_ltk_util')
  .option('apiKey', '')
  .tag('<script src="https://cdn.listrakbi.com/scripts/script.js?m={{apiKey}}&v=1">');

/**
 * Initialize Integration.
 *
 */
LTKIntegration.prototype.initialize = function() {
  var self = this;
  window.ltk = window._ltk || {};
  this.load(function() {
    window.ltk = window._ltk || {};
    self.createOnescriptCalls();
    self.ready();
  });
};

LTKIntegration.prototype.createOnescriptCalls = function() {
  this.scaSubmit = function() {
    window.ltk.SCA.Submit.call(window.ltk.SCA);
  };
  this.scaSetCustomer = function(email, firstname, lastname) {
    window.ltk.SCA.SetCustomer.call(window.ltk.SCA, email, firstname, lastname);
  };
  this.scaAddItem = function(sku, quantity, price, name, imgUrl, url) {
    window.ltk.SCA.AddItemWithLinks.call(window.ltk.SCA, sku, quantity, price, name, imgUrl, url);
  };
  this.scaClearCart = function() {
    window.ltk.SCA.ClearCart.call(window.ltk.SCA);
  };
  this.activitySubmit = function() {
    window.ltk.Activity.Submit.call(window.ltk.Activity);
  };
  this.addPageBrowse = function() {
    window.ltk.Activity.AddPageBrowse.call(window.ltk.Activity);
  };
  this.addProductBrowse = function(sku) {
    window.ltk.Activity.AddProductBrowse.call(window.ltk.Activity, sku);
  };
  this.orderAddItem = function(sku, quantity, price) {
    window.ltk.Order.AddItem.call(window.ltk.Order, sku, quantity, price);
  };
  this.orderSubmit = function() {
    window.ltk.Order.Submit.call(window.ltk.Order);
  };
  this.orderSetCustomer = function(email, firstname, lastname) {
    window.ltk.Order.SetCustomer.call(window.ltk.Order, email, firstname, lastname);
  };
  this.Order = window.ltk.Order;
};

/**
 * Has the library been loaded yet?
 *
 * @return {Boolean}
 */
LTKIntegration.prototype.loaded = function() {
  return !!window._ltk;
};

/**
 * Identify.
 *
 * @param {Identify} identify
 */
LTKIntegration.prototype.identify = function(identify) {
  if (identify.traits() !== undefined && identify.traits().email !== undefined) {
    this.scaSetCustomer(identify.traits().email);
    this.scaSubmit();
  }
};

/**
 * Trigger a page view.
 *
 * @param {object} page
 */
LTKIntegration.prototype.page = function(page) {
  this.addPageBrowse(page);
  this.activitySubmit();
};

/**
 * Product viewed.
 *
 * @param {Track} track
 */
LTKIntegration.prototype.productViewed = function(track) {
  this.addProductBrowse(track.properties().sku);
};

/**
 * Product added.
 *
 * @param {Track} track
 */
LTKIntegration.prototype.productAdded = function(track) {
  this.setScaCustomer();
  var cartItems = {};
  cartItems = this.addProduct(track); 
  this.submitCartData(cartItems);
};

/**
 * Product Removed
 *
 * @param {Track} track
 */
LTKIntegration.prototype.productRemoved = function(track) {
  this.setScaCustomer();
  var cartItems = {};
  cartItems = this.removeProduct(track); 
  this.submitCartData(cartItems);  
};

/**
 * Order Completed.
 *
 * @param {Track} track
 */
LTKIntegration.prototype.orderCompleted = function(track) {
  if (track.orderId() === '' || track.orderId() === undefined) {
    return;
  }
  var self=this;
  var traits = this.getUserTraits();
  if (traits.email !== undefined) {
    this.orderSetCustomer(traits.email, traits.firstName || '', traits.lastName || '');
  }
  this.Order.OrderNumber = track.orderId() || '';
  this.Order.ItemTotal = formatRevenue(track.revenue()) || '';
  this.Order.ShippingTotal = track.shipping() || '';
  this.Order.TaxTotal = track.tax() || '';
  this.Order.OrderTotal = track.total() || '';
  track.products().forEach(function(item) {
    self.orderAddItem(item.sku, item.quantity, formatRevenue(item.price));
  });
  this.orderSubmit();  
  localStorage.removeItem('ltkcart');  
};


/**
 * Get Revenue Reformat to Dollars and cents.
 *
 * @param {formatRevenue} revenue
 * @return {Number}
 */
function formatRevenue(revenue) {
  return Number(revenue || 0).toFixed(2);
}

/**
 * Get analytics.js user traits.
 *
 * @return {object}
 */
LTKIntegration.prototype.getUserTraits = function() {
  var traits = {};
  if (window.analytics.user().traits() !== {}) {
    traits = window.analytics.user().traits();
  }
  return traits;
};

/**
 * Retrieve cart items from custom cookie.
 *
 * @return {object}
 */
LTKIntegration.prototype.getCartItems = function() {
  var cartItems = {};
  if (localStorage.ltkcart !== undefined) {
    cartItems = JSON.parse(localStorage.ltkcart);
  }       
  return cartItems;
};

/**
 * Remove specific cart item from custom cookie.
 *
 * @param {Track} track
 * @return {object}
 */
LTKIntegration.prototype.removeProduct = function(track) {
  var cartItems = {};
  cartItems = this.getCartItems();
  var sku = track.sku()  || '';  
  var prodQty = track.quantity() || '';
  if (sku !== '') {
    if (sku in cartItems) {         
      if (cartItems[sku].qty > prodQty) {
        cartItems[sku].qty -= prodQty;
      } else {
        delete cartItems[sku];
      }
    }
  }
  localStorage.ltkcart = JSON.stringify(cartItems);  
  return cartItems;
};

/**
 * Remove specific cart item to custom cookie.
 *
 * @param {Track} track
 * @return {object}
 */
LTKIntegration.prototype.addProduct = function(track) {
  if (track.sku() === undefined) {
    return;
  }
  var cartItems = {};
  cartItems = this.getCartItems();
  
  var prodImgUrl = track.properties().image_url || '';
  var prodQty = track.quantity() || '';
  var prodUrl = track.properties().url || '';
  var prodName = track.name() || '';
  
  var sku = track.sku()  || '';  
  if (!(sku in cartItems)) {
    cartItems[sku] = {};
  }
  cartItems[sku].id = sku;
  if (cartItems[sku].qty === 0 || cartItems[sku].qty === undefined) {
    cartItems[sku].qty = prodQty;
  } else {
    cartItems[sku].qty += prodQty;
  }
  cartItems[sku].price = formatRevenue(track.price());
  cartItems[sku].name = prodName;
  cartItems[sku].url = prodUrl;
  cartItems[sku].imgurl = prodImgUrl;
  localStorage.ltkcart = JSON.stringify(cartItems);
  return cartItems;
};

/**
 * Sends all items in cart to listrak.
 * All items are needed every time a product is added or removed.
 * 
 * @param {object} cartItems
 */
LTKIntegration.prototype.submitCartData = function(cartItems) {  
  if (cartItems !== {}) {
    for (var key in cartItems) {
      if ({}.hasOwnProperty.call(cartItems, key)) {
        var data = cartItems[key];
        this.scaAddItem(key, data.qty, data.price, data.name, data.imgurl, data.url);    
      }
    }
    this.scaSubmit();
  } else {
    localStorage.removeItem('ltkcart');
    this.scaClearCart();
  }  
};

/**
 * Sends all items in cart to listrak.
 * All items are needed every time a product is added or removed.
 * 
 */
LTKIntegration.prototype.setScaCustomer = function() {
  var user = this.getUserTraits();
  var email = user.email || '';
  var firstName = user.firstName || '';
  var lastName = user.lastName || '';
  this.scaSetCustomer(email,firstName,lastName);
};