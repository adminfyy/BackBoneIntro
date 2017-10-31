define([
    'backbone',
    'views/popover/filter',
    'collections/demand-pool',
    'collections/team-member',
    'common',
    'models/global',
    'collections/product',
    'common'
], function (Backbone, popView, allDemand, teamMember, common, Global, ProductCollection, C) {
    function filterChange() {
        var teamId = Global.get("team");
        var queryNew = $('form.filter-options').serializeJson();
        _.extend(queryNew, {
            teamId: teamId
        });

        //fixed bug for serialize
        //checked 为false 时，使用set不返回数据，无法删除query内原有数据
        allDemand.queryModel.clear({silent: true});
        allDemand.queryModel.set(queryNew);
    }

    function cancelHandle() {
        var teamId = Global.get("team");
        var queryNew = {};
        _.extend(queryNew, {
            teamId: teamId
        });

        allDemand.queryModel.clear({silent: true});
        allDemand.queryModel.set(queryNew);
    }

    return Backbone.View.extend({
        el: '.filter',
        collection: teamMember,
        events: {
            'keyup input.search': 'titleChange',
            'submit': 'noop'
        },

        filterOpts: [{
            label: '需求类型',
            childs: [{
                name: 'issueTypeList',
                value: '1',
                label: '客户需求',
                handle: filterChange
            }, {
                name: 'issueTypeList',
                value: '2',
                label: '公司内部需求',
                handle: filterChange
            }, {
                name: 'issueTypeList',
                value: '3',
                label: '组内需求',
                handle: filterChange
            }, {
                name: 'issueTypeList',
                value: '4',
                label: '运营缺陷',
                handle: filterChange
            }, {
                name: 'issueTypeList',
                value: '5',
                label: '组内缺陷',
                handle: filterChange
            }, {
                name: 'issueTypeList',
                value: '6',
                label: '简单任务',
                handle: filterChange
            }]
        }, {
            label: '优先级',
            childs: [{
                name: 'priorityList',
                value: '1',
                label: '最高',
                handle: filterChange
            }, {
                name: 'priorityList',
                value: '2',
                label: '高',
                handle: filterChange
            }, {
                name: 'priorityList',
                value: '3',
                label: '中',
                handle: filterChange
            }, {
                name: 'priorityList',
                value: '4',
                label: '低',
                handle: filterChange
            }]
        }, {
            label: '需求状态',
            childs: [{
                name: 'stateList',
                value: '新建',
                label: '新建',
                handle: filterChange,
                checked: true
            }, {
                name: 'stateList',
                value: '就绪',
                label: '就绪',
                handle: filterChange,
                checked: true
            }, {
                name: 'stateList',
                value: '已规划',
                label: '已规划',
                handle: filterChange,
                checked: true
            }, {
                name: 'stateList',
                value: '研发中',
                label: '研发中',
                handle: filterChange,
                checked: true
            }, {
                name: 'stateList',
                value: '验收',
                label: '验收',
                handle: filterChange,
                checked: true
            }, {
                name: 'stateList',
                value: '完成',
                label: '完成',
                handle: filterChange,
                checked: true
            }, {
                name: 'stateList',
                value: '发布',
                label: '发布',
                handle: filterChange,
                checked: true
            }, {
                name: 'stateList',
                value: '升级',
                label: '升级',
                handle: filterChange,
                checked: true
            }, {
                name: 'stateList',
                value: '关闭',
                label: '关闭',
                handle: filterChange
            }]
        }],

        initialize: function () {
            var self = this;
            this.$title = this.$('input.search');
            this.$filter = this.$('.glyphicon-filter');

            this.$filterView = new popView({
                el: this.$filter,
                options: this.processOptions(),
                cancelHandle: cancelHandle
            });

            //团队成员变 -> 筛选器内容更新
            this.listenTo(this.collection, "reset", this.teamMemberChange);

        },


        teamMemberChange: function () {
            this.$filterView.removePopoverData();
            this.$filterView.initialize({
                el: this.$filter,
                options: this.processOptions(),
                cancelHandle: cancelHandle
            });
        },

        processOptions: function () {
            var assignerOpt = {
                label: '执行者',
                childs: teamMember.toJSON().map(function (member) {
                    return {
                        name: 'assignerIdList',
                        value: member['id'],
                        label: member.name,
                        handle: filterChange
                    }
                })
            };

            return this.filterOpts.concat(assignerOpt)
        },

        titleChange: function (e) {
            if (e.which === common.ENTER_KEY) return false;
            var term = this.$title.val().trim();
            allDemand.highlight(term);
            ProductCollection.highlight(term);
        },

        noop: function (e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    })
});