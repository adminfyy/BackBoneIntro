/**
 * Created by fuyy on 2017/4/5.
 */
define([
        'backbone',
        'common',
        'text!templates/lane-item-dev.html',
        'views/modal-opt-product',
        'models/global'
    ],
    function (Backbone, Common, Template, ProductDetailViewOpt, Global) {

        return Backbone.View.extend({

            tagName: 'li',

            className: 'task-list-item',

            template: _.template(Template),

            events: {
                "click": "getModelDetail",
                "ReqlaneChange": "ReqlaneChange"
            },

            initialize: function (options) {
                this.columnId = options.columnId;
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.model, 'destroy', this.remove);
            },

            getModelDetail: function () {
                this.model.fetch({data: {id: this.model.id}})
                    .success(_.bind(this.viewDetail, this));
            },

            viewDetail: function () {
                Backbone.trigger('setModal', ProductDetailViewOpt(this.model))
            },

            ReqlaneChange: function (event, option) {
                var that = this;
                $.ajax({
                    url: rootPath + "/productReq/dragReq2Swimlane.shtml",
                    data: {
                        "productReqId": this.model.id,
                        "boardSwimlaneId": option.columnId
                    },
                    dataType: 'json'
                })
                    .success(function (res) {
                        var targetHeaderSelectorFormatter = ".list-header[column-id='{cid}']";
                        var reciver = targetHeaderSelectorFormatter.replace("{cid}", option.Receiver.attr('column-id'));
                        var sender = targetHeaderSelectorFormatter.replace("{cid}", option.Sender.attr('column-id'));
                        if (res['fail']) {
                            layer.msg(res['fail'] || '拖拽失败');
                            Backbone.$(reciver).trigger('refresh');
                            Backbone.$(sender).trigger('refresh');
                            option.Sender.sortable('cancel');
                            return
                        }
                        if (option.columnType == Common.LANE.VALIDATE && option.isReceiverDone) {
                            //更新燃尽图相关数据
                            Global.getBurnDownInfo();
                        }
                        if ((option.senderType == Common.LANE.DEMAND) || option.columnType == Common.LANE.DEMAND) {
                            Backbone.$(reciver).trigger('refresh');
                            Backbone.$(sender).trigger('refresh');
                        } else {
                            //将原来的model移动到现在的collection中
                            var model = that.model.collection.remove(that.model);
                            Backbone.$(reciver).trigger('addOneModel', model);
                        }
                    })
                    .fail(function () {
                        layer.msg('拖拽失败');
                        option.Sender.sortable('cancel');
                    });
            },

            render: function () {

                this.$el.html(this.template(this.model.toJSON()));

                var smBoardSwimLaneId = this.model.get('swimlaneId');
                var currentColumnId = this.columnId;
                var untouchableCondition = smBoardSwimLaneId != currentColumnId;
                if (untouchableCondition && typeof smBoardSwimLaneId !== 'undefined') this.$el.addClass("reqDarkColor");
                //for dom access
                this.$el.data("model", this.model);
                return this;
            }
        });

    });