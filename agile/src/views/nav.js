/**
 * Created by fuyy on 2017/4/5.
 */
define([
        'backbone',
        'jquery',
        'common',
        'collections/sprint',
        'models/global',
        'views/popover/burn-down',
        'views/list-demand-pool-filter'
    ],
    function (Backbone, $, Common, SprintCollection, Global, BurnDownView, DemandFilter) {

        var view = Backbone.View.extend({
            el: '.agile-header',
            model: Global,
            events: {
                "change #team": "changeTeam",
                // "change #board": "changeBoard",
                'click [m-custom-scroll]': 'scroll',
                'click [data-board]': 'changeBoard',
                'dblclick [data-board]': 'forceBoardReload'
            },

            initialize: function () {
                this.$team = this.$('#team');
                this.$board = this.$('#board');
                this.$agileSearch = this.$('#agileSearch');

                // this.$board.select2({
                //     data: Common.boardList,
                //     minimumResultsForSearch: Infinity,
                //     theme: 'bootstrap'
                // })
                //     .val(Global.get('board') || 1)
                //     .trigger('change');
                this.$('[data-board=' + (Global.get('board') || 1) + ']').parent().addClass('active');
                this.$team.select2({
                    placeholder: '请选择团队',
                    minimumResultsForSearch: Infinity,
                    theme: 'bootstrap'
                })
                    .val(Global.get('team') || this.$team.children().first().val())
                    .trigger('change');

                this.$chart = this.$('.chart');
                new BurnDownView({el: this.$chart});
                this.$filter = this.$('.filter');
                if (this.$filter.length) new DemandFilter();
                this.$elevator = this.$('[role="elevator"]');

                this.$sprintInfo = this.$('#sprintInfo');
                this.$sprintInfo.find('.glyphicon-play').on('click', this.play.bind(this));
                this.$sprintInfo.find('.glyphicon-stop').on('click', this.stop.bind(this));

                //默认隐藏 燃尽图按钮/收缩按钮
                this.boardChange();
                this.sprintInfoChange();

                this.listenTo(this.model, "change:board", this.boardChange);
                this.listenTo(this.model, "change:sprintInfo", this.sprintInfoChange);
            },

            changeTeam: function () {
                var val = this.$team.val();
                if (val) {
                    this.model.set("team", val);
                }
            },

            changeBoard: function (e, data) {
                var $el = $(e.currentTarget);
                $el.parent().addClass("active").siblings().removeClass("active");
                this.model.set("board", $el.attr('data-board'));
            },

            forceBoardReload: function (e, data) {
                this.changeBoard(e, data);
                this.model.trigger("change:board");
            },

            boardChange: function () {
                switch (Number(this.model.get('board'))) {
                    case Common.DEMAND_BOARD:
                        this.$agileSearch.show();
                        this.$chart.hide();
                        this.$elevator.hide();
                        this.$sprintInfo.hide();
                        break;
                    case Common.DEV_BOARD:
                        this.$chart.show();
                        this.$elevator.show();
                        this.showSprintHandler();
                        this.$agileSearch.hide();
                        break;
                    default:
                        this.$agileSearch.hide();
                        this.$chart.hide();
                        this.$elevator.hide();
                        this.$sprintInfo.hide();
                }
            },

            scroll: _.debounce(function (e, data) {
                var hash = e.currentTarget.hash;
                var target = hash.substr(1);
                var selector = '[column-type=\'' + target + '\']';
                $(e.currentTarget).parent().addClass("active").siblings().removeClass("active");
                $('.agile').scrollTo(selector, {
                    "duration": 1000,
                    'axis': 'x'
                });

                return false;
            }, 350),

            sprintInfoChange: function () {
                var sprint = this.model.get('sprintInfo');
                if (typeof sprint === 'undefined') return;
                this.$sprintInfo.find('.glyphicon').hide();

                switch (Number(sprint.state)) {
                    case 0:
                    case 1:
                        this.$sprintInfo.find('.name').text(sprint.sprintName);
                        var timeRangeText = "(" +
                            new Date(sprint.startTime).format('MM/dd') + '-' +
                            new Date(sprint.endTime).format('MM/dd') + ")";

                        this.$sprintInfo.find('.timeRange').text(timeRangeText);
                        break;

                    //    若没有迭代  则迭代相关的信息清空
                    default:
                        this.$sprintInfo.find('.name').text('');
                        this.$sprintInfo.find('.timeRange').text('');
                }


                switch (Number(sprint.state)) {
                    case 0:
                        this.$sprintInfo.find('.glyphicon-play').show();
                        break;
                    case 1:
                        this.$sprintInfo.find('.glyphicon-stop').show();
                        break;
                }
            },

            showSprintHandler: function () {
                var sprint = this.model.get('sprintInfo');
                //迭代信息可能未定义
                if (typeof sprint === 'undefined') return;
                switch (Number(sprint.state)) {
                    case 0:
                    case 1:
                        this.$sprintInfo.show();
                        break;
                    default:
                        this.$sprintInfo.hide();
                        break;
                }
            },

            //开始迭代按钮
            play: function () {
                var that = this,
                    sprintInfo = Global.get('sprintInfo'),
                    totalStoryNum;

                totalStoryNum = SprintCollection.reduce(function (acculator, item) {
                    return acculator += Number(item.get("storyNum"));
                }, 0);
                var demandCount = SprintCollection.length;
                confirmText = "本次迭代总故事点: " + totalStoryNum + "\r\n总需求数: " + demandCount;

                layer.confirm(confirmText, {
                    btn: ["开始迭代", "取消"]
                }, function (index) {
                    layer.closeAll();
                    $.get(rootPath + "/sprint/startSprint.shtml?id=" + Global.get('sprintInfo').id)
                        .done(function (resp) {
                            layer.msg("开始迭代");
                            Global.set('sprintInfo', $.extend({}, sprintInfo, {state: 1}));
                            Backbone.$('.ui-sortable').sortable('enable');
                        });
                });
            },

            //结束迭代
            stop: function () {
                var that = this;
                var sprintInfo = Global.get('sprintInfo');
                var callback = function (index) {
                    index && layer.closeAll();
                    $.get(rootPath + "/sprint/completeSprint.shtml?id=" + Global.get('sprintInfo').id,
                        function (res) {
                            if (res === 'success') {
                                Global.set('sprintInfo', $.extend({}, sprintInfo, {
                                    sprintName: '',
                                    state: 2
                                }));

                                //
                                layer.msg('结束迭代, 面板锁定');
                                Backbone.$('.ui-sortable').sortable('disable');
                            }
                        }, 'json');
                };

                //未完成的需求
                var unResolvedCount = SprintCollection.filter(function (product) {
                        return product.get('resolved') === 0;
                    }).length,
                    confirmTemplate = "本次迭代总需求数: " + SprintCollection.length + "\r\n未解決需求数量: " + unResolvedCount;

                unResolvedCount ?
                    layer.confirm(confirmTemplate, {
                        btn: ["结束迭代", "取消"]
                    }, callback) :
                    callback();
            }

        });

        return view;
    });