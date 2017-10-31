define([
    "backbone",
    'text!templates/modal-version.html',
    'models/version',
    'common',
    'views/list',
    'jquery',
    'models/global',
    'collections/version'
], function (Backbone, versionDlg, versionModel, Common, stageView, $, Global, versionCollection) {

    return stageView.extend({

        className: 'stage-list-item versionTree',

        model: new Backbone.Model({
            id: 'version',
            name: "版本",
            sortableOpt: {
                disabled: true
            }
        }),

        tools: [{
            name: "plus",
            label: "创建版本"
        }],

        initialize: function () {
            this.initVars();
            this.initData(true);
            this.initDataListening();
            this.initView();
            this.initZtreeVersion();
        },

        initDataListening: function () {
            //隐藏多余DOM
            this.$taskList.addClass('ztree');
            this.$('span.name').siblings('span').hide();

            this.listenTo(Global, 'change:team', this.initZtreeVersion);
            Backbone
                .off("updateTreeNode")
                .on("updateTreeNode", this.updateTreeNode)
                .off("initZtreeVersion")
                .on("initZtreeVersion", this.initZtreeVersion.bind(this))
        },

        updateTreeNode: function (treeNode) {
            var treeObj = $.fn.zTree.getZTreeObj("version");
            treeObj.updateNode(treeNode);
        },

        setTreeBtn: function (treeId, treeNode) {
            return treeNode.state === 0 && treeNode.id > 0;
        },

        initZtreeVersion: function () {
            var that = this;
            var teamId = Global.get("team");
            if (!teamId) return;
            var setting = {
                data: {
                    simpleData: {
                        enable: true,
                        pIdKey: "parentId"
                    }
                },
                edit: {
                    enable: true,
                    showRemoveBtn: this.setTreeBtn,
                    showRenameBtn: this.setTreeBtn,
                    removeTitle: '删除',
                    renameTitle: '编辑'
                },
                callback: {
                    beforeRemove: this.beforeRemoveVer,
                    beforeEditName: this.beforeEditNameVer.bind(this),
                    beforeDrag: this.beforeDrag.bind(this),
                    onClick: this.selectVersion.bind(this),
                    beforeDrop: this.beforeDropVer.bind(this)
                },
                async: {
                    enable: true,
                    contentType: "application/json",
                    dataType: "json",
                    type: 'post',
                    url: 'version/getVersionListByParent.shtml',
                    autoParam: ["id=parentId"],
                    otherParam: {"state": 1, "teamId": teamId}
                }
            };
            var data = [
                {id: -1, parentId: 0, name: "未发布", state: 0, open: true, isParent: true},
                {id: -2, parentId: 0, name: "已发布", state: 1, open: false, isParent: true}];

            $.ajax({
                method: 'get',
                url: 'version/getVersionList.shtml',
                data: {teamId: teamId},
                dataType: "json",
                contentType: "application/json"
            })
                .success(function (resp) {
                    var zNodes = _.union(null, data);
                    var list = resp.waitReleaseVerList;
                    if (list && list.length !== 0) {
                        zNodes = _.union(zNodes, list);
                    }
                    $.each(zNodes, function (index, content) {
                        if (content.parentId && (content.parentId === 0 || content.parentId === -2) && content.isRelease === 0) content.parentId = -1;
                        if (content.parentId && (content.parentId === 0 || content.parentId === -1) && content.isRelease !== 0) content.parentId = -2;
                        if (content.id !== -2)
                            content.open = "true";
                        if (content.state !== 0 && content.id > 0) {//已发布的节点，改变icon
                            content.icon = rootPath + "/css/zTreeStyle/img/diy/3.png";
                        }
                    });
                    var treeObj = $.fn.zTree.init(that.$("#version"), setting, zNodes);
                    var currVer = Global.get("currVer");
                    if (currVer !== "" && currVer !== null) {
                        var currVerNode = JSON.parse(currVer);
                        var treeNode = treeObj.getNodeByParam("id", currVerNode.id, null);
                        if (treeNode && treeNode.id >= 0) {
                            treeObj.selectNode(treeNode);
                            Backbone.trigger('select.version', treeNode);
                            return;
                        }
                    }

                    var nodes = treeObj.getNodeByParam("parentId", -1, null);
                    if (!!nodes) {
                        treeObj.selectNode(nodes);
                        Backbone.trigger('select.version', nodes)
                    } else {
                        var rootNodes = treeObj.getNodeByParam("id", -1, null);
                        if (!!rootNodes) {
                            treeObj.selectNode(rootNodes);
                            treeObj.expandNode(rootNodes, true, true, true);
                        }
                        Backbone.trigger('select.version', rootNodes)
                    }
                })

                .fail(function () {
                    layer.msg("版本获取失败")
                })

        },


        /**
         * 创建版本
         */
        plus: function () {
            var treeObj = $.fn.zTree.getZTreeObj("version");
            var model = new versionModel();
            if (!treeObj) {
                layer.msg("版本树获取失败！");
                return;
            }
            var parentNode = treeObj.getNodeByParam("id", -1);
            // {id: -1, parentId: 0, name: '未发布', state: 0, open: true, isParent: true};
            model.set("parentId", parentNode.id);
            this.verPopModal(model, parentNode);
        },

        /**
         * 弹窗【创建版本】【编辑版本】
         * @param model 版本model
         * @param parentNode 版本的父节点信息
         */
        verPopModal: function (model, parentNode) {
            Backbone.trigger("setModal", {
                model: model,
                template: _.template(versionDlg),
                events: {
                    "click [role='update-version']": "saveVersion",
                    "click #parentVersionName": "zTreeToggleVersion"
                },

                initPlugins: function () {
                    flatpickr('#planStartDate', {
                        locale: "zh",
                        allowInput: true,
                        defaultDate: this.model.get("planStartDate") || ''
                    });

                    flatpickr('#planReleaseDate', {
                        locale: "zh",
                        allowInput: true,
                        defaultDate: this.model.get("planReleaseDate") || ''
                    });

                    flatpickr('#realReleaseDate', {
                        mode: "single",
                        locale: "zh",
                        allowInput: true,
                        closeOnSelect: true,
                        defaultDate: this.model.get("realReleaseDate") || ''
                    });
                    flatpickr('#planOnLineDate', {
                        mode: "single",
                        locale: "zh",
                        allowInput: true,
                        closeOnSelect: true,
                        defaultDate: this.model.get("onLineTime") || ''
                    });
                    flatpickr('#planLiftTestDate', {
                        mode: "single",
                        locale: "zh",
                        allowInput: true,
                        closeOnSelect: true,
                        defaultDate: this.model.get("liftTestTime") || ''
                    });
                    this.getPMSUsers(this.model.get("versionLiable"));
                    this.initZtreeParentVersion();
                },

                initZtreeParentVersion: function () {
                    var setting = {
                        data: {
                            key: {
                                name: "name",
                                checked: "isChecked"
                            },
                            simpleData: {
                                enable: true,
                                idKey: "id",
                                pIdKey: "parentId",
                                rootPId: -1
                            }
                        },
                        view: {
                            showIcon: false,
                            showLine: true
                        },
                        check: {
                            chkStyle: "radio",
                            enable: true,
                            autoCheckTrigger: true,
                            radioType: "all"
                        },
                        callback: {
                            onCheck: function (event, treeId, treeNode) {
                                $('#parentVersionList').hide();
                                var treeObj = $.fn.zTree.getZTreeObj(treeId);
                                if (treeNode.state !== 0) {
                                    layer.msg("不能在已发布版本下创建子版本！");
                                    treeObj.checkNode(treeNode, false, true);
                                    $("#parentVersionName").val('');
                                    return;
                                }
                                var chooseStr = treeNode.name;
                                $("#parentVersionName").val(chooseStr);
                                return false;
                            }
                        },
                        async: {
                            enable: true,
                            ataType: "json",
                            type: "get",
                            url: 'version/getVersionList.shtml'
                        }
                    };

                    versionCollection
                        .fetch()
                        .success(function (res) {
                            var rootNode = [{
                                id: -1,
                                parentId: 0,
                                name: "未发布",
                                state: 0,
                                open: true,
                                isParent: true
                            }];
                            var zNodes = _.union(null, rootNode, res.waitReleaseVerList);
                            var tree = $.fn.zTree.init($('#parentVersionList'), setting, zNodes);
                            tree.checkNode(tree.getNodeByParam("id", -1), true, true, true);
                        })
                },

                getPMSUsers: function (user) {
                    var that = this;
                    Backbone
                        .ajax({
                            method: 'GET',
                            url: 'verPublish/getPMSUsers.shtml',
                            dataType: "json"
                        })
                        .success(function (data) {
                            var arr = eval("(" + data + ")");
                            var i = 0;
                            var dataOpt = arr.users.map(function (item) {
                                return {
                                    id: item.id,
                                    text: item.realname + "(" + item.email + ")"
                                };
                            });
                            Global.set('versionLiable', dataOpt);
                            var $el = that.$('.versionLiable');
                            if (!$el.length) return;
                            $el.select2({data: dataOpt, placeholder: "请选择"});
                            if (user != '') {
                                $el.val(user).trigger("change");
                            }
                        })
                        .fail(function () {
                            layer.msg("获取PMS信息失败，请联系管理员！");
                        });
                },

                // 切换组件下拉列表的显示/隐藏
                zTreeToggleVersion: function () {
                    this.$('#parentVersionList').toggle();
                },

                saveVersion: function () {
                    var that = this;
                    var data = this.$('form').serializeJson();
                    data.teamId = Global.get("team");
                    var nodes = $.fn.zTree.getZTreeObj('parentVersionList') && $.fn.zTree.getZTreeObj('parentVersionList').getCheckedNodes() || [];
                    _.extend(parentNode, nodes[0]);
                    pid = parentNode.id;
                    data.parentId = pid;
                    if (!Common.validateVersionInfo(data)) return;
                    var saveURL = data.id == "" ? '/version/createVersion.shtml' : '/version/updateVersion.shtml';
                    $.ajax({
                        method: 'post',
                        data: JSON.stringify(data),
                        url: rootPath + saveURL,
                        dataType: "json",
                        contentType: "application/json"
                    })
                        .success(function (resp) {
                            if (resp[Common.SUCCESS]) {
                                that.$el.modal('hide');
                                // 新增版本时，同步创建对应版本的子版本节点
                                var treeObj = $.fn.zTree.getZTreeObj("version");
                                if (data.id == "") {
                                    var newNode = resp.versionFormMap;
                                    newNode = treeObj.addNodes(parentNode, newNode);

                                    Backbone.trigger("initZtreeVersion");
                                    treeObj.selectNode(newNode[0]);
                                    Backbone.trigger('select.version', newNode[0]);
                                } else {//修改时，更改版本树上对应节点的名称
                                    parentNode.parentId = resp.versionFormMap.parentId;
                                    parentNode.name = resp.versionFormMap.name;
                                    parentNode.state = resp.versionFormMap.state;
                                    parentNode.description = resp.versionFormMap.description;
                                    parentNode.planStartDate = resp.versionFormMap.planStartDate;
                                    parentNode.planReleaseDate = resp.versionFormMap.planReleaseDate;

                                    treeObj.updateNode(parentNode);
                                    treeObj.selectNode(parentNode);
                                    Backbone.trigger("initZtreeVersion");
                                    Backbone.trigger('select.version', parentNode);
                                }

                            } else {
                                layer.msg('版本创建失败，失败原因：' + resp[Common.MSG]);
                            }
                        })

                        .fail(function () {
                            layer.msg("保存失败")
                        })

                }
            })
        },

        beforeDrag: function (treeId, treeNodes) {
            for (var i = 0, l = treeNodes.length; i < l; i++) {
                if (treeNodes[i].drag === false || treeNodes[i].state !== 0) {
                    layer.msg("已发布版本不能调整版本级别！");
                    return false;
                }
            }
            return true;
        },

        beforeDropVer: function (treeId, treeNodes, targetNode, moveType) {
            var returnType = !(targetNode == null || (moveType != "inner" && !targetNode.parentId) );
            if (targetNode.isRelease != "0") {
                layer.msg("版本不能调整至已发布版本下");
                returnType = false;
            }
            if (returnType) {//可拖拽至目标节点
                if (moveType == "inner") {//成为子节点
                    treeNodes[0].parentId = targetNode.id;
                } else {//成为同级（上一个节点或下一个节点）
                    treeNodes[0].parentId = targetNode.parentId;
                }
                //更新节点的信息
                $.ajax({
                    method: 'post',
                    data: JSON.stringify(treeNodes[0]),
                    url: rootPath + '/version/updateVersion.shtml',
                    dataType: "json",
                    contentType: "application/json"
                })
                    .success(function (resp) {
                        if (resp[Common.SUCCESS]) {
                            //移动版本到目标版本对应的位置
                            var treeObj = $.fn.zTree.getZTreeObj(treeId);
                            treeObj.moveNode(targetNode, treeNodes[0], moveType);
                            treeObj.selectNode(treeNodes[0]);
                            Backbone.trigger('select.version', treeNodes[0]);
                        } else {
                            layer.msg('版本创建失败，失败原因：' + resp.errorMsg);
                        }
                    })

                    .fail(function () {
                        layer.msg("保存失败")
                    })

            }
            return false;
        },

        beforeRemoveVer: function (treeId, treeNode) {
            var treeObj = $.fn.zTree.getZTreeObj(treeId);
//        	treeObj.selectNode(treeNode);
            if (treeNode.level < 1 || treeNode.state !== 0) {
                layer.msg("不能删除该版本");
                return false;
            }
            if (treeNode.isParent) {
                layer.msg("该版本存在子版本，不能删除");
                return false;
            }
            $.ajax({
                method: 'get',
                url: rootPath + '/version/deleteVersion.shtml?id=' + treeNode.id,
                dataType: "json",
                contentType: "application/json"
            })
                .success(function (res) {
                    if (res[Common.SUCCESS]) {
                        treeObj.removeNode(treeNode);
                        var rootNodes = treeObj.getNodeByParam("id", -1, null);
                        treeObj.selectNode(rootNodes);
                    }
                    else layer.msg(res[Common.MSG])
                    return true;
                })

                .fail(function () {
                    layer.msg("版本删除失败")
                });
            return false;
        },

        beforeEditNameVer: function (treeId, treeNode) {
            var that = this;
            if (treeNode.state !== 0 || treeNode.id === -1) {
                layer.msg("该版本不能编辑！");
                return false;
            }
            Backbone.ajax({
                method: 'get',
                url: rootPath + '/version/getVersionDetail.shtml?id=' + treeNode.id,
                dataType: "json",

            })
                .success(function (data) {
                    if (data[Common.SUCCESS]) {
                        var model = new versionModel(data.versionFormMap);
                        that.verPopModal(model, treeNode);
                    } else {
                        layer.msg("获取版本信息失败！失败原因:" + data.errorMsg);

                    }
                })

                .fail(function () {
                    layer.msg("编辑失败")
                });

            return false;
        },

        trash: function () {
            var treeObj = $.fn.zTree.getZTreeObj("version");
            var nodes = treeObj.getSelectedNodes();
            if (nodes.length == 0) return;
            treeObj.removeNode(nodes[0], true);
        },

        selectVersion: function (event, treeId, treeNode) {
            Backbone.trigger('select.version', treeNode)
        }
    })


});