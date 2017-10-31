define([
    'backbone',
    'views/list-software-item'
], function (Backbone, itemView) {
    return Backbone.View.extend({
        el: '.software',
        events: {
            'click [role=add-software]': 'addSoftWare'
        },

        initialize: function () {
            this.listenTo(this.collection, 'add', this.addSoftWareView);
            this.$list = this.$('.software-list');
        },

        addSoftWare: function () {
            this.collection.add({
                name: null,
                ip: null,
                path: null,
                MD5: null
            })
        },

        addSoftWareView: function (model) {
            this.$list.append(new itemView({model: model}).render().$el)
        }
    })
})