define([
    'backbone',
    'views/list',
    'collections/demand-business',
    'views/list-demand-business-item'
], function (Backbone, ListView, allDemand, demandItem) {
    'use strict';
    return ListView.extend({

        el: '.big.stage-list-item',

        model: new Backbone.Model({
            id: 'big',
            name: '跨组件需求池',
            sortableOpt: {
                placeholder: "task-list-item-placeholder",
                forcePlaceholderSize: true,
                helper: 'clone',
                items: '.task-list-item:visible'
            }
        }),

        tools: [{
            name: 'sort',
            label: '排序'
        }],

        popover: [{
            name: 'refresh',
            label: '按手动排序'
        }, {
            name: 'deadline-sort',
            label: '按截止时间排序'
        }, {
            name: 'priority-sort',
            label: '按优先级排序'
        }],

        collection: allDemand,

        initData: function () {
            // this.addAll();
            this.collection.queryModel.clear();
            this.collection.queryModel.set("stateList", ['新建', '就绪', '已规划', '研发中', '验收', '完成', '发布', '升级']);
            this.collection.queryModel.set("isMultiComponent", '1');
            this.collection.query();

        },

        addOne: function (m) {
            this.$taskList.append(new demandItem({
                model: m,
                attributes: {
                    "data-id": m.id
                }

            }).render().$el);
        },

        prioritySort: function () {
            this.$taskList.sortable('disable');
            this.collection.queryModel.set('orderType', 1);
        },

        deadlineSort: function () {
            this.$taskList.sortable('disable');
            this.collection.queryModel.set('orderType', 2);
        },

        refresh: function () {
            this.$taskList.sortable('enable');
            this.collection.queryModel.set('orderType', 0);
        },
        //更新排序的函数
        updateSortable: function (e, ui) {
            var self = this;
            if (ui.item.attr('child')) {
                layer.msg('只有一级需求可以排序');
                this.$taskList.sortable('cancel');
                return false;
            }
            ui.item.data('model').trigger('position-changed');
            var targetRank = ui.item.index() + 1;
            Backbone
                .ajax({
                    url: 'businessReq/orderBusReq.shtml',
                    type: 'GET',
                    data: {
                        id: ui.item.attr('data-id'),
                        targetRank: targetRank
                    },
                    dataType: 'json'
                })
                .success(function (res) {
                    if (res.success) {
                    } else {
                        layer.msg(res.msg);
                        self.$taskList.sortable('cancel');
                    }
                });
        }
    });
});