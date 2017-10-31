define([
    'backbone',
    'text!templates/e2e-list.html',
    'collections/e2e',
    'views/loading/loadingIndicator',
    'views/e2e-list-item'
], function (Backbone, e2eViewTemplate, Collection, LoadingView, itemView) {
    //端到端看板主要内容部分
    //列表展示部分
    return Backbone.View.extend({
        el: '.agile',
        model: new Backbone.Model({name: 'e2e列表模型'}),
        template: _.template(e2eViewTemplate),
        collection: Collection,
        events: {
            'click [role="expect-time"]': 'expectTimeToggleOrder',
            'click [role="create-time"]': 'createTimeToggleOrder',
            'change [role="page-size"]': 'pageSizeChange',
            'click [data-index]': 'goPage'
        },
        render: function () {
            this.$el.html(this.template(this.model.toJSON()))
        },

        initialize: function () {
            this.render();
            this.$tbody = this.$('tbody');
            this.listenTo(this.collection, 'reset', this.addAll);
            this.listenTo(this.collection, 'requesting', this.waitingForResp);
            this.listenTo(this.collection, 'change:total-count', this.totalCountChange);
            this.listenTo(this.collection, 'change:total-count', this.pageChange);
            this.listenTo(this.collection.pagination, 'change', this.pageChange);
            this.collection.queryModel.trigger('change');
            this.pageChange();
            this.totalCountChange();
        },

        addAll: function () {
            this.$tbody.empty();
            this.collection.each(this.addOne, this)
        },

        addOne: function (model) {
            new itemView({model: model}).render().$el.appendTo(this.$tbody)
        },

        //期望时间升降序切换
        expectTimeToggleOrder: function (e) {
            var currentOrder = this.collection.queryModel.get('orderType');
            if (currentOrder === 1) {
                this.collection.queryModel.set('orderType', 2);
                $(e.currentTarget).removeClass('reverse');
            } else {
                this.collection.queryModel.set('orderType', 1);
                $(e.currentTarget).addClass('reverse');
            }
        },

        //创建时间升序降序切换
        createTimeToggleOrder: function (e) {
            var currentOrder = this.collection.queryModel.get('orderType');
            if (currentOrder === 3) {
                this.collection.queryModel.set('orderType', 4);
                $(e.currentTarget).removeClass('reverse');
            } else {
                this.collection.queryModel.set('orderType', 3);
                $(e.currentTarget).addClass('reverse');
            }
        },

        //总数变更
        totalCountChange: function () {
            this.$('[role="total-count"]').text(this.collection.totalCount);
        },

        pageSizeChange: function (e) {
            this.collection.pagination.set('pageSize', e.target.value);
        },

        pageChange: function () {
            this.$('[role=pagination]').html(this.collection.getPaginationElements());
        },

        goPage: function (e) {
            var index = $(e.target).attr('data-index');
            if (index === 'next') this.collection.goNext();
            else if (index === 'previous') this.collection.goPrevious();
            else this.collection.goPage($(e.target).attr('data-index'));

            return false;
        },

        waitingForResp: function () {
            var tBody = this.$('tbody');

            tBody.append(new LoadingView().render().el);
            //fixbug:将加载点的宽度设置为可见窗口宽度，使其居中
            this.$('.loading-indicator').css('width',document.documentElement.clientWidth);
        }
    })
})