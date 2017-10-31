/**
 * Created by fuyy on 2017/4/26.
 */

define([
    "backbone",
    'jquery'
], function(Backbone, $){
    "use strict";

    return Backbone.View.extend({

        tagName: 'li',

        className: "file-item",

        events: {},

        initialize: function () {
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function(){
            var $el = $("<a></a>");
                $el.attr("target","_blank");
                $el.text(this.model.get("fileName"));
                $el.attr("href", this.model.get("fileURL"));

            var span = $("<span class='delete pull-right glyphicon glyphicon-trash' title='删除附件'></span>");
                // span.text("X")
                span.on("click", _.bind(this.clear, this));

            this.$el.append($el);
            this.$el.append(span);

            return this;
        },

        // Remove the item, destroy the model from *localStorage* and delete its view.
        clear: function () {
            this.model.clear();
            this.model.destroy();
        }
    })
});
