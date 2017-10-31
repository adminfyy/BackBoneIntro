/**
 * Created by fuyy on 2017/3/31.
 */
define([
        'backbone',
        'views/lane-block',
        'collections/sprint',
        'collections/task',
        'models/global',
        'common',
        'text!templates/header.html',
        'text!templates/modal-column.html',
        'models/product',
        'views/popover/menus'
    ],
    function (Backbone, LaneBlockView, Sprint, TaskCollectionContructor,
              Global, Common, template, columnTemplate, ProductModel, popoverView) {

        var View = Backbone.View.extend({

            tagName: 'li',
            className: 'list-header',
            template: _.template(template),
            events: {
                "refresh": "refresh",
                "addOneModel": "addOneModel",
                'remove': "_remove"
            },

            initialize: function () {
                this.initVars();
                this.initData();
                this.initDataListening();
                this.initView();
                this.loadData();
            },

            initVars: function () {
                this.$el.html(this.template($.extend(this.model.toJSON(), {collectionLength: this.collection && this.collection.length || 0})));
                this.$tools = this.$('.tools');
                return this;
            },

            initTools: function () {
                var that = this;
                //渲染工具栏的视图
                this.$tools.html(this.getToolHtml());
                //绑定工具栏函数
                this.$tools
                    .children()
                    .each(function () {
                        var $el = $(this);
                        var roleName = $el.attr("action"),
                            funcName = $.camelCase(roleName);
                        if (that[funcName]) {
                            $el.on('click', that[funcName].bind(that, $el));
                        }
                    })
            },

            initView: function () {
                var that = this;
                this.$el.attr('column-id', this.model.id);
                this.$el.attr('column-type', this.model.get('type'));

                this.initTools();

                //拓展菜单
                new popoverView({
                    //same as popover options
                    el: this.$tools.find('[action="triangle-bottom"]'),
                    trigger: 'focus',
                    placement: 'bottom',
                    container: '.agile',
                    items: this.getMenuItems()
                })

            },

            //初始化数据
            initData: function (query) {
                var columnType = this.model.get("type");
                switch (Number(columnType)) {
                    case Common.LANE.DEMAND:
                        this.collection = Sprint;
                        break;
                    case Common.LANE.TASK:
                        this.collection = new TaskCollectionContructor()
                        this.collection.url = rootPath + "/task/getTaskList.shtml?" + "swimlaneId=" + this.model.get('id');
                        break;
                    case Common.LANE.TEST:
                    case Common.LANE.VALIDATE:
                        this.collection = new Backbone.Collection()
                        this.collection.model = ProductModel;
                        this.collection.url = rootPath + "/productReq/getBoardSwimlaneReq.shtml?"
                            + "&boardSwimlaneId=" + this.model.get('id');
                        break;
                    default:
                        this.collection = Sprint;
                        break;
                }
            },

            initDataListening: function () {
                this.listenTo(this.collection, 'reset', this.addAll);
                this.listenTo(this.collection, 'all', this.updateCollectionCount);
                this.listenTo(this.model, 'change', this.modelChange);
                this.listenTo(this.model, 'destroy', this.removeHeader);
            },

            updateCollectionCount: function () {
                this.$('#collectionCount').text(this.collection.length);
            },

            loadData: function () {
                if (this.collection === Sprint) {
                    this.collection.trigger('reset');
                    return;
                }
                this.refresh();
            },

            refresh: function () {
                if (this.collection.refresh) {
                    this.collection.refresh()
                } else {
                    this.collection.fetch({
                        reset: true,
                        data: this.getQuery()
                    });
                }
            },

            getQuery: function () {
                return {
                    teamId: Global.get('team')
                }
            },

            addAll: function () {
                Backbone.$("[row-id] [column-id='{cid}']".replace("{cid}", this.model.id)).empty();
                var rows = this.collection.groupBy('id'),
                    sprintRows = Sprint.groupBy('id');

                if (this.model.get('type') != Common.LANE.DEMAND) {
                    rows = this.collection.groupBy('smReqId');
                    var realRows = {}
                    _.each(sprintRows, function (value, rowIndex) {
                        //确保每行每列的均初始化
                        realRows[rowIndex] = rows[rowIndex] || []
                    })
                    rows = realRows;
                }
                _.each(rows, this.addOne, this);
            },

            addOne: function (value, key) {
                var selector = '[row-id="{rid}"] [column-id="{cid}"]';
                selector = selector.replace('{rid}', key)
                selector = selector.replace('{cid}', this.model.id);

                Backbone.$(selector).off();
                new LaneBlockView({
                    el: selector,
                    model: value,
                    rowId: key,
                    columnId: this.model.id,
                    type: this.model.get("type"),
                    state: this.model.get('state'),
                    pos: this.model.get('pos'),
                    isDone: this.model.get('IsDone'),
                    collection: this.collection
                }).render();
            },

            //收缩任务列表
            stepBackward: function ($el) {
                var laneType = this.model.get('type'),
                    target;
                if (laneType === Common.LANE.DEMAND) target = {
                    type: Common.LANE.TASK
                }

                if (laneType === Common.LANE.TEST) target = {
                    type: Common.LANE.TEST,
                    IsDone: 0
                }

                var targets = this.model.collection
                    .where(target)
                    .forEach(function (model) {
                        model.set("hide", true)
                    })

                $el.hide();
                $el.prev().fadeIn();
            },

            //展开任务列表
            stepForward: function ($el) {
                var laneType = this.model.get('type'),
                    target;
                if (laneType === Common.LANE.DEMAND) target = Common.LANE.TASK
                if (laneType === Common.LANE.TEST) target = Common.LANE.TEST

                var targets = this.model.collection.where({
                    type: target
                }).forEach(function (model) {
                    model.set("hide", false)
                })

                $el.hide();
                //show
                $el.next().fadeIn();
            },

            //列控制
            modelChange: function (model) {
                var selector = "[column-id={cid}]".replace("{cid}", this.model.id);
                if (model.hasChanged("hide")) {
                    model.get("hide") ?
                        Backbone.$(selector).fadeOut() :
                        Backbone.$(selector).fadeIn();
                } else {
                    this.initVars();
                    this.initView();
                }
            },

            addOneModel: function (e, model) {
                this.collection.push(model)
            },


            getMenuItems: function () {
                var items = [];
                var type = this.model.get('type'),
                    isDone = this.model.get('IsDone'),
                    isEdit = this.model.get('IsEdit');
                items.push({
                    name: 'action1',
                    label: '<span class="glyphicon glyphicon-pencil">编辑列表</span>',
                    handle: this.editHeader.bind(this)
                })

                if (isEdit) {
                items.push({
                        name: 'action2',
                        label: '<span class="glyphicon glyphicon-trash">删除列表</span>',
                        handle: this.model.destroy.bind(this.model)
                    })
                }

                if ((type === Common.LANE.TASK || type === Common.LANE.TEST) && !isDone) {
                    items.push({
                        name: 'action3',
                        label: '<span class="glyphicon glyphicon-plus">向右添加列表</span>',
                        handle: this.addHeader.bind(this)
                    })
                }

                !items.length && items.push({
                    name: 'empty',
                    label: '空空如也',
                    handle: function () {
                    }
                })

                return items
            },

            _remove: function () {
                this.stopListening();
            },

            //在右侧添加列表
            addHeader: function () {
                var nextHeaderModel = this.model.clone(),
                    thatModel = this.model,
                    that = this;
                nextHeaderModel.set({
                    id: null,
                    IsEdit: 1,
                    dod: ''
                })

                Backbone.trigger("setModal", {
                    model: nextHeaderModel,
                    template: _.template(columnTemplate),
                    events: {
                        "click [role='save']": "saveLane"
                    },
                    initPlugins: function () {
                    },
                    saveLane: function () {
                        var data = this.$('form').serializeJson();
                        var self = this;
                        var isTooMuchSameColumns = that.model.collection.where({
                            type: that.model.get('type')
                        }).length > 11

                        if (isTooMuchSameColumns) {
                            layer.msg('太多列啦')
                            return;
                        }

                        this.model.save(data)
                            .done(function (res) {
                                if (res['success']) {
                                    self.$el.modal('hide');

                                    //添加model到laneCollection中
                                    thatModel.collection.push(self.model);

                                    // 添加列表视图
                                    var $column = Backbone.$('<ul></ul>');
                                    $column.attr('column-id', self.model.id);

                                    var thatColumnSelector = '[row-id] [column-id={cid}]'.replace('{cid}', that.model.get('id'))
                                    Backbone.$(thatColumnSelector).after($column);
                                    that.$el.after(new View({model: self.model}).render().$el);
                                } else {
                                    layer.msg(res['msg'] || '编辑失败');
                                }
                            })
                    }
                })
            },

            // 编辑列表
            editHeader: function () {
                Backbone.trigger("setModal", {
                    model: this.model,
                    template: _.template(columnTemplate),
                    events: {
                        "click [role='save']": "saveLane"
                    },
                    initPlugins: function () {
                    },
                    saveLane: function () {
                        var data = this.$('form').serializeJson();
                        var self = this;
                        this.model.save(data)
                            .done(function (res) {
                                if (res['success']) {
                                    self.$el.modal('hide')
                                } else {
                                    layer.msg('编辑失败.')
                                }
                            })
                    }
                })
            },

            //删除列表
            removeHeader: function () {
                Backbone.$("ul[column-id='" + this.model.id + "']").remove();
                this.remove();
            },

            getTools: function () {
                var laneType = this.model.get("type"),
                    isDone = this.model.get('IsDone'),
                    isEdit = this.model.get('IsEdit'),
                    isFirst = this.model.get('pos') === 10
                toolsCollapse = [{
                    name: "step-forward",
                    label: "点击展开任务列表",
                    hide: true
                }, {
                    name: "step-backward",
                    label: "点击收缩任务列表"
                }],
                    tools = [];

                if (laneType === Common.LANE.DEMAND || laneType === Common.LANE.TEST && isDone) {
                    tools = toolsCollapse;
                }

                //除了第一列 每列都有菜单
                if (!isFirst) {
                    tools.push({
                        name: 'triangle-bottom',
                        label: '菜单'
                    })
                }
                return tools;
            },

            getToolHtml: function () {
                var html = "";
                var tools = this.getTools();
                var template = _.template('<a  tabindex="0" class="glyphicon glyphicon-<%= name %>" role="button" action="<%= name %>" title="<%= label %>" <% if(typeof hide !== "undefined")print("style=\'display:none\'") %>></a>');
                var tool;

                for (var i in tools) {
                    tool = tools[i]
                    html += template(tool);
                }

                return html
            }

        });

        return View;
    });