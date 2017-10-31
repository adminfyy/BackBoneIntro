/*global define*/
define([
    'backbone',
    'common',
    'models/global',
    'collections/tag',
    'collections/team-member',
    'views/team-board-rm',
    'views/team-board-sm',
    'views/team-board-version',
    'views/team-board-current-sprint'
], function (Backbone, Common, Global, TagCollection, TeamMemberCollection, RMView, SMView, VersionView, CRView) {
    'use strict';

    return Backbone.View.extend({

        el: '.agile',

        model: Global,

        initialize: function () {
            this.listenTo(this.model, "change:board", _.debounce(this.boardChange, 100));
            TagCollection.refresh();
            TeamMemberCollection.refresh();
            Global.getSprintInfo();

            //当前迭代面板 header 适应横向滚动
            this.$el.scroll(function () {
                var $el = this.$('[role="header"]');
                if (!$el) return false;
                var top = this.$el.scrollTop();

                (top > 0) ?
                    $el.addClass('float-shadow') :
                    $el.removeClass('float-shadow');
                $el.css("top", top + 5);
                return false;

            }.bind(this));
            //fire
            this.render();
        },

        adjustPageHeight: function () {
            //固定页面高度
            var height = this.$el.parent().height() - this.$el.prev().height();
            this.$el.outerHeight(height);
        },

        render: function () {
            //固定页面高度
            this.adjustPageHeight();
            this.$innerView && this.$innerView.remove();
            var board = this.model.get("board");
            switch (Number(board)) {
                default:
                case 1:
                    this.$innerView = new RMView();
                    break;
                case 2:
                    this.$innerView = new CRView();
                    break;
                case 3:
                    this.$innerView = new VersionView();
                    break;
                case 4:
                    this.$innerView = new SMView();
                    break;
            }

            this.$el.html(this.$innerView.render().$el)
        },

        boardChange: function () {
            this.render();
        }
    });
});
