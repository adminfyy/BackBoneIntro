/**
 * Created by fuyy on 2017/4/26.
 */

define([
    "backbone",
    "views/list-attachment-item"
], function(Backbone, AttachmentView){

    return Backbone.View.extend({
        el: '.attachmentList',
        events: {},

        initialize: function () {
            var that = this;
            this.$list = this.$('.list');
            this.$file = this.$('#file');

            this.$file.fileupload({
                dataType: 'json',
                url: rootPath + "/uploadFile/fileUpload.shtml",
                done: _.bind(this.addOneAttachment, this),
                fail: function () {
                    layer.msg("上传失败")
                }
            });

            this.listenTo(this.collection, "reset", this.addAll);
            this.listenTo(this.collection, "add", this.addOne);

            this.addAll();
        },

        //collection 操作
        addOneAttachment: function (e,data) {
            this.collection.push(new Backbone.Model(data.result))
        },

        // dom 操作
        addAll: function(){
            this.$list.empty();
            this.collection.each(this.addOne, this);
        },

        addOne: function (model) {
            var acView = new AttachmentView({model: model});
            this.$list.append(acView.render().el)
        }
    })
});
