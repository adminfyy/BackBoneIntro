/* 团队管理看板
 * 团队列表容器View */
define([
    "backbone",
    "text!templates/team-item.html",
    'views/modal-opt-team',
    'models/global',
    'common'
], function (Backbone, template, modalOpt, Global, Common) {

    return Backbone.View.extend({

        tagName: 'a',

        className: 'list-group-item',

        template: _.template(template),

        events: {
            "click": 'viewDetail',
            "click .glyphicon-trash": 'destroyModel',
            "click .pendant": 'toAgilePage'
        },

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        viewDetail: function () {
            var model = this.model;
            this.model
                .fetch()
                .done(function () {
                    Backbone.trigger('setModal', modalOpt(model))
                })
        },

        destroyModel: function () {
            var that = this;
            layer.confirm("确定要删除团队" + this.model.get('teamName') + '?', function (index) {
                layer.close(index)
                that.model.destroy();
            })
            return false;
        },

        toAgilePage: function () {
            Global.set('team', this.model.id);
            Global.set('board', Common.DEV_BOARD);
            toAgilePage();
            return false;
        }
    })
})