/**
 * Created by fuyy on 2017/4/5.
 * 产品详情页面/ View层逻辑抽象
 */
define([
    'text!templates/modal-team.html',
    'collections/user',
    'collections/org',
    'collections/component',
    'collections/template',
    'common',
    'collections/team',
    'models/global',
    'models/team',
    "collections/all-component"
], function (t, UserCollection, OrgCollection, ComponentCollection, TemplateCollection, Common,
             TeamCollection, Global, TeamModel, allComponent) {
    var defaultOpt = {

        template: _.template(t),

        events: {
            "click [role='submit']": 'saveTeam',
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
                selectedMulti: true,
                showIcon: false,
                showLine: true
            },
            check: {
                chkboxType: {"Y": "s", "N": "s"},
                chkStyle: "checkbox",
                enable: true,
                autoCheckTrigger: true
            },
            async: {
                enable: true,
                dataType: "json",
                type: "get",
                url: 'component/getAllComList.shtml'
            }
        },

        initPlugins: function () {
            function findUserById(id) {
                id = Number(id);
                var user = UserCollection.get(id);
                user = user.toJSON();
                user.text = user['userName'] + "(" + user['accountName'] + ")";
                user.selected = true;
                return user;
            }

            //组件初始化
            this.initPluginComponent();
            var that = this,
                options = [{
                    name: 'smIdList',
                    defaultValue: that.model.get('smIdList').map(findUserById),
                    placeholder: "请输入用户姓名",
                    select2Opts: Common.USER_AJAX_OPT
                }, {
                    name: 'poIdList',
                    defaultValue: that.model.get('poIdList').map(findUserById),
                    placeholder: "请输入用户姓名",
                    select2Opts: Common.USER_AJAX_OPT
                }, {
                    name: 'memberIdList',
                    defaultValue: that.model.get('memberIdList').map(findUserById),
                    placeholder: "请输入用户姓名",
                    select2Opts: Common.USER_AJAX_OPT
                }, {
                    name: 'orgId',
                    defaultValue: that.model.get('orgId'),
                    select2Opts: {
                        data: OrgCollection.getSelect2Data()
                    }
                }, {
                    name: 'templateId',
                    defaultValue: that.model.get('templateId'),
                    select2Opts: {
                        data: TemplateCollection.getSelect2Data()
                    }
                }];

            options.forEach(function (opt) {
                var $el = that.$('#' + opt.name);
                var defaultSelectOpt = {
                    theme: 'bootstrap',
                    width: '100%',
                    placeholder: opt.placeholder || '请选择',
                    language: 'zh-CN',
                    allowClear: true
                };

                $el.select2($.extend({}, opt.select2Opts, defaultSelectOpt));

                if (opt.defaultValue.forEach)
                    opt.defaultValue.forEach(function (i) {
                        var $opt = $('<option></option>');
                        $opt.text(i.text);
                        $opt.val(i.id);
                        if (i.selected) $opt.prop('selected', true);
                        $el.append($opt);
                    });
                else
                    $el.val(opt.defaultValue);

                $el.trigger('change');

            });
        },

        //初始化组件
        initPluginComponent: function () {
            var self = this;
            allComponent.fetch()
                .success(function (res) {
                    $.fn.zTree.init($('#componentName'), self.setting, allComponent.getZtreeData());
                    // 根据comId勾选ztree节点
                    var treeObj = $.fn.zTree.getZTreeObj('componentName');
                    var comIdList = self.model.toJSON().component || [];
                    comIdList.forEach(function (e) {
                        var node = treeObj.getNodeByParam('comId', e);
                        if (node) treeObj.checkNode(node, true, false);
                    });
                })
        },

        // 切换组件下拉列表的显示/隐藏
        zTreeToggle: function () {
            $('#componentName').toggle();
        },

        saveTeam: function () {
            var that = this;
            var data = this.$('form').serializeJson();
            var isNew = this.model.isNew();
            var getCheckedNodes = $.fn.zTree.getZTreeObj('componentName').getCheckedNodes(true) || [];
            var component = $.map(getCheckedNodes, function (n) {
                return n.comId;
            });

            var componentName = $.map(getCheckedNodes, function (n) {
                return n.name;
            });

            this.model.set('component', component);
            this.model.set('componentName', componentName);
            data.smIdList = this.makeValidArray(data.smIdList);
            data.poIdList = this.makeValidArray(data.poIdList);
            data.memberIdList = this.makeValidArray(data.memberIdList);
            data.component = this.model.get('component');
            data.componentName = this.model.get('componentName');
            data.orgId = '';

            var isValid = this.isValid(data);
            if (!isValid) return;

            this.model
                .save(data)
                .success(function (res) {
                    if (res[Common.SUCCESS]) {
                        if (isNew) {
                            TeamCollection.add(that.model);
                        }
                        //若团队信息变化则触发team的改变
                        if (that.model.id == Global.get('team')) Global.trigger('change:team');
                        that.$el.modal('hide');
                    }
                })
                .error(function (err) {
                    layer.msg('操作失败', err);
                });
        },

        isValid: function (data) {
            if (data.teamName.trim().length < 1) {
                layer.msg('请填写团队姓名');
                return false;
            }

            if (!data.component.length) {
                layer.msg('请选择所属组件');
                return false;
            }

            // if (!data.orgId) {
            //     layer.msg('请选择部门');
            //     return false;
            // }

            if (!data.templateId) {
                layer.msg('请选择模板');
                return false;
            }

            return true;
        },

        //返回一个有效的1维数组
        makeValidArray: function (array) {
            return _.flatten([array ? array : []]);
        }
    };

    return function (model) {
        defaultOpt.model = model;
        return defaultOpt;
    };
});