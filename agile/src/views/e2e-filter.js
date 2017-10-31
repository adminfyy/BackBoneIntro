define([
    'backbone',
    'jquery',
    'common',
    'models/global',
    'collections/e2e',
    'views/popover/e2e-filter'
], function (Backbone, $, Common, Global, e2eDemand, popView) {
    /**
     * 端到端看板顶部
     * 条件筛选功能
     * 1、左侧根据客户期望/创建时间筛选
     * 2、右侧根据PMS单号/需求标题筛选
     * 3、过滤器内根据 主导PO，涉及组件，需求类型，客户类型，是否紧急，跨组件，过滤
     */

    function filterChange() {
        var queryBefore = e2eDemand.queryModel.toJSON();
        var queryNew = $('form.filter-options').serializeJson();
        if(queryNew.emergency instanceof Array) {
            queryNew.emergency = '';
        }
        if(queryNew.isMultiComponent instanceof  Array) {
            queryNew.isMultiComponent = '';
        }

        //fixed bug for serialize
        //checked 为false 时，使用set不返回数据，无法删除query内原有数据
        _.extend(queryNew, {
            rangeType: queryBefore.rangeType,
            dateStart: queryBefore.dateStart,
            dateEnd: queryBefore.dateEnd,
            searchWord: queryBefore.searchWord,
            comIdList: queryBefore.comIdList
        });

        e2eDemand.queryModel.clear({silent: true});
        e2eDemand.queryModel.set(queryNew);
    }

    function cancelHandle() {
        var queryBefore = e2eDemand.queryModel.toJSON();
        var queryNew = {};
        _.extend(queryNew, {
            rangeType: queryBefore.rangeType,
            dateStart: queryBefore.dateStart,
            dateEnd: queryBefore.dateEnd,
            searchWord:queryBefore.searchWord,
            comIdList: queryBefore.comIdList
        });

        e2eDemand.queryModel.clear({silent: true});
        e2eDemand.queryModel.set(queryNew);
    }

    //点击某个节点 然后将该节点的名称赋值值文本框
    function checkComId(event, treeId, treeNode) {
        var treeObj = $.fn.zTree.getZTreeObj(treeId);
        //获得选中的节点
        var nodes = treeObj.getCheckedNodes(), v = "";
        var comIdArray =  $.map( nodes, function(n){
            return n.comId;
        });

        e2eDemand.queryModel.set({
            'comIdList': comIdArray
        });
        return false;
    }

    return Backbone.View.extend({
        el: '.agile-header',
        model: Global,
        events: {
            "change #rangeType": "typeChange",
            "change input#dateRange": "dateChange",
            "keyup input.search": "searchWordChange",
            'click #comId': "showComIdList",
            'submit': 'noop'
        },

        filterOpts: [{
            label: '需求类型',
            childs: [{
                name: 'issueType',
                value: '1',
                label: '客户需求',
                handle: filterChange
            }]
        }, {
            label: '紧急需求',
            childs: [{
                name: 'emergency',
                value: '1',
                label: '是',
                handle: filterChange
            }, {
                name: 'emergency',
                value: '0',
                label: '否',
                handle: filterChange
            }]
        }, {
            label: '跨组件需求',
            childs: [{
                name: 'isMultiComponent',
                value: '1',
                label: '是',
                handle: filterChange
            }, {
                name: 'isMultiComponent',
                value: '0',
                label: '否',
                handle: filterChange
            }]
        }],

        //初始化函数
        initialize: function () {
            //用户期望/创建时间下拉框
            this.$rangeType = this.$('#rangeType');
            //组件下拉框
            this.$comId = this.$('#comId');
            this.$comIdList = this.$('#comIdList');
            //搜索关键词
            this.$searchWord = this.$('input.search');
            //筛选条件
            this.$filter = this.$('.glyphicon-filter');

            //用户期望/创建时间下拉框初始化
            this.initRangeType();

            //默认时间初始化
            this.initDefaultTime();
            this.initPluginsDate();

            //组件初始化-获取全部组件
            this.initPluginComIdList();
            this.$comId.on("mouseenter",this.zTreeToggle);
            this.$comId.on("mouseleave",this.zTreeToggle);
            this.$comIdList.on("mouseout",this.zTreeOut);
            this.$comIdList.on("mouseover",this.zTreeOver);

            //筛选条件下拉框初始化
            new popView({
                el: this.$filter,
                options: this.filterOpts,
                cancelHandle: cancelHandle
            });
            //组件初始化-根据当前登陆人勾选组件(延迟加载避免组件树未加载完)
            setTimeout(function(){
        	 $.ajax({
                 method: 'get',
                 url: 'component/getCurrentUserComList.shtml',
                 dataType: "json",
                 contentType: "application/json"
             })
                .success(function (res) {
                	 // 根据comId勾选ztree节点
                    var treeObj = $.fn.zTree.getZTreeObj('comIdList');
                    if(treeObj!=null){
                    	var comIdList = res.comList || [];
                    	for (com in comIdList){
                    	    var node = treeObj.getNodeByParam('comId', comIdList[com]);
                            if (node) treeObj.checkNode(node, true, false);
                        }
                        e2eDemand.queryModel.set({
                            'comIdList': comIdList,
                            "searchWord": "",
                            "isMultiComponent": "",
                            "emergency" : "",
                            // "isVip3":"0", vip3 默认不传，表示显示所有  传0只显示非vip3 传1只显示vip3
                            'orderType': 1
                        });
                    }
                });
            },100);
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

        initRangeType: function() {
            this.$rangeType.select2({
                data: Common.rangeType,
                placeholder: '用户期望',
                minimumResultsForSearch: Infinity,
                theme: 'bootstrap'
            })
        },

        initDefaultTime: function() {
            var val = this.$rangeType.val();
            var dateFormat = 'yyyy-MM-dd';
            var date = new Date();
            var endDate = date.setDate(date.getDate() + 30);

            this.dateStart = new Date().format(dateFormat);
            this.dateEnd = new Date(endDate).format(dateFormat);

            e2eDemand.queryModel.set({
                'rangeType': val,
                'dateStart': this.dateStart,
                'dateEnd': this.dateEnd
            });
        },

        initPluginsDate: function () {
            this.$dateRange = flatpickr('#dateRange', {
                mode: "range",
                locale: "zh",
                allowInput: true,
                closeOnSelect: false,
                dateFormat: "Y/m/d",
                defaultDate: [
                    this.dateStart,
                    this.dateEnd
                ]
            });
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

        typeChange: function() {
            var val = this.$rangeType.val();
            e2eDemand.queryModel.set({'rangeType': val});
        },

        dateChange: function() {
            var dateRange = this.$dateRange.selectedDates.sort(Common.sortDate);
            var dateFormat = 'yyyy-MM-dd';
            this.dateStart = new Date(dateRange[0]).format(dateFormat);
            this.dateEnd = new Date(dateRange[dateRange.length - 1]).format(dateFormat);
            e2eDemand.queryModel.set({
                'dateStart': this.dateStart,
                'dateEnd': this.dateEnd
            });
        },

        searchWordChange: function (e) {
            if (e.which === Common.ENTER_KEY) return false;
            e2eDemand.queryModel.set('searchWord', this.$searchWord.val());
        },

        noop: function (e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    })
});
