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
        collection: new Backbone.Collection([ {
            id: "demand-pool",
            name: "需求池",
            // 宽版需求池
            sortableOpt: {
                items: "> .task-list-item:visible",
                placeholder: "task-list-item-placeholder",
                connectWith: "#product-list",
                dropOnEmpty: true,
                tolerance: 'pointer',
                forcePlaceholderSize : true
            },
            viewConstructor: DemandPoolView
        }, {
            id: "product-list",
            name: "产品列表",
            sortableOpt: {
                items: "> .task-list-item",
                placeholder: "task-list-item-placeholder",
                tolerance: 'pointer',
                connectWith: '#demand-pool',
                forcePlaceholderSize : true
            },
            viewConstructor: ProductView
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
    });
});