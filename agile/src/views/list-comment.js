/**
 * Created by fuyy on 2017/4/26.
 */

define([
    "backbone",
    "views/list-comment-item",
    "common"
], function(Backbone, ACView, Common){
    "use strict"

    return Backbone.View.extend({

        el: '.reqCommentList',
        collections: new Backbone.Collection(),
        events: {
            "click .create-handle" : "showCreator",
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
        addAll: function(){
            this.$acList.empty();
            this.collection.each(this.addOne, this)
        },

        addOne: function (ac) {
            var acView = new ACView({model: ac});
            this.$acList.append(acView.render().el);

            acView.$el.on("editComment", _.bind(this._editComment,this));
        },

        createAC: function (e) {
            switch (e.which){
                case Common.ENTER_KEY:
                case Common.LEFT_DOWN:
                    break;
                default:
                    return false;
            }

            if(!this.$('textarea').val().trim().length){
                layer.msg("输入内容为空");
                this.$('textarea').focus();
                return false;
            };

            var newModel = {
                content: this.$('textarea').val(),
                createTime: Date.now()
                // smReqId: $('[name="id"]').val()
            }


            var that = this;

            //编辑操作
            if(this.model && this.model.id){
                newModel.id = this.model.get('id');
                that.model.set("content", newModel.content);
                // $.ajax("/productReqComment/updateProductReqComment.shtml", { method: "post", data: JSON.stringify(newModel), dataType: "json", contentType: "application/json"}).done(function (data){ layer.msg("修改成功") }).fail(function () { layer.msg("修改失败") })

            } else {
                //新增操作
                //reset textarea val
                this.$('textarea').val("");
                newModel = new Backbone.Model(newModel)
                that.collection.push(newModel);

                // $.ajax("/productReqComment/insertProductReqComment.shtml", { method: "post", data:JSON.stringify(newModel), dataType:"json", contentType:"application/json" }) .done(function(data){ that.collection.push(data); layer.msg("保存成功"); }) .fail(function () { layer.msg("保存失败"); })
            }

            // this.collection.push(newModel);
            return false;
        },

        cancel: function(){
            this.$creator.hide();
            this.$createHandle.show();
            this._clear();
            return false;
        },

        _editComment: function(e, model){
            this.model = model;
            this.$creator.find(".ac-text").val(this.model.get("content"));
            this.showCreator();
        },

        _clear: function () {
            this.model = null;
        }

    })
})
