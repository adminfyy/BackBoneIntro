define([
    "backbone",
    'models/global',
    'views/list-demand',
    'views/list-product',
    'views/list-sprint',
    'views/list-demand-pool'
], function (Backbone, Global, DemandView, ProductView, SprintView, DemandPoolView) {
    return Backbone.View.extend({

        className: 'stage-list',
        tagName: 'ul',
        model: Global,
        collection: new Backbone.Collection([{
            id: "product-list",
            name: "产品列表",
            sortableOpt: {
                items: ".task-list-item",
                placeholder: "task-list-item-placeholder",
                connectWith:'#sprint-list',
                forcePlaceholderSize: true
            },
            viewConstructor: ProductView
        }, {
            id: "sprint-list",
            name: "本次迭代",
            sortableOpt: "sprint",
            viewConstructor: SprintView
        }
        ]),

        render: function () {
            this.collection.each(this.addOne, this);
            return this;
        },

        addOne: function (model) {
            var viewConstructor = model.get('viewConstructor');
            var view = new viewConstructor({model: model});
            this.$el.append(view.el);
        }
    })
});