define([
    'backbone',
    'views/popover/filter',
    'collections/demand-business',
    'common'
], function (Backbone, popView, allDemand, common) {
    function filterChange() {
        var queryBefore = allDemand.queryModel.toJSON();
        var queryNew = $('form.filter-options').serializeJson();

        //跨组件选项如果都勾选，则传空
        if(queryNew.isMultiComponent instanceof  Array) {
            queryNew.isMultiComponent = '';
        }

        //fixed bug for serialize
        //checked 为false 时，使用set不返回数据，无法删除query内原有数据
        _.extend(queryNew, {
            title: queryBefore.title
            // busLineId: queryBefore.busLineId
        });

        allDemand.queryModel.clear({silent: true});
        allDemand.queryModel.set(queryNew);
    }

    function cancelHandle() {
        var queryBefore = allDemand.queryModel.toJSON();
        var queryNew = {};
        _.extend(queryNew, {
            title: queryBefore.title
            // busLineId: queryBefore.busLineId
        });

        allDemand.queryModel.clear({silent: true});
        allDemand.queryModel.set(queryNew);
    }

    //点击某个节点 然后存储该节点的名称
    function checkComId(event, treeId, treeNode) {
        var treeObj = $.fn.zTree.getZTreeObj(treeId);
        //获得选中的节点
        var nodes = treeObj.getCheckedNodes(), v = "";
        var comIdArray =  $.map( nodes, function(n){
            return n.comId;
        });

        allDemand.queryModel.set({
            'comIds': comIdArray
        });
        return false;
    }

    return Backbone.View.extend({
        el: '.filter',
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
                value: '4',
                label: '运营缺陷',
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
            label: '客户类型',
            childs: [{
                name: 'vip0',
                value: '1',
                label: 'VIP0~2客户',
                handle: filterChange
            }, {
                name: 'vip3',
                value: '1',
                label: 'VIP3客户',
                handle: filterChange
            },{
                name: 'vip4',
                value: '1',
                label: 'VIP4客户',
                handle: filterChange
            },{
                name: 'isSensive',
                value: '1',
                label: '敏感客户',
                handle: filterChange
            }, {
                name: 'isKeyBusiness',
                value: '1',
                label: '关键业务关键客户',
                handle: filterChange
            }, {
                name: 'isCompetition',
                value: '1',
                label: '和友商竞争',
                handle: filterChange
            }, {
                name: 'isPotential',
                value: '1',
                label: '潜力客户',
                handle: filterChange
            }, {
                name: 'isOther',
                value: '1',
                label: '其他',
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
            } ]
        },  {
            label: '跨组件需求',
            childs: [{
                name: 'isMultiComponent',
                value: '1',
                label: '是',
                handle: filterChange,
                checked: true
            }, {
                name: 'isMultiComponent',
                value: '0',
                label: '否',
                handle: filterChange
            }]
        }],

        initialize: function () {
            //组件下拉框
            this.$comId = this.$('#comId');
            this.$comIdList = this.$('#comIdList');

            this.$title = this.$('input.search');
            this.$filter = this.$('.glyphicon-filter');

            //组件初始化
            this.initPluginComIdList();
            this.$comId.on("mouseenter",this.zTreeToggle);
            this.$comId.on("mouseleave",this.zTreeToggle);
            this.$comIdList.on("mouseout",this.zTreeOut);
            this.$comIdList.on("mouseover",this.zTreeOver);

            new popView({
                el: this.$filter,
                options: this.filterOpts,
                cancelHandle: cancelHandle
            })
        },

        initPluginComIdList: function() {
            var that = this;
            var setting = {
                data: {
                    key: {
                        name:"name",
                        checked: "isChecked"
                    },
                    simpleData: {
                        enable: true,
                        idKey: "comId",
                        pIdKey: "parentId",
                        rootPId:0
                    }
                },
                view: {
                    showIcon: false,
                    showLine: false
                },
                check: {
                    checkbox: {"Y":"ps","N":"ps"},
                    chkStyle: "checkbox",
                    enable: true,
                    autoCheckTrigger: true
                },
                callback: {
                    onCheck: checkComId
                },
                async: {
                    enable: true,
                    dataType:"json",
                    type: "get",
                    url: 'component/getAllComList.shtml'
                }
            };

            $.ajax({
                method: 'get',
                url: 'component/getAllComList.shtml',
                dataType: "json",
                contentType: "application/json"
            })
                .success(function(resp) {
                    var zNodes = '';
                    zNodes = _.union( zNodes, resp.waitReleaseVerList);
                    $.fn.zTree.init($('#comIdList'),setting,resp.comList);
                })
                .fail(function () {
                    layer.msg("组件获取失败")
                });
        },

        //切换树 显示/隐藏
        showComIdList: function() {
            $("#comIdList").toggle();
        },

        zTreeToggle:function() {
            $('#comIdList').toggle();
        },

        zTreeOut: function() {
            $("#comIdList").hide();
        },

        zTreeOver: function() {
            $("#comIdList").show();
        },

        titleChange: function (e) {
            if (e.which === common.ENTER_KEY) return false;

            allDemand.queryModel.set('title', this.$title.val());
        },

        noop: function (e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    })
});