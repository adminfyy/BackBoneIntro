/**
 * Created by fuyy on 2017/3/31.
 */
define([
        'backbone',
        'collections/product',
        'jquery',
        'views/list-product-item',
        'views/list',
        'models/global',
        'common',
        'models/product'
    ],
    function (Backbone, Product, $, ProductView, stageView, Global, Common) {

        return stageView.extend({

            collection: Product,

            tools: [{
                name: "refresh",
                label: "刷新"
            }],

            initDataListening: function () {
                this.listenTo(this.collection, 'reset', _.debounce(this.addAll, 500));
                this.listenTo(this.collection, 'requesting', this.waitingForResp);
                this.listenTo(this.collection, 'all', this.updateCollectionCount);
                this.listenTo(this.collection, 'add', this.addOne2Before);
                this.listenTo(this.model, 'change', this.toggleVisible);

                this.listenTo(Global, 'change', this.globalModelChange);
                Backbone
                    .off("PRODUCT-LIST-REFRESH")
                    .on("PRODUCT-LIST-REFRESH", _.bind(this.initData, this));
            },

            initData: function () {
                this.collection.refresh();
            },

            addOne: function (item) {
                var $taskView = new ProductView({model: item, id: item.get("id")});
                this.$taskList.append($taskView.render().el);
            },

            addOne2Before: function (item, collection, options) {
                var $el = new ProductView({
                    model: item,
                    id: item.get("id")
                }).render().$el;
                var children = this.$taskList.children();
                if (children.length > 0 && options.at) {
                    $el.insertAfter(children.eq(options.at - 1));
                } else {
                    $el.prependTo(this.$taskList);
                }
            },

            globalModelChange: function () {
                if (Global.hasChanged("team")) {
                    this.initData();
                }
            },

            getDropActionData: function (fromList, item) {
                switch (fromList) {
                    case 'sprint-list':
                        return {
                            "teamId": Global.get('team'),
                            "productReqId": $(item).data('id'),
                            "reqState": "1"
                        };
                    default:
                        return {};
                }
            },

            refresh: function () {
                this.collection.refresh();
            },

            isDroppable: function () {
                return true;
            },

            receiveSortable: function (event, ui) {
                var that = this,
                    url = 'productReq/dragSprintReq.shtml',
                    fromList = ui.sender[0].id,
                    ajaxData = this.getDropActionData(ui.sender[0].id, ui.item),
                    model = ui.item.data('model'),
                    isReady = model.get('isReady'),
                    at = ui.item.index();

                if (!this.isDroppable()) {
                    ui.sender.sortable("cancel");
                    return;
                }

                if (fromList === 'product-list' && !isReady) {
                    layer.msg('未就绪的需求禁止拖入迭代');
                    ui.sender.sortable('cancel');
                    return;
                }
                switch (fromList) {
                    // 迭代列表 - > 产品列表
                    case "sprint-list":
                        var sprintInfo = Global.get("sprintInfo");
                        switch (sprintInfo.state) {
                            //迭代正在进行中弹窗进行操作
                            case 1:
                                layer.confirm("迭代正在进行中,是否移回产品列表?",
                                    {btn: ["是", "否"]},
                                    function () {
                                        layer.closeAll();
                                        callback();
                                    },
                                    function () {
                                        ui.sender.sortable("cancel");
                                    });
                                break;
                            case 0:
                            case 2:
                            default:
                                // do nothing
                                callback();
                        }
                        break;
                    //    产品列表 -> 迭代列表
                    case "product-list":
                        callback();
                        break;
                    //    需求池 -> 产品列表
                    case "demand-pool":
                        var modelId = ui.item.attr('id');
                        var model = ui.item.data('model');
                        if (ui.item.hasClass('disabled')) {
                            layer.msg('已进入产品列表');
                            ui.sender.sortable('cancel');
                            return false;
                        }
                        if (!model) {
                            ui.sender.sortable('cancel');
                            return false;
                        }
                        ui.sender.sortable('cancel');
                        //ui.item.addClass('changing');

                        //添加子节点到本列表
                        var leafNodes = model.getLeafNodes();
                        leafNodes = leafNodes.filter(function (node) {
                            return node.reqState == 0;
                        }).map(function (node) {
                            node.reqState = 1;
                            node.isReady = 1;
                            return node;
                        });
                        //加入产品列表（数据）
                        var leafNodesModel = that.collection.add(leafNodes, {merge: true, at: at});
                        _.invoke(leafNodesModel, "trigger", "changing");

                    function dragFail(msg) {
                        layer.msg(msg || "进入产品列表失败");
                    }

                        //发起请求
                        model.gettingIntoProductList()
                            .success(function (res) {
                                //请求失败后删除模型
                                if (res.hasOwnProperty('success') && !res.success) {
                                    that.collection.remove(leafNodesModel);
                                    dragFail(res.msg);
                                    return;
                                }
                                //停止卡片动画
                                _.invoke(leafNodesModel, "trigger", "changed");
                                //更新需求池数据
                                _.invoke(model.getLeafModels(), "getInPB");
                            })
                            .fail(function (res) {
                                //请求失败后删除模型
                                dragFail();
                                that.collection.remove(leafNodesModel);
                            })
                            .always(function () {
                                ui.item.removeClass('changing');
                            });
                        break;
                    default:
                    //do nothing
                }

                function callback() {
                    Backbone
                        .ajax({
                            dataType: 'json',
                            data: ajaxData,
                            url: url,
                            cache: false
                        })
                        .success(function (data) {
                            //保存错误请求处理
                            if (!data.success) {
                                //失败 回到 jira需求列表
                                layer.msg(data['errorMessages'] || data['msg']);
                                ui.sender.sortable("cancel");
                                return;

                            } else {
                                // 移除原本的collection中model
                                var exModel = $(ui.item).data("model");
                                exModel.collection.remove(exModel);
                                var preData = _.extend(exModel.toJSON(), {reqState: ajaxData.reqState || 1});
                                //添加数据到collection中并且更新视图
                                //silent for not trigger addOne func
                                var model = that.collection.add(preData, {silent: true});
                                //update trigger update count event
                                that.collection.trigger("update");
                                ui.item.data("model", model);
                                ui.item.data("id", model.id);
                                //更新绑定的视图
                                var productView = new ProductView({model: model, el: ui.item});
                                productView.render();
                                //更新迭代数据详情
                                Global.getBurnDownInfo();
                            }
                        })
                        .error(function () {
                            layer.alert("操作出现错误，重试");
                            ui.sender.sortable("cancel");
                        });
                }
            },

            /*updateSortable: function (event, ui) {
                var $el = ui.item;
                var self = this;
                //如果被移动到本列表之外, 不进行排序更新操作
                if (ui.sender) return;
                if (!$el.closest("#" + this.model.get('id')).length) return;

                var
                    $elPrev = $el.prev().data("id"),
                    $elNext = $el.next().data("id"),

                    prevModel = this.collection.get($elPrev),
                    currentModel = this.collection.get($el.data("id")),
                    nextModel = this.collection.get($elNext);

                //通过拖拽添加到列表里的项目 在collection中无法查找
                if (!currentModel)
                    return;
                var
                    preRank = Number(prevModel && prevModel.get('rank')),
                    curRank = Number(currentModel.get("rank")),
                    nextRank = Number(nextModel && nextModel.get('rank'));


                $.get(Common.URL.dragProductOrder,
                    {
                        productReqId: $el.data("id"),
                        teamId: Global.get("team"),
                        rankCurrent: curRank,
                        rankTarget: nextRank || preRank + 1 || 0
                    })
                    .done(
                        this.collection.refresh.bind(
                            this.collection, {
                                silent: true
                            }
                        )
                    )
                    .fail(function () {
                        self.$taskList.sortable('cancel');
                    });
            },*/

            //新排序方法
            updateSortable: function (event, ui) {
                $.ajax({
                    contentType: "application/json",
                    url: "productReq/sortProductReq.shtml",
                    data: JSON.stringify(this.$taskList.sortable('toArray')),
                    method: "POST"
                })

            },

            prioritySort: function () {
                this.collection.prioritySort();
            },

            deadlineSort: function () {
                this.collection.deadlineSort();
            }

        });
    });