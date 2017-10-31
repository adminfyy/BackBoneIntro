/**
 * Created by fuyy on 2017/4/19.
 */
define([
    "backbone"
], function(Backbone){
    return Backbone.View.extend({
        className: "loading-indicator",
        render: function () {
            this.$el.append($("<span class='loader-dot'></span>"));
            this.$el.append($("<span class='loader-dot'></span>"));
            this.$el.append($("<span class='loader-dot'></span>"));
            return this;
        }
    })
})