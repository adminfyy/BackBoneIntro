/**
 * Created by fuyy on 2017/4/5.
 */
define([
        "backbone",
        "text!templates/modal-create-demand.html",
        "models/demand-pool",
        "common",
        "collections/team-member",
        "collections/demand-pool",
        "views/list-ac",
        "views/list-attachment",
        "views/list-comment",
        "views/list-total-solution",
        "models/global",
        "utils",
        "collections/team-component",
        "collections/all-component"
    ],
    function (Backbone, template, Model, Common, teamMemberCollection, demandPoolCollection,
              acView, attachmentView, commentView, totalSolutionView, Global, utils, teamComponent, allComponent) {
        //点击某个节点 然后存储该节点的名称
        function clickComId(event, treeId, treeNode) {
            $('#componentName').hide();
            var treeObj = $.fn.zTree.getZTreeObj(treeId);
            var chooseStr = treeNode.name ;
            $("#component").val(chooseStr);
            return false;
        }

        return function () {
            return {
                model: new Model(),
                template: _.template(template),
                events: {
                    "click [role='save']": 'save',
                    "click #component": 'zTreeToggle'
                },
                fields: [{
                    field: 'assignerId',
                    options: {
                        data: teamMemberCollection.getSelect2Data()
                    }
                }, {
                    field: 'priority',
                    options: {
                        data: Common.priorityOptions
                    }
                }, {
                    field: 'issueType',
                    options: {
                        data: Common.createIssueTypeOptions
                    }
                }, {
                    field: 'reqRelateList',
                    options: {
                        data: demandPoolCollection.getSelect2Data()
                    }
                }],

                setting :{
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
                        showLine: true
                    },
                    check: {
                        enable: false,
                        autoCheckTrigger: true,
                        chkStyle: "radio",  //单选框
                        radioType: "all"   //对所有节点设置单选
                    },
                    callback: {
                        onClick: clickComId
                    },
                    async: {
                        enable: true,
                        dataType:"json",
                        type: "get"
                    }
                },

                //初始化组件
                initPluginComponent: function() {
                    //默认为本组件的第一个组件
                    this.model.set('comId',comId);
                    this.model.set('comName',comName);

                    $.fn.zTree.init($('#componentName'),this.setting,teamComponent.getZtreeData());

                    var comName = $.fn.zTree.getZTreeObj("componentName").getNodes()[0].name;
                    var comId = $.fn.zTree.getZTreeObj("componentName").getNodes()[0].comId;
                    $('#component').val(comName);
                    this.model.set('comId',comId);
                    this.model.set('comName',comName);
                    this.$('#component').on("keyup",this.AutoMatch.bind(this));
                },

                //ztree根据关键字搜索
                AutoMatch: function(e) {
                    var noResult = '<p>该组件不存在</p>';

                    var componentCollection = teamComponent;

                    if (e.currentTarget.value.length > 0) {
                        var resultLlist = componentCollection.getByParamFuzzy(e.currentTarget.value);
                        //将找到的nodelist节点更新至Ztree内
                        $.fn.zTree.init($("#componentName"), this.setting, resultLlist);

                        this.$('#componentName').show();
                        if (!resultLlist.length) {
                            this.$('#componentName').append(noResult);
                        }
                    } else {
                        this.$('#componentName').hide();
                    }
                },

                // 切换组件下拉列表的显示/隐藏
                zTreeToggle:function() {
                    $('#componentName').toggle();
                },

                //跨组件状态变化时，根据是否跨组件渲染组件列表
                isMultiComponentChange: function (e) {
                    $.fn.zTree.init($('#componentName'),this.setting,e.currentTarget.checked ? allComponent.getZtreeData() : teamComponent.getZtreeData());

                    var comName = $.fn.zTree.getZTreeObj("componentName").getNodes()[0].name;
                    var comId = $.fn.zTree.getZTreeObj("componentName").getNodes()[0].comId;
                    $('#component').val(comName);
                    this.model.set('comId',comId);
                    this.model.set('comName',comName);
                },

                initPlugins: function () {
                    var self = this;

                    //初始化 DATE-PICKER
                    flatpickr("[plugin='date-picker']", {
                        locale: 'zh'
                    });

                    this.fields.forEach(function (i) {
                        self
                            .$('#' + i.field)
                            .select2(i.options)
                    });

                    this.acList = new Backbone.Collection(this.model.get('acList'));
                    this.attachmentList = new Backbone.Collection(this.model.get('attachmentList'));
                    this.reqCommentList = new Backbone.Collection(this.model.get('reqCommentList'));
                    this.wikiLinkList = new Backbone.Collection(this.model.get('wikiLinkList'));

                    new acView({collection: this.acList, el: this.$('.acList')});
                    new attachmentView({collection: this.attachmentList, el: this.$('.attachmentList')});
                    new commentView({collection: this.reqCommentList, el: this.$('.reqCommentList')});
                    new totalSolutionView({collection: this.wikiLinkList, el: this.$('.totalSolution')});

                    this.$description = new Simditor($.extend({}, Common.simditorDefaultConf, {
                        textarea: this.$("#description")
                    }));

                    //初始化组件
                    this.initPluginComponent();

                    this.$('#submitter').val($("#currentUserName").text())
                },

                save: function () {
                    var self = this;
                    var data = this.$('form').serializeJson();
                    var selectNode = $.fn.zTree.getZTreeObj('componentName').getSelectedNodes() ;
                    var comId = selectNode[0] && selectNode[0].comId || this.model.get('comId');
                    var comName = selectNode[0] && selectNode[0].name || this.model.get('comName');

                    //修复缺陷: multiple 类型的select，数据可能为字符串或者数组
                    utils.ensureListPropertyList(data);
                    _.extend(data, {
                        acList: this.acList.toJSON(),
                        attachmentList: this.attachmentList.toJSON(),
                        reqCommentList: this.reqCommentList.toJSON(),
                        wikiLinkList: this.wikiLinkList.toJSON(),
                        teamId: Global.get('team')
                    });
                    data.comId = comId;
                    data.comName = comName;

                    this.model.transformAttributesForServer(data);

                    var promise = this.model.save(data);
                    promise && promise.success(function (res) {
                        if (res.success) {
                            demandPoolCollection.unshift(self.model);
                            self.hide();
                        }
                    })
                }
            }
        }
    }
);