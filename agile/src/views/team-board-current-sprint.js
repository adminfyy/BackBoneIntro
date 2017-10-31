define([
    "backbone",
    'collections/lane',
    'collections/sprint',
    'views/header',
    'views/loading/loadingIndicator',
    'models/global'
], function (Backbone, laneCollection, sprintCollection, HeaderView, LoadingView, Global) {
    return Backbone.View.extend({

        className: 'pool',

        // initialize
        initialize: function () {
            this.listenTo(Global, 'change:team', _.debounce(this.render, 200));
        },

        render: function () {
            var that = this;
            this.$el.html(new LoadingView().render().el);

            laneCollection
                .fetch({
                    reset: true,
                    data: {teamId: Global.get("team")}
                })
                .done(function () {
                    sprintCollection
                        .refresh()
                        .done(that.createSprintPanel.bind(that))
                });
            return this;
        },

        createSprintPanel: function () {
            this.$el.empty();
            //没有测试泳道隐藏测试选项
            var hasTestLane = laneCollection.hasTestLane() ? 'show' : 'hide';
            var $testLane = $('[role=elevator] li:nth-child(3n+2)')[ hasTestLane ]();

            sprintCollection.each(this.createRowElement, this);

            laneCollection.each(this.createColumnElement, this);
            //填充内容
            this.createHeader();
            laneCollection.each(this.createHeaderElement, this);
        },

        createHeader: function () {
            this.$header = $('<ul></ul>');
            this.$header.attr('role', 'header');
            this.$el.append(this.$header);
        },

        createHeaderElement: function (column) {
            this.$header.append(new HeaderView({model: column}).render().$el);
        },

        createRowElement: function (row) {
            var $el = Backbone.$('<ul></ul>');
            $el.attr('row-id', row.id);
            $el.appendTo(this.$el);
        },

        createColumnElement: function (column) {
            var $column = Backbone.$('<ul></ul>');
            $column.attr('column-id', column.id);
            $column.appendTo(Backbone.$('[row-id]'));
        }

    })

});