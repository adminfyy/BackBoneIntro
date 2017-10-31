/**
 * Created by fuyy on 2017/4/26.
 */

define([
    "backbone",
    'jquery',
    "views/list-total-solution-item",
    "common"
], function (Backbone, $, TotalSolutionView, Common) {
    "use strict";

    return Backbone.View.extend({

        el: '.totalSolution',

        collections: new Backbone.Collection(),

        events: {
            "click .create-handle": "showCreator",
            "click [role='ac-save']": "createAC",
            "click [role='cancel']": "cancel"
        },

        initialize: function () {
            this.$createHandle = this.$(".create-handle");
            this.$creator = this.$(".creator");
            this.$acList = this.$(".ac-list");

            //默认隐藏
            this.$creator.hide();

            this.listenTo(this.collection, "add", this.addOne);
            this.listenTo(this.collection, "reset", this.addAll);

            this.addAll();
        },

        showCreator: function () {
            this.$creator.show();
            this.$createHandle.hide();
            return false;
        },

        //初始化遍历视图
        addAll: function () {
            this.$acList.empty();
            this.collection.each(this.addOne, this)
        },

        addOne: function (ac) {
            var acView = new TotalSolutionView({model: ac});
            this.$acList.append(acView.render().el)
        },

        createAC: function () {
            // switch (e.which) {
            //     case Common.ENTER_KEY:
            //     case Common.LEFT_DOWN:
            //         break;
            //     default:
            //         return false;
            // }

            if (!this.$('textarea').val().trim().length) {
                layer.msg("输入内容为空");
                this.$('textarea').focus();
                return false;
            }
            var newModel = {
                busId:"",
                linkName: this.$('.ts-text1').val(),
                linkUrl: this.$('.ts-text2').val(),
                linkType: "1"
                // is_check: 0
            };
            console.log(newModel)

            //reset textarea val
            this.$('textarea').val("");

            this.collection.push(newModel);
            return false;
        },

        cancel: function () {
            this.$creator.hide();
            this.$createHandle.show();
            return false;
        }

    })
});
