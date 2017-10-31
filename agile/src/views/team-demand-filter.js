define([
    'backbone',
    'views/popover/filter',
    'collections/demand-pool',
    'collections/team-member',
    'common',
    'models/global'
], function (Backbone, popView, allDemand, teamMember, common, Global) {
    function filterChange () {
        var queryBefore = allDemand.queryModel.toJSON();
        var TEAM = Global.get("team");
        var queryNew = $('form.filter-options').serializeJson();
        
        //fixed bug for serialize
        //checked 为false 时，使用set不返回数据，无法删除query内原有数据
        _.extend(queryNew, {
            // title: queryBefore.title,
            teamId: TEAM
        });
        allDemand.queryModel.clear({silent: true});
        allDemand.queryModel.set(queryNew);
    }
    
    function cancelHandle () {
        var queryBefore = allDemand.queryModel.toJSON();
        var TEAM = Global.get("team");
        var BOARD = Global.get("board");
        
        var queryNew = {};
        _.extend(queryNew, {
            // title: queryBefore.title,
            team: TEAM,
            board: BOARD
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
        
        filterOpts: [ {
            label: '需求类型',
            childs: [ {
                name: 'issueTypeList',
                value: '1',
                label: '客户需求',
                handle: filterChange
            }, {
                name: 'issueTypeList',
                value: '2',
                label: '缺陷',
                handle: filterChange
            }, {
                name: 'issueTypeList',
                value: '3',
                label: '公司内部需求',
                handle: filterChange
            } ]
        }, {
            label: '需求状态',
            childs: [ {
                name: 'stateList',
                value: '新建',
                label: '新建',
                handle: filterChange
            }, {
                name: 'stateList',
                value: '研发中',
                label: '研发中',
                handle: filterChange
            }, {
                name: 'stateList',
                value: '验收',
                label: '验收',
                handle: filterChange
            }, {
                name: 'stateList',
                value: '完成',
                label: '完成',
                handle: filterChange
            }, {
                name: 'stateList',
                value: '发布',
                label: '发布',
                handle: filterChange
            }, {
                name: 'stateList',
                value: '版本验收',
                label: '版本验收',
                handle: filterChange
            }, {
                name: 'stateList',
                value: '升级',
                label: '升级',
                handle: filterChange
            }, {
                name: 'stateList',
                value: '关闭',
                label: '关闭',
                handle: filterChange
            } ]
        }, {
            label: '优先级',
            childs: [ {
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
            } ]
        } ],
        
        initialize: function () {
            this.$title = this.$('input.search');
            this.$filter = this.$('.glyphicon-filter');
            
            var teamName = [];
            teamMemberJson = teamMember.toJSON();
            teamMemberJson.forEach(function (e) {
                teamName.push({
                    name: 'assignerId',
                    value: e[ 'id' ],
                    label: e.name,
                    handle: filterChange
                });
            });
            
            var allOpts = this.filterOpts.concat({
                label: '执行者',
                childs: teamName
            });
            
            this.$filter = new popView({
                el: this.$filter,
                options: allOpts,
                cancelHandle: cancelHandle
            });
            
            this.listenTo(this.collection, "reset", this.teamChange);
        },
        
        teamChange: function () {
            var teamName = [];
            teamName.splice(0, teamName.length);
            
            teamMemberJson = teamMember.toJSON();
            teamMemberJson.forEach(function (e) {
                teamName.push({
                    name: 'assignerId',
                    value: e[ 'userId' ],
                    label: e.name,
                    handle: filterChange
                });
            });
            
            var allOpts = this.filterOpts.concat({
                label: '执行者',
                childs: teamName
            });
            
            this.$filter.removePopoverData();
            this.$filter.initialize({
                el: this.$filter,
                options: allOpts,
                cancelHandle: cancelHandle
            });
        },
        
        titleChange: function (e) {
            // allDemand.queryModel.set('title', this.$title.val());
            
            if (e.which === common.ENTER_KEY) return false;
        },
        
        noop: function (e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });
});