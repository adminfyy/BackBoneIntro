/**
 * Created by fuyy on 2017/4/5.
 */
define([
        'backbone',
        'jquery',
        'text!templates/lane-item-task.html',
        'text!templates/modal-task.html',
        'collections/team-member',
        'common',
        'models/global',
        'views/list-ac',
        'utils'
    ],
    function (Backbone, $, Template, DetailTemplate, MemberCollection, Common, Global, acView, utils) {

        return Backbone.View.extend({

            tagName: "li",
            className: "task-list-item",

            template: _.template(Template),

            events: {
                "click": "getModelDetail",
                "click [role='delete']": "deleteTask",
                "laneChange": "laneChange"
            },

            initialize: function () {
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.model, 'destroy', this.remove);
            },

            //查看详情
            getModelDetail: function () {
                Backbone.ajax({
                    url: rootPath + '/task/getTaskInfo.shtml',
                    data: {
                        taskId: this.model.get('id')
                    },
                    dataType: 'json'
                }).success(this.viewDetail.bind(this));
            },

            viewDetail: function (data) {
                this.model.set(data);
                // Backbone.trigger("setTemplate", "MODALTASK");
                // Backbone.trigger("transferDataToModal", this.model);


                var modalOpts = {
                    template: _.template(DetailTemplate),

                    events: {
                        'click [role=\'save-task\']': 'saveTask',
                        'change [name=\'estimatedTime\']': 'absoluteNumber'
                    },

                    initPlugins: function () {
                        //阻碍项目
                        if ((data = this.model.get("blockList"))) {
                            function adapterData(item) {
                                item.is_check = item.isRemove;
                                item.name = item.content;
                                return item;
                            }

                            data.map(adapterData);
                            this.blockList = new Backbone.Collection(data);
                            new acView({collection: this.blockList, el: this.$('.blockList')});
                        }


                        //执行者
                        $el = this.$('#taskPartyList');
                        if ($el.length) {
                            var data = MemberCollection.getSelect2Data();
                            $el.select2({data: data});
                            val = this.model.get("taskPartyList").map(function (item) {
                                return item.userId;
                            });
                            $el.val(val).trigger('change');
                        }
                        //任务类型
                        this.$("input[name='taskType'][value='" + this.model.get("taskType") + "']").attr("checked", true);
                    },

                    model: this.model,

                    getFormTaskData: function () {
                        var data = this.$('form').serializeJson();

                        function partyMapper(el) {
                            return {
                                userId: el,
                                smTaskId: data.id
                            };
                        }

                        data.taskPartyList = utils.getMultipleSelectValue(data.taskPartyList).map(partyMapper);
                        data.party = this.$('#taskPartyList > option:selected').toArray().map(function (el) {
                            return $(el).text();
                        }).join(',');
                        data.isBug = Number(data.isBug || 0);
                        data.taskType = Number(data.taskType || 0);

                        function reformatBlock(el) {
                            var elJson = el.toJSON && el.toJSON() || el;
                            elJson.isRemove = elJson.is_check;
                            // busId 是任务ID
                            elJson.busId = data.id;
                            elJson.content = elJson.name;
                            var pickOpt = ["id", "content", "busId", "isRemove"];
                            var newOne = _.pick(elJson, pickOpt);
                            return newOne;
                        }

                        function isValidBlock(block) {
                            return !block.isRemove;
                        }

                        var blockList = this.blockList.map(reformatBlock);
                        data.addBlockList = blockList.filter(function (el) {
                            return !el.id;
                        });
                        data.editBlockList = blockList.filter(function (el) {
                            return el.id;
                        });
                        // modes' blockList 与 this.blockList 进行对比
                        data.delBlockList = this.model.get('blockList').map(reformatBlock).filter(function (item) {
                            var exist = false;
                            blockList.filter(function (el) {
                                if (el.id == item.id) exist = true;
                            });
                            return !exist;
                        });
                        data.blockNum = blockList.filter(isValidBlock).length;
                        return data;
                    },

                    //绝对值
                    absoluteNumber: function () {
                        var $el = this.$('[name="estimatedTime"]');
                        $el.val(Math.abs($el.val()));
                    },

                    //保存任务按钮
                    saveTask: function () {
                        var data = this.getFormTaskData();
                        Backbone.ajax({
                            url: rootPath + "/task/editTaskInfo.shtml",
                            method: 'post',
                            data: JSON.stringify(data),
                            dataType: "json",
                            contentType: "application/json"
                        })
                            .success(function (res) {
                                if (res === 'success') {
                                    this.model.set(data);
                                    this.$el.modal('hide');
                                } else {
                                    layer.msg('保存失败');
                                }
                            }.bind(this));
                    }
                };

                Backbone.trigger("setModal", modalOpts);
            },

            render: function () {
                this.$el.html(this.template(this.model.toJSON()));
                //for dom access
                this.$el.data("model", this.model);
                return this;
            },

            laneChange: function (event, option) {
                var that = this;
                var taskId = this.model.id;
                $
                    .ajax({
                        url: rootPath + "/task/dragTaskInfo.shtml",
                        data: {
                            taskId: this.model.id,
                            "swimlaneId": option.columnId
                        },
                        dataType: 'json'
                    })
                    .success(function (res) {
                        if (res['fail']) {
                            layer.msg(res['fail'] || '拖拽失败');
                            option.sender.sortable('cancel');
                            return;
                        }

                        if (!res['success']) {
                            layer.msg(res['msg']);
                            option.sender.sortable('cancel');
                            return;
                        }

                        //拖动到测试done 刷新隔壁的列表
                        var targetColumnSelector = ".list-header[column-id='{cid}']"
                            .replace("{cid}", option.columnId);

                        //将原来的model移动到现在的collection中
                        var model = that.model.collection.remove(that.model);
                        Backbone.$(targetColumnSelector).trigger('addOneModel', model);

                        if (option.isReceiverDone || option.isSenderDone) {
                            Backbone.$('.list-header[column-id]').each(function () {
                                var $this = $(this);
                                if ($this.attr('column-type') != Common.LANE.TASK) {
                                    $this.trigger('refresh');
                                }
                            });
                        }
                    })
                    .fail(function () {
                        layer.msg('拖拽失败');
                        option.sender.sortable('cancel');
                    });
            },

            deleteTask: function () {
                if (Global.isSprintClose()) {
                    //layer.msg("迭代已关闭，不可删除任务！");
                    return;
                }

                function deleteAjax(yes) {
                    if (yes)
                        Backbone.ajax({
                            url: rootPath + "/task/deleteTaskInfo.shtml",
                            data: {
                                taskId: this.model.id
                            }
                        }).success(function () {
                            this.clear();
                        }.bind(this));

                    layer.close(yes);
                }

                layer.confirm("是否要删除该任务?", deleteAjax.bind(this));
                return false;
            },

            clear: function () {
                this.$el.next().show();
                var model = this.model;
                model.stopListening();
                model.trigger('destroy', model, model.collection, null);
            }
        });

    });