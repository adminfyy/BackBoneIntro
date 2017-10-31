/**
 * 需求详情页面
 */
define([
    'backbone',
    'common',
    'text!templates/modal-demand-pool-item.html',
    'views/list-ac',
    'views/list-comment',
    'views/list-attachment',
    'views/list-total-solution',
    'utils',
    'collections/tag',
    'collections/version',
    'collections/team-member',
    'views/modal-opt-split-demand-pool',
    'collections/team-component',
    'collections/all-component',
    'models/demand-pool',
    'views/modal-opt-split-demand-business',
    'models/global'
], function (Backbone, Common, Template, acView, commentView, attachmentView, totalSolutionView, utils, tagCollection, versionCollection,
             teamMemberCollection, SplitDemandPool, teamComponent, allComponent, DemandPoolModel, SplitDemandBusiness, Global) {
    //点击某个节点 然后存储该节点的名称
    function clickComId (event, treeId, treeNode) {
        $('#componentName').hide();
        var treeObj = $.fn.zTree.getZTreeObj(treeId);
        var chooseStr = treeNode.name;
        $("#component").val(chooseStr);
        return false;
    }

    return function (opt) {
        var defaultOpts = {
            template: _.template(Template),
            events: {
                "click [role='save']": 'save',
                "click [role='split']": 'splitItem',
                "click [role='delete']": "deleteItem",
                "change #isMultiComponent": 'isMultiComponentChange',
                'click [readonly]': function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                },
                "click #component": 'zTreeToggle'
            },
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
            
            initPlugins: function () {
                var self = this;
                if ((this.model.get('reqState') === 2 && Global.isSprintRunning()) || this.model.get('reqState') === 3 || this.model.get('reqState') === 4) {
                    this.$('[name]').attr('readonly', "readonly");
                    this.$('[name]').attr('disabled', "disabled");
                    this.$('[role = "split"]').prop('disabled', "disabled");
                    this.$('[role = "delete"]').prop('disabled', "disabled");
                    //不影响 关联内容
                    this.$('[name = "reqRelateList"]').removeAttr("disabled");
                    this.$('[name = "reqRelateList"]').removeAttr("readonly");
                }

                //初始化组件
                this.initPluginComponent();
                //初始化 DATE-PICKER
                flatpickr("[plugin='date-picker']", {
                    locale: 'zh'
                });
                // var versionInfo = (this.model.get('versionList').shift());
                var select2FieldS = [ {
                    field: '#assignerId',
                    options: {
                        data: teamMemberCollection.getSelect2Data()
                    }
                }, {
                    field: '#priority',
                    options: {
                        data: Common.priorityOptions
                    }
                }, {
                    field: '#issueType',
                    options: {
                        disabled: true,
                        data: Common.issueTypeOptions
                    }
                }, {
                    field: '#reqRelateList',
                    options: {
                        data: this.model.collection.getSelect2Data().filter(function (i) {
                            return i.id !== self.model.id;
                        })
                    }
                } ];

                select2FieldS.forEach(function (i) {
                    self
                        .$(i.field)
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
                
                this.$('#versionId').on('change', function () {
                    var model = versionCollection.get(self.$('#versionId').val());
                    if (model) {
                        self.$('#version-date').val(model.get('planReleaseDate'));
                        self.$('#version-state').val(Common.VERSION[ model.get('state') ]);
                    }
                });
                
                var conf = $.extend({}, Common.simditorDefaultConf, {
                    textarea: this.$("#description")
                });
                
                this.$description = new Simditor(conf);
                this.$description.setValue(this.model.get("description"));
                //是否显示富文本
                this.showEditor();
                //渲染数据
                this.renderData(this.model);
            },
            
            //初始化组件
            initPluginComponent: function () {
                var isMultiComponent = this.model.toJSON().isMultiComponent;
                $.fn.zTree.init($('#componentName'), this.setting, isMultiComponent ? allComponent.getZtreeData() : teamComponent.getZtreeData());
                
                this.$('#component').on("keyup", this.AutoMatch.bind(this));
            },
            
            //ztree根据关键字搜索
            AutoMatch: function (e) {
                var noResult = '<p>该组件不存在</p>';
                this.model.set('comId', '');//不对手动输入内容进行保存
                this.model.set('comName', '');//不对手动输入内容进行保存

                var componentCollection = $('#isMultiComponent').is(':checked') ? allComponent : teamComponent;

                if (e.currentTarget.value.length > 0) {
                    // var zTree = $.fn.zTree.getZTreeObj("componentName");
                    // var nodeList = zTree.getNodesByParamFuzzy("name", e.currentTarget.value);

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
            zTreeToggle: function () {
                $('#componentName').toggle();
            },
            
            //跨组件状态变化时，根据是否跨组件渲染组件列表
            isMultiComponentChange: function (e) {
                $.fn.zTree.init($('#componentName'), this.setting, e.currentTarget.checked ? allComponent.getZtreeData() : teamComponent.getZtreeData());
            },
            
            renderData: function (model) {
                var data = model.toJSON(),
                    self = this;
                _.each(data, function (val, key) {
                    switch (key) {
                        case 'acList':
                        case 'attachmentList':
                        case 'reqCommentList':
                        case 'wikiLinkList':
                            self[ key ].reset(val);
                            break;
                        case 'versionList':
                            var versionId = val[ 0 ] && val[ 0 ].name || "";
                            self.$('#versionId')
                                .val(versionId)
                                .trigger('change');
                            break;
                        case 'reqTreeList':
                            Backbone.$.fn.zTree.init(self.$('.tree-view'), {
                                data: {
                                    key: {name: "name", title: "subject"},
                                    simpleData: {
                                        enable: true,
                                        pIdKey: 'parentId'
                                    }
                                },
                                view: {nameIsHTML: true},
                                callback: {
                                    beforeClick: function (treeId, treeNode, clickFlag) {
                                        var nodeId = treeNode.id;
                                        if (nodeId === self.model.id) return false;
                                        var model = self.model.collection.get(nodeId) || new self.model.constructor();
                                        model.fetch({data: {id: nodeId}}).done(self.renderData.bind(self, model));
                                        self.scrollToTop();
                                        return false;
                                    }
                                }
                            }, val.map(function (i) {
                                _.defaults(i, {
                                    open: true,
                                    state: '[未定义]',
                                    planPublishDate: '[截至日期未定义]'
                                });
                                var template = _.template(
                                    '<span class="subject"><%= subject %>&nbsp</span>' +
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
                        case 'emergency':
                        case 'isMultiComponent':
                            self.$('#' + key)
                                .prop('checked', !!val);
                            if (key === 'isMultiComponent') {
                                //该需求是子需求或者它的子需求已经跨组件，则不允许更改
                                if (data.parentId || data.multiComName.length) {
                                    self.$('#' + key).attr('readonly', 'readonly');
                                }
                            }
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
            
            scrollToTop: function () {
                this.$('.modal-body').scrollTo(0, 500);
            },
            
            save: function () {
                this.$('[name]').removeAttr('disabled');
                this.$('[name]').removeAttr('readonly');
                var self = this,
                    data = this.$('form').serializeJson();
                var selectNode = $.fn.zTree.getZTreeObj('componentName').getSelectedNodes() || [];
                var comId = selectNode[ 0 ] && selectNode[ 0 ].comId;
                var comName = selectNode[ 0 ] && selectNode[ 0 ].name;
                
                //修复缺陷: multiple 类型的select，数据可能为字符串或者数组
                utils.ensureListPropertyList(data);
                
                _.extend(data, {
                    acList: this.acList.toJSON(),
                    attachmentList: this.attachmentList.toJSON(),
                    reqCommentList: this.reqCommentList.toJSON(),
                    wikiLinkList: this.wikiLinkList.toJSON()
                });
                data.comId = comId || (data.comId = this.model.get('comId'));
                data.comName = comName || (data.comName = this.model.get('comName'));
                
                this.model.transformAttributesForServer(data);

                var promise = this.model.save(data);
                promise && promise.success(function (res) {
                    if (res.success) {
                        self.hide();
                    }
                });
            },
            
            deleteItem: function () {
                var that = this;
                layer.confirm("是否删除此需求?", {
                    btn: [ '删除', '取消' ]
                }, function (index) {
                    that.model.deleteItem().done(function (res) {
                        that.hide();
                    });
                    layer.close(index);
                }, null);
                return false;
            },
            
            splitItem: function () {
                Backbone.trigger('setModal',
                    this.model instanceof DemandPoolModel ?
                        SplitDemandPool(this.model) :
                        SplitDemandBusiness(this.model)
                );
            },

            getTemplateData: function() {
                var isEditable = this.isEditable();
                var jiraUrl = Global.defaults.jiraUrl;
                return $.extend({}, this.model.toJSON(), {isEditable: isEditable, jiraUrl: jiraUrl});
            },

            showEditor: function () {
                //initial editor
                if (this.isEditable()) {
                    this.$('.simditor').hide();
                    return;
                }

                this.$("#description-preview").hide();
                var conf = $.extend({}, Common.simditorDefaultConf, {
                    textarea: this.$("#description")
                });
                this.$description = new Simditor(conf);
            },

            isEditable: function () {
                return (this.model.get('reqState') === 2 && Global.isSprintRunning()) || this.model.get('reqState') === 3 || this.model.get('reqState') === 4;
            }
        };
        return $.extend(true, {}, defaultOpts, opt);
    };
});