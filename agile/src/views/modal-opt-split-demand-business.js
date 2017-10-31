/**
 * Created by fuyy on 2017/4/5.
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
        'collections/team-component',
        'views/modal-split-logic'
    ],
    function (Backbone, $, ModalTemplate, Common, Tasks, Global, ModelConstructor, splitItemView, Simditor,
              TagCollection, Collection, acView, attachmentView, commentView, totalSolutionView, userCollection, TeamMemberCollection
        , DemandBusinessCollection, DemandPoolCollection, utils, allComponent, teamComponent, SplitLogic) {

//点击某个节点 然后存储该节点的名称
        function clickComId(event, treeId, treeNode) {
            $('#componentName').hide();
            var treeObj = $.fn.zTree.getZTreeObj(treeId);
            var chooseStr = treeNode.name;
            $("#component").val(chooseStr);
            return false;
        }

        return function (model) {
            var comIdOpt = {
                data: teamComponent.getZtreeData(),
                width: 'auto'
            };

            if (model.get('isMultiComponent')) {
                comIdOpt.data = allComponent.getZtreeData();
            }

            var defaults = {
                template: _.template(ModalTemplate),

                events: {
                    "click [role='save']": "save",
                    "click #component": 'zTreeToggle',
                    "change #isMultiComponent": 'isMultiComponentChange',
                    "click [role=split]": 'split',
                    "input [name=subject]": 'autoSave'
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
                        issueType: issueType,
                        acList: acList,
                        attachmentList: attachmentList,
                        reqCommentList: reqCommentList,
                        wikiLinkList: wikiLinkList,
                        parentId: this.model.id,
                        //是否跨组件【字段】 来源：原始需求
                        isMultiComponent: this.model.get("isMultiComponent")
                    });
                    data.comId = comId || (data.comId = this.model.get('comId'));
                    data.comName = comName || (data.comName = this.model.get('comName'));
                    data.groupName = allComponent.getGroupName(data.comId);
                    data.cascadeComValue = allComponent.getCascadeValue(data.comId);
                    this.model.transformAttributesForServer(data);
                    return data;
                },


                /**
                 * select2相关字段 配置化
                 */
                fields: [{
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


                setting: {
                    data: {
                        key: {
                            name: "name",
                            checked: "isChecked"
                        },
                        simpleData: {
                            enable: true,
                            idKey: "comId",
                            pIdKey: "parentId",
                            rootPId: 0
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
                        dataType: "json",
                        type: "get"
                    }
                },

                /**
                 * 初始化组件树
                 */
                initPluginComponent: function () {
                    var isMultiComponent = this.model.toJSON().isMultiComponent;
                    $.fn.zTree.init($('#componentName'), this.setting, isMultiComponent ? allComponent.getZtreeData() : teamComponent.getZtreeData());
                    this.$('#component').on("keyup", this.AutoMatch.bind(this));
                },

                /**
                 * ztree根据关键字搜索
                 * @param e
                 * @constructor
                 */
                AutoMatch: function (e) {
                    var noResult = '<p>该组件不存在</p>';
                    this.model.set('comId', '');//不对手动输入内容进行保存
                    this.model.set('comName', '');//不对手动输入内容进行保存
                    var isMultiComponent = this.model.toJSON().isMultiComponent;
                    var componentCollection = isMultiComponent ? allComponent : teamComponent;

                    if (e.currentTarget.value.length > 0) {
                        var resultLlist = componentCollection.getByParamFuzzy(e.currentTarget.value)
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

                //跨组件状态变化时，根据是否跨组件渲染组件列表
                isMultiComponentChange: function (e) {
                    $.fn.zTree.init($('#componentName'), this.setting, e.currentTarget.checked ? allComponent.getZtreeData() : teamComponent.getZtreeData());
                },

                /**
                 * 切换组件下拉列表的显示/隐藏
                 */
                zTreeToggle: function () {
                    $('#componentName').toggle();
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
                    this.$el.on('hide.bs.modal', this.collection, this.hideSplit.bind(this));
                    this.$splitList = this.$('#childSplit');

                    //初始化组件
                    $('#component').val(this.model.get('comName'));
                    this.initPluginComponent();

                    flatpickr("[plugin='date-picker']", {locale: 'zh'});
                    this.fields.forEach(function (i) {
                        self
                            .$('#' + i.field)
                            .select2(i.options);
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
                    this.$description = new Simditor($.extend({}, Common.simditorDefaultConf, {
                        textarea: this.$("#description")
                    }));
                    this.$('#submitter').val($("#currentUserName").text());
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
                                self[key] && self[key].reset(val);
                                break;
                            case 'versionList':
                                var versionId = val[0] && val[0].id || "";
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
                                    i.planPublishDate || (i.planPublishDate = '[截至日期未定义]');
                                    var template = _.template(
                                        '<%= subject %>&nbsp' +
                                        '<span class="state <%= state %>"><%= state %></span>&nbsp' +
                                        '<span class="date">&nbsp<%= planPublishDate %>截止</span>');
                                    i.name = template(i);
                                    return i;
                                }));
                                break;
                            case 'description':
                                self.$description.setValue(val);
                                break;
                            case 'reqRelateList':
                                self.$('#' + key)
                                    .val(val.map(function (i) {
                                        return i.relateId;
                                    }))
                                    .trigger('change');
                                break;
                            case 'reqPartyList':
                                self.$('#' + key)
                                    .val(val.map(function (i) {
                                        return i.userId;
                                    }))
                                    .trigger('change');
                                break;
                            case 'reqTagList':
                                self.$('#' + key)
                                    .val(val.map(function (i) {
                                        return i.smTagId;
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
                            case 'comName':
                                self.$('#component').val(val);
                                break;
                            case 'component':
                                break;
                            default:
                                self.$('#' + key)
                                    .val(val)
                                    .trigger('change');
                                break;
                        }
                    });
                },

                validate: function (data) {
                    if (data.subject == "" || data.subject == null) {
                        layer.msg("标题不能为空！");
                        return false;
                    }
                    return true;
                },
                /**
                 * 拆解完成
                 */
                save: function () {
                    //  自动保存出现异常
                    if (!this.autoSave()) {
                        return false;
                    }
                    var that = this;
                    var data = this.collection.filter(function (model) {
                        return model.isNew();
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
            return $.extend(true, SplitLogic, defaults, {model: model});
        };
    });