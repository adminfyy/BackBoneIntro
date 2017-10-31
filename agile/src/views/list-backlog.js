/**
 * 待规划需求列表
 * 数据 backlog
 * */

define([
    "backbone",
    'text!templates/modal-version.html',
    'models/version',
    'common',
    'views/list',
    'collections/backlog',
    'views/list-backlog-item',
    'models/global'
], function (Backbone, versionDlg, versionModel, Common, stageView, backlogCollection, CardView, Global) {
    return stageView.extend({
        
        collection: backlogCollection,
        
        className: 'stage-list-item backlog',
        
        model: new Backbone.Model({
            id: 'backlog',
            name: "待规划需求",
            sortableOpt: 'backlog'
        }),
        
        tools: [ {
            name: 'refresh',
            label: "刷新"
        }, {
            name: "sort",
            label: "排序"
        } ],
        
        popover: [ {
            name: 'deadline-sort',
            value: "按截止时间排序"
        }, {
            name: 'priority-sort',
            value: "按优先级排序"
        } ],
        
        initData: function () {
            this.collection.refresh();
        },
        
        refresh: function () {
            this.collection.refresh();
            return false;
        },
        
        initDataListening: function () {
            this.listenTo(this.collection, 'reset', _.debounce(this.addAll, 500));
            this.listenTo(this.collection, 'requesting', this.waitingForResp);
            this.listenTo(this.collection, 'all', this.updateCollectionCount);
            this.listenTo(Global, 'change:team', this.initData);
        },
        
        //覆盖样式
        addOne: function (task) {
            var cardView = new CardView({
                model: task,
                collectionConstructor: backlogCollection.__proto__.constructor
            });
            this.$taskList.append(cardView.render().el);
            cardView.loadChild();
        },
        
        //按照截止时间排序
        deadlineSort: function () {
            this.collection.deadlineSort();
        },
        
        //优先级排序
        prioritySort: function () {
            this.collection.prioritySort();
        },
        
        //接受
        afterReceive: function (events, ui) {
            Common.afterReceive.call(this, events, ui, CardView);
        },
        
        receiveSortable: function (event, ui) {
            //禁用卡片不允许放置
            if (ui.item.hasClass('disabled')) {
                ui.sender.sortable('cancel');
                return;
            }
            var that = this;
            Backbone.ajax({
                url: rootPath + "/productReq/dragReq2WaitPlanning.shtml",
                data: {
                    teamId: Global.get('team'),
                    versionId: JSON.parse(Global.get('currVer')).id,
                    reqId: ui.item.attr("data-id"),
                    verRank: this.getNextRank(ui.item)
                },
                method: 'get',
                dataType: 'json',
                contentType: 'application/json'
            })
                .done(function (data) {
                    if (data[ Common.SUCCESS ]) that.afterReceive.call(that, event, ui);
                    else {
                        ui.sender.sortable('cancel');
                        layer.msg(data[ Common.MSG ]);
                    }
                })
                .error(function (data) {
                    layer.msg('接口出现错误');
                    ui.sender.sortable('cancel');
                });
        },
        
        updateSortable: function (event, ui) {
            //只相应本列表内的排序事件
            var self = this;
            var parentNode = ui.item.closest('.ui-sortable');
            if (parentNode.attr('id') !== 'backlog') return;
            //只相应本列表内的排序事件
            if (ui.sender) return;
            
            //子卡片不允许拖动
            if (ui.item.attr('child-card')) {
                this.$taskList.sortable('cancel');
                return;
            }
            //移动穿插在二级卡片的一级卡片的位置
            if (ui.item.next().attr('child-card')) {
                ui.item.insertAfter(ui.item.nextUntil(":not('[child-card]')").last());
            }
            var currentModel = ui.item.data('model'),
                currentRank = currentModel.get('verRank');
            
            Backbone
                .ajax({
                    url: rootPath + '/productReq/dragWaitPlanParentProductOrder.shtml',
                    contentType: 'application/json',
                    dataType: 'json',
                    data: {
                        productReqId: ui.item.attr('data-id'),
                        rankCurrent: currentRank,
                        rankTarget: this.getNextRank(ui.item),
                        teamId: Global.get('team')
                    }
                    //    刷新列表的顺序
                    //    不触发动画
                })
                .done(function (data) {
                    if (!data[ Common.SUCCESS ]) {
                        layer.msg(data[ Common.MSG ]);
                        ui.item.closest('.ui-sortable').sortable('cancel');
                        return;
                    }
                    this.collection.refresh({silent: true});
                    ui.item.trigger('position-changed');
                }.bind(this))
                .fail(function () {
                    self.$taskList.sortable('cancel');
                });
        },
        
        getNextRank: function (target) {
            var next = target.nextAll().not("[child-card]").first(),
                nextModel, nextRank;
            
            if (next.length) {
                nextModel = next.data('model');
                nextRank = nextModel && nextModel.get('verRank') || target.index() + 1;
            } else {
                nextModel = target
                    .prevAll()
                    .not("[child-card]").last()
                    .data('model');
                
                if (nextModel) {
                    nextRank = nextModel.get('verRank') + 1;
                } else {
                    nextRank = 1;
                }
            }
            
            return nextRank;
        }
        
        
    });
    
    
});