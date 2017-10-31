/**
 * Created by fuyy on 2017/4/26.
 */

define([
    "backbone",
    "jquery"
], function(Backbone, $){

    return Backbone.View.extend({
        tagName: 'li',
        className: "comment-item",
        events: { },

        initialize: function () {
            this.listenTo(this.model, 'destroy', this.remove);
            this.listenTo(this.model, 'change', this.changeHandle);
        },

        changeHandle: function () {
            this.$('label').text(this.model.get("content"));
        },

        render: function(){
            var label = $('<label>' + this.model.get('content') + ' </label>');
            var span1 = $("<span class='pull-right'>" +  new Date(this.model.get("createTime")).format("yyyy-MM-dd hh:mm") + "</span>")
            var span2 = $("<span class='delete pull-right glyphicon glyphicon-remove'></span>")
            span2.on("click", _.bind(this.clear, this))

            this.$el.append(label);
            this.$el.append(span2);
            this.$el.append(span1);

            var that = this
            label.on("click",function(){
                that.$el.trigger("editComment", that.model)
            })

            return this;
        },

        // Remove the item, destroy the model from *localStorage* and delete its view.
        clear: function () {
            // var that = this; $.ajax({ method: "post", url: "/productReqComment/delProductReqComment.shtml", data: {reqCommentId: this.model.get("id")}}).done(function (){ that.model.clear(); that.model.destroy(); layer.msg("删除成功")
            // }).fail(function () { layer.msg("删除失败") })
            this.model.clear();
            this.model.destroy();
        }
    })
})
