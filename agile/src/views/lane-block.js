/**
 * Created by fuyy on 2017/4/5.
 */
define([
        'backbone',
        'jquery',
        'common',
        'views/lane-block-item',
        'views/lane-block-item-task',
        'text!templates/lane.html',
        'collections/team-member',
        'models/global',
        'collections/sprint',
        'models/task'
    ],
    function (Backbone, $, Common, DevCard, DevTaskCard, Template, TeamMember, Global, Sprint, TaskModel) {
        
        return Backbone.View.extend({
            
            creatorTemplate: _.template(Template),
            
            events: {
                'click .creator-handler': 'showCreator',
                'click .create-task': 'createTask',
                'click .create-cancel': 'hideCreator',
                'change [name="estimatedTime"]': 'absoluteNumber'
            },
            
            initialize: function (options) {
                this.columnType = options.type;
                this.columnId = options.columnId;
                this.rowId = options.rowId;
                this.state = options.state;
                this.pos = Number(options.pos);
                this.isDone = options.isDone;
                
                switch (options.type) {
                    case Common.LANE.TASK:
                        this.carView = DevTaskCard;
                        break;
                    case Common.LANE.DEMAND:
                    default:
                        this.carView = DevCard;
                        break;
                }
                
                
                var siblingsSelector = '[row-id="{rid}"] [column-id] [role="list"]';
                var selector = siblingsSelector.replace('{rid}', this.rowId);
                
                this.$main = $('<div class="main"></div>');
                this.$list = $('<ul role="list"></ul>');
                this.$footer = $('<footer role="footer"></footer>');
                this.$main.append(this.$list);
                this.$main.append(this.$footer);
                
                this.$aside = $('<aside role="aside"></aside>');
                
                this.$el.append(this.$main);
                this.$el.append(this.$aside);
                
                this.$list.sortable({
                    items: ".task-list-item",
                    placeholder: "task-list-item-placeholder",
                    connectWith: selector,
                    scrollSensitivity: 30,
                    scrollSpeed: 60,
                    forcePlaceholderSize: true
                });
                
                this.$list.on("sortreceive", this.receiveSortable.bind(this));
                this.$list.on("sortremove", this.removeSortable.bind(this));
                this.$list.on("sortupdate", this.updateSortable.bind(this));
                
                this.$el.attr('column-type', this.columnType);
                this.$el.attr('column-is-done', this.isDone);
            },
            
            forbidDrag: function () {
                if (!Global.isSprintRunning()) {
                    layer.msg("迭代尚未开始，不可拖动！");
                }
            },
            
            addAll: function () {
                this.$list.empty();
                _.each(this.model, this.addOne, this);
                return this;
            },
            
            addOne: function (model) {
                var View = new this.carView({model: model, columnId: this.columnId}).render().$el;
                this.$list.append(View);
            },
            
            render: function () {
                this.addAll()
                    .addTools()
                    .addCreator()
                    .delegateEvents()
                    .collapseMyChild();
                
                //避免请求未响应 导致下拉选项为空
                // this.listenToOnce(TeamMember, 'reset', this.setCreatorData);
                return this;
            },
            
            addCreator: function () {
                if (this.pos !== 20) return this;
                this.$footer.append(this.creatorTemplate());
                return this;
            },
            
            setCreatorData: function () {
                //若已初始化过
                if (this.$('#taskPartyList').data('select2') != null) {
                    return;
                }
                var data = TeamMember.getSelect2Data();
                //
                this.$('#taskPartyList').select2({
                    data: data,
                    width: '100%',
                    placeholder: "请选择执行者",
                    theme: 'bootstrap'
                });
                //任务类型
                this.$("input[name='taskType'][value='0']").attr("checked", true);
            },
            
            showCreator: function () {
            	if (Global.isSprintClose()) {
                    //layer.msg("迭代已关闭，不可创建任务！");
                    return;
                }
                this.$('.creator-handler').slideUp(null, null, function () {
                    this.$('.creator').slideDown({
                        complete: function () {
                            this.setCreatorData();
                            this.$('[name="title"]').focus();
                        }.bind(this)
                    });
                }.bind(this));
                return false;
            },
            
            hideCreator: function () {
                this.$('.creator').slideUp(null, null, function () {
                    this.$('.creator-handler').slideDown();
                }.bind(this));
                this.clearFormData();
                return false;
            },
            
            getFormData: function () {
                var data = this.$('form').serializeJson();
                data.teamId = Global.get('team');
                data.taskPartyList = _.flatten([ data.taskPartyList ])
                    .filter(function (item) {
                        return !!item;
                    })
                    .map(function (item) {
                        return {
                            userId: item,
                            smTaskId: ""
                        };
                    });
                
                data.smReqId = this.rowId;
                data.state = this.state;
                data.swimlaneId = this.columnId;
                return data;
            },
            
            clearFormData: function () {
                this.$('form').find('[name]').not(":radio").each(function (el) {
                    var $el = $(this);
                    $el.val("");
                    $el.trigger('change');
                });
                //任务类型
                $("input[name='taskType']").get(0).checked = true;
                $("input[name='estimatedTime']").val(""); //估算时间默认不填
            },
            
            createTask: function (e) {
                e.preventDefault();
                e.stopPropagation();
                
                var data = this.getFormData();
                
                if (!data.title) {
                    layer.msg("请输入标题");
                    return false;
                }
                if (!data.taskType) {
                    layer.msg("请选择任务类型");
                    return false;
                }
                if (!data.estimatedTime) {
                    data.estimatedTime = '0';//前台没有输入估算时间时，默认传0到后台
                }
                
                this.clearFormData();
                
                
                $.ajax({
                    url: rootPath + "/task/saveTaskInfo.shtml",
                    method: "post",
                    type: 'json',
                    contentType: "application/json",
                    dataType: 'json',
                    data: JSON.stringify(data)
                }).success(
                    function (data) {
                        if (!data[ Common.SUCCESS ]) {
                            layer.msg('创建任务失败');
                            return;
                        }
                        this.hideCreator();
                        
                        this.addOne(this.collection.push(new TaskModel(data.taskInfo)));
                        //若列表中存在隐藏的项目
                        //则显示切换显示
                        this.expand();
                        
                        //更新 需求就绪中的需求状态
                        //可能由测试中变为需求就绪
                        
                        Sprint.get(this.rowId).fetch({
                            data: {
                                productReqId: this.rowId
                            }
                        });
                        
                        //更新后侧的测试到验收中需求
//                        Backbone.$('.list-header[column-id]').each(function () {
//                            var $this = $(this);
//                            var thisColumnType = $this.attr('column-type');
//                            if (thisColumnType != Common.LANE.TASK) {
//                                $this.trigger('refresh');
//                            }
//                        });
                        
                    }.bind(this)
                );
                return false;
            },
            
            receiveSortable: function (event, ui) {
                var senderType = Number(ui.sender.closest('[column-type]').attr('column-type'));
                var isSenderDone = Number(ui.sender.closest('[column-is-done]').attr('column-is-done'));
                var receiverType = Number(this.columnType);
                var isReceiverDone = Number(this.isDone);
                var model;
                //比较reciverType 注意columnType 默认为String 类型
                
                // 接受方为任务列可能出现的情况
                if (receiverType === Common.LANE.TASK) {
                    if (senderType === Common.LANE.TASK) {
                        ui.item.trigger('laneChange', {
                            columnId: this.columnId,
                            columnType: this.columnType,
                            sender: ui.sender,
                            
                            //是否为完成列
                            isSenderDone: isSenderDone,
                            isReceiverDone: isReceiverDone
                        });
                    } else if (senderType === Common.LANE.DEMAND && this.pos === 20) {
                        model = ui.item.data('model');
                        this.$('[name="title"]').val(model.get("subject"));
                        // this.$('[name="description"]').val(model.get("description"));
                        ui.sender.sortable('cancel');
                        this.showCreator();
                        
                    } else {
                        layer.msg("错误，需求不能拉到此");
                        ui.sender.sortable('cancel');
                    }
                    
                    // 接受方非任务列
                } else {
                    if (senderType === Common.LANE.TASK) {
                        ui.sender.sortable('cancel');
                        layer.msg("错误，任务不能拉到此");
                    }
                    model = Backbone.$(ui.item).data('model');
                    
                    //已经进入测试的需求  状态则置灰不允许拖动
                    var untouchableCondition = ui.item.hasClass('reqDarkColor');
                    if (untouchableCondition) {
                        layer.msg("该需求不能拉动！");
                        ui.sender.sortable('cancel');
                        
                        
                    } else {
                        var Option = {
                            "columnId": this.columnId,
                            "senderType": senderType,
                            "columnType": this.columnType,
                            "Sender": ui.sender.closest('[column-type]'),
                            isReceiverDone: isReceiverDone,
                            "Receiver": this.$el
                        };
                        // if (this.columnType == Common.LANE.DEMAND) Option["columnId"] = -1;
                        ui.item.trigger('ReqlaneChange', Option);
                    }
                    
                }
            },
            
            updateSortable: function () {
            
            },
            
            removeSortable: function (event, ui) {
                this.$('li:first-child').show();
            },
            
            addTools: function () {
                if (this.columnType !== Common.LANE.DEMAND) return this;
                //伸展按钮
                this.$collapse = $('<span class="fa fa-angle-double-down fa-2" role="collapse"></span>');
                this.$collapse.on("click", this.toggle.bind(this));
                this.$aside.append(this.$collapse);
                return this;
            },
            
            collapseMyChild: function () {
                var selector = '[row-id="{rid}"]'.replace("{rid}", this.rowId);
                $(selector).addClass('collapse-row');
            },
            
            toggle: function () {
                if (this.$collapse.hasClass('isExpand')) {
                    this.$collapse.removeClass('isExpand');
                    this.collapse();
                } else {
                    this.$collapse.addClass('isExpand');
                    this.expand();
                }
            },
            
            //泳道收缩
            collapse: function () {
                var selector = '[row-id="{rid}"]'.replace("{rid}", this.rowId);
                $(selector).addClass('collapse-row');
            },
            
            // 泳道展开
            expand: function () {
                var selector = '[row-id="{rid}"]'.replace("{rid}", this.rowId);
                $(selector).removeClass('collapse-row');
            },
            
            absoluteNumber: function () {
                var $el = this.$('[name="estimatedTime"]');
                $el.val(Math.abs($el.val()));
            }
        });
    });