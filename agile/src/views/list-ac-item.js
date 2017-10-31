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

        events: {
            "change input": "updateCheckValue"
        },

        initialize: function () {
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function () {
            var $div = $('<div></div>');
            var $input = $('<input type="checkbox" >');
            if(this.model.get("is_check") == 1 || this.model.get("isCheck") == 1){
                $input = $('<input type="checkbox" checked>');
            }
            var label = $('<label>' + this.model.get('name') + ' </label>');
            var span = $("<span class='delete glyphicon glyphicon-remove'></span>")

            // span.text("X")
            span.on("click", _.bind(this.clear, this))
            
            $div.append($input);
            $div.append(label)

            this.$el.append($div);
            this.$el.append(span);


            return this;
        },

        updateCheckValue: function () {
            var el = this.$('input'),
                val = el.prop("checked");
            this.model.set("is_check", Number(val));
            this.model.set("isCheck",Number(val));
        },

        // Remove the item, destroy the model from *localStorage* and delete its view.
        clear: function () {
            this.model.clear();
            this.model.destroy();
        }
    })
})
