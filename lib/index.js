'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var Track = require('segmentio-facade').Track;
var Identify = require('segmentio-facade').Identify;


var LTK = module.exports = integration('Listrak Onescript')
  .global('ltk')
  .option('pixelId', '')
  .tag('<script src="https://cdn.listrakbi.com/scripts/script.js?m=WKnQVzU6XTxm&v=1>');


LTK.prototype.initialize = function() {
  window.ltk = function() {
    window.ltk.handleRequest
    ? window.ltk.handleRequest.apply(window.ltk, arguments)
    : window.ltk.queue.push(arguments);
  };
   
  window.ltk.queue = [];
  this.load(this.ready);
  var traits = this.analytics.user().traits() || {};
  var id = new Identify({ traits: traits });
  var email = id.email();

  if (email) {
    window.ltk('init', this.options.pixelId, { user_email: email });
  } else {
    window.ltk('init', this.options.pixelId);
  }
};

/**
 * Has the Snap Pixel library been loaded yet?
 *
 * @return {Boolean}
 */

LTK.prototype.loaded = function() {
  return !!(window.ltk && window.ltk.handleRequest);
};

/**
 * Trigger a page view.
 *
 * @param {Facade} identify
 */

LTK.prototype.page = function() {
  window.ltk('track', 'PAGE_VIEW');
};

/**
 * Track an event.
 * non-spec'd events get sent as "custom events" with full
 * tranformed payload
 *
 * @param {Facade} track
 */

LTK.prototype.track = function(track) {
  var event = track.event();
  var props = track.properties();
  console.log("track");
  window.ltk('trackCustom', event, properties);
};

/**
 * Product List Viewed.
 *
 * @api private
 * @param {Track} track category
 */

LTK.prototype.productListViewed = function(track) {
  var productIds = [];
  var products = track.products();
  
  console.log("product list viewed");

  window.ltk('track', 'VIEW_CONTENT', {
    item_ids: productIds
  });
};

/**
 * Product viewed.
 *
 * @api private
 * @param {Track} track
 */

LTK.prototype.productViewed = function(track) {
  
  console.log("product viewed");

  window.ltk('track', 'VIEW_CONTENT', {
    item_ids: [track.productId() || track.id() || track.sku() || ''],
    item_category: track.category() || '',
    currency: track.currency(),
    price: formatRevenue(track.price())
  });
};

/**
 * Product added.
 *
 * @api private
 * @param {Track} track
 */

LTK.prototype.productAdded = function(track) {
  
  console.log("add to cart");
  window.ltk('track', 'ADD_TO_CART', {
    item_ids: [track.productId() || track.id() || track.sku() || ''],
    item_category: track.category() || '',
    currency: track.currency(),
    price: formatRevenue(track.price())
  });
};

/**
 * Order Completed.
 *
 * @api private
 * @param {Track} track
 */

LTK.prototype.orderCompleted = function(track) {
  console.log("order submit");
  var itemIds = (track.products() || []).reduce(function(acc, product) {
    var item = new Track({ properties: product });
    var key = item.productId() || item.id() || item.sku();
    if (key) acc.push(key);
    return acc;
  }, []);

  var revenue = formatRevenue(track.revenue());

  window.ltk('track', 'PURCHASE', {
    transaction_id: (track.orderId() || '').toString(),
    currency: track.currency(),
    item_ids: itemIds,
    price: revenue
  });
};


/**
 * Get Revenue Formatted Correctly for Snap.
 *
 * @api private
 * @param {Track} track
 */

function formatRevenue(revenue) {
  return Number(revenue || 0).toFixed(2);
}