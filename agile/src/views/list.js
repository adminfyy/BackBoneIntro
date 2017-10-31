/**
 * Created by fuyy on 2017/3/31.
 * 列表
 *
 * tools:  右上角使用的glyphicon 图表列表
 * popover: 排序按钮 弹出来的小窗体 使用bootstrap的  popover js插件
 *
 */
define([
        'backbone',
        'jquery',
        'text!templates/stage.html',
        'common',
        'collections/task',
        'views/list-item',
        'models/global',
        'views/loading/loadingIndicator',
        'views/popover/menus'
    ],
    function (Backbone, $, stageTemplate, Common, Tasks, TaskView, Global, LoadingView, popoverView) {

        return Backbone.View.extend({

            collection: Tasks,

            tagName: 'li',

            className: 'stage-list-item',

            template: _.template(stageTemplate),

            events: {
                //作为一个子节点被清除的时候调用clear去除监听
                'remove': 'clear'
            },

            //排序选项
            popover: [],

            //右上角图标列表
            tools: [],

            initialize: function () {
                this.initVars();
                this.initDataListening();
                this.initData(true);
                this.initView();
            },

            initVars: function () {
                // initilize the private vars
                this.$el.html(this.template($.extend(this.model.toJSON(), {collectionLength: this.collection.length})));
                this.$el.addClass(this.model.get('id'));
                if (this.model.get('hidden')) this.$el.hide();
                this.$taskList = this.$('.task-list');
                this.$tools = this.$('.tools');
            },

            initData: function () {
            },

            initDataListening: function () {
                this.listenTo(this.collection, 'add', this.addOne);
                this.listenTo(this.collection, 'reset', this.addAll);
                this.listenTo(this.collection, 'all', this.updateCollectionCount);
                this.listenTo(this.collection, 'requesting', this.waitingForResp);
                this.listenTo(this.model, 'change', this.toggleVisible);
            },
            toggleVisible: function () {
                var hide = this.model.get('hidden');
                if (hide) {
                    this.$el.hide();
                } else {
                    this.$el.show();
                }
            },

            initView: function () {//initilze jquery plugins
                var sortOption = this.model.get("sortableOpt");
                typeof sortOption === 'string' ? sortOption = Common.defaultSortOpt[sortOption || "default"] : (null);
                var that = this;

                if (this.$taskList) {
                    this.$taskList.hide().sortable(sortOption).show();
                    this.$taskList.on("sortreceive", this.receiveSortable.bind(this));
                    this.$taskList.on("sortremove", this.removeSortable.bind(this));
                    this.$taskList.on("sortout", this.outSortable.bind(this));
                    this.$taskList.on("sortover", this.overSortable.bind(this));
                    this.$taskList.on("sortupdate", _.debounce(this.updateSortable.bind(this), 1000));
                }

                //绑定工具栏函数
                this.$tools.html(this.getToolHtml());
                this.$tools.children().each(function () {
                    var $el = $(this);
                    var roleName = $el.attr("action"),
                        funcName = $.camelCase(roleName);
                    if (that[funcName]) {
                        $el.on('click', that[funcName].bind(that));
                    }
                });

                new popoverView({
                    el: this.$('[action="sort"]'),
                    trigger: 'focus',
                    placement: "bottom",
                    title: "列表菜单",
                    html: true,
                    container: '.agile',
                    items: this.popover.map(function (i) {
                        i.label = i.label || i.value;
                        i.handle =
                            that[$.camelCase(i.name)] ?
                                that[$.camelCase(i.name)].bind(that) :
                                $.noop;
                        return i;
                    })
                });

                this.initViewExtra && this.initViewExtra();
            },

            render: function () {
                return this;
            },

            updateCollectionCount: function (argument) {
                this.$('#collectionCount').text(this.collection.length);
            },

            getTools: function () {
                return this["tools"];
            },

            getToolHtml: function () {
                var html = "";
                var tools = this.getTools();
                var template = _.template('<a tabindex="0" class="glyphicon glyphicon-<%= name %>" role="button" action="<%= name %>" title="<%= label %>" <% if(typeof hide !== "undefined")print("style=\'display:none\'") %>></a>');
                var tool;

                for (var i in tools) {
                    tool = tools[i];
                    html += template(tool);
                }

                return html;
            },

            clear: function () {
                // this.model.destroy();
                this.stopListening();
                // this._removeElement();
                return this;
            },

            addAll: function () {
                this.$taskList.empty();
                this.collection.each(this.addOne, this);
            },

            addOne: function (task) {
                var $taskView = new TaskView({model: task, id: task.get("id")});
                this.$taskList.append($taskView.render().el);
            },

            waitingForResp: function () {
                this.$taskList.html(new LoadingView().render().el);
            },

            //列表接受拖拉项
            receiveSortable: function (event, ui) {
            },

            //列表移除项
            removeSortable: function (event, ui) {
            },

            //列表项顺序改变
            updateSortable: function (event, ui) {
            },

            //拖拽进入别的sortable
            outSortable: function (event, ui) {
            },
            //拖拽进入别的sortable
            overSortable: function (event, ui) {
            }
        });
    });