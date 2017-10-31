/* 团队管理看板
 * 团队列表容器View */
define([
    "backbone",
    "collections/team",
    'views/list-team-item',
    'views/list-team-add'
], function (Backbone, collection, ItemView, addTeam) {

    return Backbone.View.extend({
        el: '.team .list-group',
        collection: collection,

        initialize: function () {
            this.listenTo(this.collection, 'reset', this.addAll);
            this.listenTo(this.collection, 'add', this.addOne);

            this.collection.fetch({
                reset: true
            });
        },

        addAll: function () {
            this.$el.empty();
            this.$el.append(new addTeam().render().el);

            this.collection.each(this.addOne, this)
        },

        addOne: function (model) {
            this.$el.append(new ItemView({ model: model}).render().el)
        }

    })
})