define([
    'backbone',
    'text!templates/list-software-item.html'
], function (Backbone, template) {
    return Backbone.View.extend({
        tagName: 'li',
        className: 'software-item input-group',
        template: _.template(template),
        events: {
            'change [key]': 'fieldChange',
            'click [role=delete]': 'deleteSelf'
        },

        //初始化
        initialize: function () {
            this.listenTo(this.model, 'destroy', this.remove)
        },

        //字段变更
        fieldChange: function (e, data) {
            var $el = $(e.target);
            this.model.set($el.attr('key'), $el.val())
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()))
            return this;
        },
        deleteSelf: function () {
            this.model.destroy();
        }

    })
})