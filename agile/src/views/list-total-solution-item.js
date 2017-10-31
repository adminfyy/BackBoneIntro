/**
 * Created by fuyy on 2017/4/26.
 */

define([
    "backbone",
    'jquery'
], function (Backbone, $) {

    return Backbone.View.extend({

        tagName: 'li',

        className: "ac-item",

        initialize: function () {
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function () {
            var $div = $('<div></div>');
            var $span1 = $('<a href='+this.model.get('linkUrl')+' target="_blank">'+'<span class="ts-span">'+this.model.get('linkName')+'</span>'+'</a>');
            var span = $("<span class='delete glyphicon glyphicon-remove'></span>");

            // span.text("X")
            span.on("click", _.bind(this.clear, this));

            $div.append($span1);

            this.$el.append($div);
            this.$el.append(span);


            return this;
        },

        // Remove the item, destroy the model from *localStorage* and delete its view.
        clear: function () {
            this.model.clear();
            this.model.destroy();
        }
    })
})
