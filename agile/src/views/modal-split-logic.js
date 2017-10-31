/**
 * Created by fuyy on 2017/4/5.
 */
define([
        'backbone',
        'jquery',
        'text!templates/modal-split-demand.html',
        'common',
        'collections/task',
        'models/global',
        'models/demand-pool',
        'views/list-split-item',
        'simditor',
        'collections/tag',
        'collections/demand-pool'
    ],
    function (Backbone, $, ModalTemplate, Common, Tasks, Global, ModelConstructor, splitItemView, Simditor,
              TagCollection, Collection) {

        return defaults = {
            /**
             * interface 业务接口
             */
            template: function () {
            },
            initPlugins: function () {
            },
            renderData: function (model) {
            },
            /**
             * 校验页面的数据
             * @param data
             * @returns {boolean}
             */
            validate: function (data) {
                return true;
            },

            /**
             * 拆解完成
             */
            save: function () {
            },


            /**************拆分逻辑部分 **************/
            collection: new Collection.constructor(),

            url: {
                "save": 'productReq/saveSplitReq.shtml',
                'children': 'productReq/getSplitChildReqList.shtml'
            },

            events: {
                "click [role='save']": "save",
                "click [role=split]": 'split',
                "input [name=subject]": 'autoSave'
            },

            /**
             * 显示指定的子需求
             * @param currentModel
             */
            showItem: function (currentModel) {
                this.autoSave();
                if (!currentModel) return;
                this.currentModel = currentModel;
                var that = this;

                if (currentModel.isNew()) this.renderData(currentModel);
                if (!currentModel.isNew()) {
                    currentModel.fetch({data: {id: currentModel.id}}).done(function () {
                        that.renderData(currentModel);
                    });
                    layer.msg('此页面对已拆分的子需求任何操作, 将不保存');
                }
            },

            /**
             * 显示第一条子需求
             */
            showDefaultItem: function () {
                var firstModel = this.collection.at(0);
                this.showItem(firstModel);
                this.collection.invoke('trigger', "filterSelected", firstModel.cid);
            },


            /**
             * 添加一个子需求的View
             */
            addOne: function (item) {
                this.$splitList.append(new splitItemView({model: item, id: item.get("id")}).render().$el);
            },

            /**
             * 添加所有子需求的View，若没有子需求则新建一个
             */
            addAll: function () {
                this.$splitList.empty();
                this.collection.each(this.addOne, this);
                !this.collection.length ?
                    this.split() :
                    this.showDefaultItem();
            },

            /**
             * 关闭窗口之前的弹窗提示
             * @param thatCollection
             * @returns {boolean}
             */
            hideSplit: function (thatCollection) {
                var self = this;
                if (thatCollection.data.length == 0) {
                    this.hide();
                    return true;
                }

                layer.confirm("关闭将不保存拆解的任务，请确认是否关闭？", function (index) {
                    layer.close(index);
                    self.hide();
                });
                return false;
            },

            hide: function () {
                this.$el.off('hide.bs.modal');
                this.$el.modal("hide");
            },

            /**
             * 保存先前的操作，拆解出一个新的子需求,并且切换到这个页面
             */
            split: function () {
                this.autoSave();
                var newChildModel = this.model.clone().set('id', null);
                newChildModel.set('parentId', this.model.id);
                this.showItem(this.collection.add(newChildModel));
                this.collection.invoke("trigger", 'filterSelected', newChildModel.cid);
            },

            /**
             * 保存当前页面的数据到选中的Model中
             * @returns {boolean} 自动保存/ 若数据校验错误则返回false 保存成功返回true
             */
            autoSave: function () {
                console.warn('旧子需求，无法编辑内容');
                if (!this.currentModel) return false;

                if (!this.currentModel.isNew()) {
                    return false;
                }
                var data = this.getPageJson();
                if (!this.validate(data)) return false;
                if (this.currentModel.isNew()) this.currentModel.set(data);
                return true;
            }
        };
    });