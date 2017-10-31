/**
 *
 * @deprecated 这个文件不建议使用，抽象拆分逻辑到 split-logic/
 * 具体页面template/initPlugins/getPageJson/save请各自实现
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
        'collections/demand-pool',
        'views/list-ac',
        'views/list-attachment',
        'views/list-comment',
        'views/list-total-solution',
        'collections/user',
        'collections/team-member',
        'collections/demand-business',
        'collections/demand-pool',
        'utils',
        'collections/all-component',
        'collections/team-component'
    ],
    function (Backbone, $, ModalTemplate, Common, Tasks, Global, ModelConstructor, splitItemView, Simditor,
              TagCollection, Collection, acView, attachmentView, commentView, totalSolutionView, userCollection, TeamMemberCollection
        , DemandBusinessCollection, DemandPoolCollection, utils, allComponent, teamComponent) {

        //点击某个节点 然后存储该节点的名称
        function clickComId(event, treeId, treeNode) {
            $('#componentName').hide();
            var treeObj = $.fn.zTree.getZTreeObj(treeId);
            var chooseStr = treeNode.name ;
            $("#component").val(chooseStr);
            return false;
        }

        return function (model) {
            var comIdOpt = {
                data: teamComponent.getZtreeData(),
                width: 'auto'
            };

            if (model.get('isMultiComponent')) {
                comIdOpt.data = allComponent.getZtreeData()
            }

            var defaults = {
                template: _.template(ModalTemplate),

                collection: new Collection.constructor(),

                url: {
                    "save": 'productReq/saveSplitReq.shtml',
                    'children': 'productReq/getSplitChildReqList.shtml'
                },

                fields: [ {
                    field: 'assignerId',
                    options: {
                        data: TeamMemberCollection.getSelect2Data()
                    }
                }, {
                    field: 'priority',
                    options: {
                        data: Common.priorityOptions
                    }
                }, {
                    field: 'issueType',
                    options: {
                        data: Common.issueTypeOptions
                    }
                }, {
                    field: 'reqRelateList',
                    options: {
                        data: Collection.getSelect2Data()
                    }
                }],

                events: {
                    "click [role='save']": "save",
                    "click [role='continue']": "continueSplit",
                    "click #discard": "discardModify",
                    "click #saveModify": "saveModify",
                    "click #component": 'zTreeToggle',
                    "input  #component": 'iscomponentChange'
                },

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
                    var isMultiComponent = this.model.toJSON().isMultiComponent;
                    $.fn.zTree.init($('#componentName'),this.setting,isMultiComponent ? allComponent.getZtreeData() : teamComponent.getZtreeData());
                    this.$('#component').on("keyup",this.AutoMatch.bind(this));
                },

                //ztree根据关键字搜索
                AutoMatch: function(e) {
                    var noResult = '<p>该组件不存在</p>';
                    console.log(this.model.toJSON());
                    this.model.set('comId','');//不对手动输入内容进行保存
                    this.model.set('comName','');//不对手动输入内容进行保存
                    if (e.currentTarget.value.length > 0) {
                        var zTree = $.fn.zTree.getZTreeObj("componentName");
                        var nodeList = zTree.getNodesByParamFuzzy("name", e.currentTarget.value);
                        //将找到的nodelist节点更新至Ztree内

                        $.fn.zTree.init($("#componentName"), this.setting, nodeList);
                        this.$('#componentName').show();
                        if(!nodeList.length) {
                            this.$('#componentName').append(noResult);
                        }
                    } else {
                        this.$('#componentName').hide();
                    }
                },

                //搜索组件时，根据是否跨组件重新渲染组件列表
                iscomponentChange: function() {
                    $.fn.zTree.init($('#componentName'),this.setting,this.model.toJSON().isMultiComponent ? allComponent.getZtreeData() : teamComponent.getZtreeData());
                },

                // 切换组件下拉列表的显示/隐藏
                zTreeToggle:function() {
                    $('#componentName').toggle();
                },

                /**
                 * 显示指定已拆分的项目
                 * @param detailModel
                 */
                showItem: function (detailModel) {
                    this.detailModel = detailModel;
                    var subject = detailModel.get('subject');
                    if (detailModel.id == "" || !detailModel.id) {
                        if (subject == "子需求") {
                            this.discardModify();
                        } else {
                            this.$("#discard").show();
                            this.$("#saveModify").show();
                            this.$("#continueBtn").hide();
                            //使用模型,确保含有默认属性
                            this.renderData(detailModel);
                        }
                    } else {
                        this.$("#discard").hide();
                        this.$("#saveModify").hide();
                        this.$("#continueBtn").hide();
                        var that = this;
                        Backbone
                            .ajax({
                                url: rootPath + "/productReq/productReqDetail.shtml",
                                data: {id: detailModel.id},
                                dataType: "json"
                            })
                            .success(function (data) {
                                var model = new ModelConstructor(data.productReqFormMap || data);
                                that.renderData(model);
                            }.bind(this))
                    }
                },

                showDefaultItem: function () {
                    this.showItem(this.collection.findWhere({subject: '子需求'}))
                },

                /**
                 * 取消修改
                 */
                discardModify: function () {
                    this.$("#discard").hide();
                    this.$("#saveModify").hide();
                    this.$("#continueBtn").show();
                    $("#childSplit li").each(function () {
                        if ($(this).text().replace('×', '').trim() == "子需求")
                            $(this).css("background", "#94dabd");
                        else
                            $(this).css("background", "white");
                    });
                    this.renderData(this.model);
                },

                /**
                 * 暂存修改
                 * @returns {*}
                 */
                saveModify: function () {
                    var json = this.getPageJson();
                    if (json.subject == "" || json.subject == null) {
                        layer.msg("标题不能为空！");
                        return false;
                    }

                    this.$("#discard").hide();
                    this.$("#saveModify").hide();
                    this.$("#continueBtn").show();
                    this.detailModel.set(json);

                    $("#childSplit li").each(function () {
                        if ($(this).text().replace('×', '').trim() == "子需求") $(this).css("background", "#94dabd");
                        else $(this).css("background", "white");
                    });

                    this.renderData(this.model);
                },

                /**
                 * 初始页面上面所需要的插件/组件
                 */
                initPlugins: function () {
                    var self = this;
                    this.listenToOnce(this.model, 'change', this.renderData.bind(this, this.model));
                    this.listenTo(this.collection, "view-item-detail", this.showItem.bind(this));
                    this.listenTo(this.collection, "reset", this.addAll);
                    this.listenTo(this.collection, "add", this.addOne);
                    this.listenTo(this.collection, "destroy", this.showDefaultItem);

                    //初始化组件
                    $('#component').val(this.model.get('comName'));
                    this.initPluginComponent();

                    //初始化 DATE-PICKER
                    flatpickr("[plugin='date-picker']", {locale: 'zh'});
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

                    this.collection.fetch({
                        reset: true,
                        wait: true,
                        data: {"parentId": this.model.get("id")},
                        url: this.url.children
                    });

                    this.$el.on('hide.bs.modal', this.collection, this.hideSplit.bind(this));
                    this.$description = new Simditor($.extend({}, Common.simditorDefaultConf, {
                        textarea: this.$("#description")
                    }));

                    this.$('#submitter').val($("#currentUserName").text());
                    this.renderData(model);
                },

                /**
                 * 左侧 已拆分需求列表
                 */
                addOne: function (item) {
                    var $taskView = new splitItemView({model: item, id: item.get("id")});
                    this.$('#childSplit').append($taskView.render().el);
                },

                addAll: function () {
                    this.$('#childSplit').empty();
                    this.collection.each(this.addOne, this);
                },

                renderData: function (model) {
                    var self = this;
                    var modelJson = model.toJSON();
                    _.each(modelJson, function (val, key) {
                        switch (key) {
                            case 'acList':
                            case 'attachmentList':
                            case 'reqCommentList':
                            case 'wikiLinkList':
                                self[ key ] && self[ key ].reset(val);
                                break;
                            case 'versionList':
                                var versionId = val[ 0 ] && val[ 0 ].id || "";
                                self.$('#versionId')
                                    .val(versionId)
                                    .trigger('change');
                                break;
                            case 'reqTreeList':
                                Backbone.$.fn.zTree.init(self.$('.tree-view'), {
                                    data: {
                                        key: {name: "name"},
                                        simpleData: {
                                            enable: true,
                                            pIdKey: 'parentId'
                                        }
                                    },
                                    view: {
                                        nameIsHTML: true
                                    }
                                }, val.map(function (i) {
                                    i.open = true;
                                    i.planPublishDate || (i.planPublishDate = '[截至日期未定义]')
                                    var template = _.template(
                                        '<%= subject %>&nbsp' +
                                        '<span class="state <%= state %>"><%= state %></span>&nbsp' +
                                        '<span class="date">&nbsp<%= planPublishDate %>截止</span>')
                                    i.name = template(i);
                                    return i;
                                }));
                                break;
                            case 'description':
                                self.$description.setValue(val)
                                break;
                            case 'reqRelateList':
                                self.$('#' + key)
                                    .val(val.map(function (i) {
                                        return i.relateId
                                    }))
                                    .trigger('change');
                                break;
                            case 'reqPartyList':
                                self.$('#' + key)
                                    .val(val.map(function (i) {
                                        return i.userId
                                    }))
                                    .trigger('change');
                                break;
                            case 'reqTagList':
                                self.$('#' + key)
                                    .val(val.map(function (i) {
                                        return i.smTagId
                                    }))
                                    .trigger('change');
                                break;
                            case 'parentId':
                                self.$('#' + key)
                                    .val(self.model.id);
                            case 'emergency':
                            case 'isMultiComponent':
                                self.$('#' + key)
                                    .prop('checked', !!val);
                                break;
                            default:
                                self.$('#' + key)
                                    .val(val)
                                    .trigger('change');
                                break;
                        }
                    })
                },

                /**
                 * 关闭窗口之前的弹窗提示
                 * @param thatCollection
                 * @returns {boolean}
                 */
                hideSplit: function (thatCollection) {
                    var self = this;
                    if (thatCollection.data.length == 0) {
                        //剔除 hide.bs.modal 监听事件
                        this.$el.off('hide.bs.modal');
                        this.$el.modal("hide");
                        return true;
                    }

                    layer.confirm("关闭将不保存拆解的任务，请确认是否关闭？", function (index) {
                        layer.close(index);
                        //剔除 hide.bs.modal 监听事件
                        self.$el.off('hide.bs.modal');
                        self.$el.modal("hide");
                    });
                    return false;
                },

                /**
                 * 继续拆解按钮
                 * @returns {boolean}
                 */
                continueSplit: function () {
                    var json = this.getPageJson();
                    if (json.subject == "" || json.subject == null) {
                        layer.msg("标题不能为空！");
                        return false;
                    }
                    this.collection.push(new ModelConstructor(json));
                    this.renderData(this.model);
                },

                /**
                 * 序列化页面上面的数据，加工并且转化成json
                 */
                getPageJson: function () {
                    var data = this.$el.find("form").serializeJson();
                    data = utils.ensureListPropertyList(data);

                    var selectNode = $.fn.zTree.getZTreeObj('componentName').getSelectedNodes();
                    var comId = selectNode[0] && selectNode[0].comId;
                    var comName = selectNode[0] && selectNode[0].name;
                    var issueType = $('#issueType').val();
                    var acList = this.acList.toJSON();
                    var attachmentList = this.attachmentList.toJSON();
                    var reqCommentList = this.reqCommentList.toJSON();
                    var wikiLinkList = this.wikiLinkList.toJSON();
                    _.extend(data, {
                        issueType:issueType,
                        acList: acList,
                        attachmentList: attachmentList,
                        reqCommentList: reqCommentList,
                        wikiLinkList: wikiLinkList,
                        parentId: this.model.id,
                        //是否跨组件【字段】 来源：原始需求
                        isMultiCompoent: this.model.isMultiCompoent
                        // ,teamId: Global.get('team')
                    });
                    data.comId = comId || (data.comId = this.model.get('comId'));
                    data.comName = comName || (data.comName = this.model.get('comName'));

                    this.model.transformAttributesForServer(data);

                    return data;
                },

                /**
                 * 拆解完成
                 */
                save: function () {
                    var that = this;
                    var data = this.collection.filter(function (model) {
                        return model.get('subject') !== '子需求' && model.isNew();
                    });

                    $.ajax({
                        url: this.url.save,
                        type: "post",
                        dataType: "json",
                        contentType: "application/json",
                        data: JSON.stringify(data)
                    })
                        .success(function (res) {
                            if (res.success) {
                                that.$el.off('hide.bs.modal');
                                that.$el.modal("hide");
                                //列表数据刷新
                                if (this.model.toJSON().isBusinessBoard) {
                                    DemandBusinessCollection.query();
                                } else {
                                    DemandPoolCollection.query();
                                }
                            } else {
                                layer.msg(res.msg);
                            }
                        }.bind(this));
                }
            };

            return _.extend({}, defaults, {model: model})
        }
    });