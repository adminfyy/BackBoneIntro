/**
 * Created by fuyy on 2017/5/15.
 */
define([
    "backbone"
], function (Backbone) {
    return Backbone.View.extend({

        events: {
            "click": "toggle"
        },

        initialize: function (options) {
            this.$el.popover(options)
        },

        toggle: function () {
            this.$el.popover("toggle");
            return false;
        },

        hide: function () {
            this.$el.popover('hide');
            return false;
        }
    })
});