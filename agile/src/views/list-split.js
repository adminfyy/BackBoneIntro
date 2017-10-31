/**
 * Created by miaoym on 2017年5月2日
 */
define([
        'backbone',
        'jquery',
        'views/list-split-item'
    ],
    function (Backbone, $, ChildSplitView) {

        var taskView = Backbone.View.extend({

            initialize: function () {
                //加入从后台刷新的数据添加进入ul
                this.listenTo(this.collection, "add", this.addOne);
                this.listenTo(this.collection, "reset", this.addAll);
            },

            addAll: function () {
                this.$el.empty();
                this.collection.each(this.addOne, this);
            },

            addOne: function (item) {
                var $taskView = new ChildSplitView({model: item, id: item.get("id")});
                this.$el.append($taskView.render().el);
            }
        });

        return taskView;
    });