/**
 * Created by fuyy on 2017/4/26.
 */

define([
    "backbone",
    'jquery',
    "views/list-ac-item",
    "common"
], function (Backbone, $, ACView, Common) {
    "use strict";

    return Backbone.View.extend({

        el: '.acList',

        collections: new Backbone.Collection(),

        events: {
            "click .create-handle": "showCreator",
            "keyup .ac-text": "createAC",
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
            var acView = new ACView({model: ac});
            this.$acList.append(acView.render().el)
        },

        createAC: function (e) {
            switch (e.which) {
                case Common.ENTER_KEY:
                case Common.LEFT_DOWN:
                    break;
                default:
                    return false;
            }

            if (!this.$('textarea').val().trim().length) {
                layer.msg("输入内容为空");
                this.$('textarea').focus();
                return false;
            }
            var newModel = {
                name: this.$('textarea').val(),
                is_check: 0
            };

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
