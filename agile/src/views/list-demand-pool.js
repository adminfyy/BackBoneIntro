/**
 * Created by fuyy on 2017/3/31.
 */
define([
        'backbone',
        'collections/demand-pool',
        'jquery',
        'views/list-demand-pool-item',
        'views/list',
        'models/global',
        'collections/team-component'
    ],
    function (Backbone, Collection, $, ProductView, ListView, Global, TeamComponent) {

        return ListView.extend({

            collection: Collection,

            tools: [{
                name: 'refresh',
                label: '刷新'
            }, {
                name: "plus",
                label: "创建需求"
            }, {
                name: "sort",
                label: "排序"
            }],

            popover: [
                {
                    name: "priority-sort",
                    value: "优先级排序"
                }, {
                    name: "deadline-sort",
                    value: "截止时间排序"
                }
            ],


            initDataListening: function () {
                this.listenTo(this.collection, 'reset', _.debounce(this.addAll, 300));
                this.listenTo(this.collection, 'error', _.debounce(this.addAll, 300));
                this.listenTo(this.collection, 'add', _.debounce(this.addOne, 300));
                this.listenTo(this.collection, 'requesting', this.waitingForResp);
                this.listenTo(this.collection, 'all', this.updateCollectionCount);
                this.listenTo(Global, 'change', this.globalModelChange);
                this.listenTo(this.model, 'change', this.toggleVisible);
                this.listenTo(this.collection, 'change', this.modelChange);
                this.listenTo(Backbone, 'DEMAND-POOL-REFRESH', this.initData);
            },

            initData: function () {
                //默认通过
                this.collection.queryModel.clear();
                this.collection.queryModel.set('teamId', Global.get('team'));
                this.collection.queryModel.set("stateList", ['新建', '就绪', '已规划', '研发中', '验收', '完成', '发布', '升级']);
                // this.collection.trigger('reset');
                this.collection.query();
            },

            addOne: function (item, collection, options) {
                var $taskView = new ProductView({
                    model: item,
                    id: item.id,
                    attributes: {
                        "level": 0,
                        "data-id": item.id
                    }
                });
                if (options.at === 0) {
                    $taskView.render().$el.prependTo(this.$taskList);
                } else {
                    $taskView.render().$el.appendTo(this.$taskList);
                }
            },

            globalModelChange: function () {
                if (Global.hasChanged("team")) {
                    this.collection.queryModel.set('teamId', Global.get('team'));
                }
            },

            //触发创建新需求弹窗
            plus: function () {
                Backbone.trigger("create-demand");
            },

            isDroppable: function () {
                return true;
            },

            receiveSortable: function (event, ui) {
                var that = this;
                var model = ui.item.data('model');
                var isAllPlan = model.get('isAllPlan');
                if (isAllPlan === 1) {
                    layer.msg('已规划版本的需求不可拖入需求池');
                    ui.sender.sortable('cancel');
                    return;
                }

                var Id = model.get('id');
                var leafModels = [];
                Collection.forEach(function (m) {
                    leafModels.push(m.getLeafModels());
                });
                leafModels = _.flatten(leafModels);
                var demandPoolModel = leafModels.find(function (m) {
                    return m.id == Id;
                });
                if (demandPoolModel) {
                    ui.sender.sortable('cancel');
                    ui.item.addClass('changing');
                    demandPoolModel.gettingIntoDemandPool()
                        .success(function (res) {
                            if (res.hasOwnProperty('success') && !res.success) {
                                layer.msg(res.msg || "进入需求池失败");
                                return;
                            }
                            //需求拖拽回需求池后，就绪状态置为0
                            demandPoolModel.fetchBasicInfo();
                            model.set('id', null);
                            model.destroy();
                        })
                        .fail(function () {
                            layer.msg("进入需求池失败");
                        })
                        .always(function () {
                            ui.item.removeClass('changing');
                        });
                }
            },

            prioritySort: function () {
                this.collection.queryModel.set('orderType', 1);
            },

            deadlineSort: function () {
                this.collection.queryModel.set('orderType', 2);
            },
            //刷新
            refresh: function () {
                this.collection.queryModel.set('orderType', 0).trigger('change');
            },

            //拖拽操作
            updateSortable: function (e, ui) {
                var self = this;
                //阻止排序项移动到ConnectWith列表，触发排序方法；
                if (ui.item.parent().attr('id') !== self.model.id) return;

                if (ui.item.attr('child')) {
//                    layer.msg('只有一级需求可以排序');
                    this.$taskList.sortable('cancel');
                    return false;
                }
                this.preventMess(e, ui);
                ui.item.data('model').trigger('position-changed');
                Backbone
                    .ajax({
                        url: 'productReq/sortTeamProduct.shtml',
                        type: 'POST',
                        data: JSON.stringify(this.getSortableData()),
                        contentType: 'application/json',
                        dataType: 'json'
                    })
                    .success(function (res) {
                        if (res.success) {
                        } else {
                            layer.msg(res.msg);
                            self.$taskList.sortable('cancel');
                        }
                    })
                    .fail(function () {
                        self.$taskList.sortable('cancel');
                    });
            },

            //当一级卡片拖拽到二级卡片之中
            //默认将该卡片向下移动到下一个一级卡片之前；
            preventMess: function (e, ui) {
                if (ui.item.next().attr('child')) {
                    ui.item.insertAfter(ui.item.nextUntil(":not('[child]')").last());
                }
            },

            getSortableData: function () {
                var array = [];
                this.$taskList.find('[level=0]').each(function () {
                    array.push(Number(this.id));
                });
                return array;
            },

            modelChange: function (model) {
                //检查 子需求是否分配到了别的组件中
                if (model.hasChanged('comId') && !TeamComponent.get(model.get('comId')) && model.get('teamId') != Global.get('team')) {
                    //刷新列表
                    this.collection.query();
                }
            }

        });
    });