/**
 * Created by fuyy on 2017/3/31.
 */
define([
        'backbone',
        'jquery',
        'collections/sprint',
        'views/list-product-item',
        'views/list-product',
        'models/global',
        'text!templates/modal-update-sprint.html',
        'text!templates/modal-create-sprint.html',
        'text!templates/modal-sprint.html',
        'common'
    ],
    function (Backbone, $, Sprint, ProductView, ProductListView, Global, UpdateSprintTemplate, createSprintTemplate, viewSprintTemplate, Common) {

        return ProductListView.extend({

            collection: Sprint,

            tools: [{
                name: "refresh",
                label: "刷新"
            }, {
                name: "plus",
                label: "创建迭代"
            }, {
                name: "play",
                label: "开始迭代"
            }, {
                name: 'edit',
                label: '编辑迭代'
            }, {
                name: "stop",
                label: "结束迭代"
            }, {
                name: "eye-open",
                label: "查看迭代详情"
            }],


            initData: function () {
                this.collection.refresh();

                //调整工具栏的显示 根据状态
                this.updateTools();
                this.sprintInfoChange();
            },
            refresh: function () {
                this.collection.refresh();
            },

            initDataListening: function () {
                this.listenTo(this.collection, 'reset', _.debounce(this.addAll, 500));
                this.listenTo(this.collection, 'requesting', this.waitingForResp);
                this.listenTo(this.collection, 'all', this.updateCollectionCount);
                this.listenTo(this.model, 'change', this.toggleVisible);

                this.listenTo(Global, 'change', this.globalModelChange);
                this.listenTo(Global, 'change:sprintInfo', this.sprintInfoChange);
            },

            //添加故事点展示
            initViewExtra: function () {
                var $el = this.$('#collectionCount');
                $('<span role="story-sum" title="故事点"></span>').insertAfter($el);
                $('<span>&nbsp;&middot;&nbsp;</span>').insertAfter($el);
            },

            updateCollectionCount: function () {
                var totalStoryNum = this.collection.reduce(function (accumulator, model) {
                    // fixbug：拖入的第一个需求故事点为0时，相加变成字符串相加
                    return accumulator += Number(model.get('storyNum'));
                }, 0);
                this.$('[role=story-sum]').text(totalStoryNum);
                this.$('#collectionCount').text(this.collection.length);
            },

            addOne: function (item) {
                var $taskView = new ProductView({model: item, id: item.get("id")});
                this.$taskList.append($taskView.render().el);
            },

            getDropActionData: function (fromList, item) {
                return {
                    "teamId": Global.get('team'),
                    "productReqId": $(item).data('id'),
                    "reqState": "2"
                };
            },

            isDroppable: function () {
                var sprintInfo = Global.get("sprintInfo");
                //迭代未结束
                var droppable = sprintInfo && sprintInfo.id && sprintInfo.state < 2;
                if (!droppable) layer.msg("未创建当前迭代,请创建后重试");
                return droppable;
            },

            sprintInfoChange: function () {
                this.$tools.children().hide();
                this.$("[action='refresh']").show();
                var sprintInfo = Global.get('sprintInfo');
                if (!sprintInfo)
                    return;
                switch (sprintInfo.state) {
                    //待启动
                    case 0:
                        this.$("[action='play']").show();
                        this.$("[action='edit']").show();
                        break;
                    //已启动
                    case 1:
                        this.$("[action='stop']").show();
                        this.$("[action='eye-open']").show();
                        break;
                    //关闭
                    case 2:
                    default:
                        this.$("[action='plus']").show();
                        break;
                }

                this.$("[action='sort']").show();
                this.$('.item-header-label .name').text(sprintInfo.sprintName || '本次迭代')
                    .attr('title', sprintInfo.sprintName || '本次迭代');
                var time_range = (sprintInfo.startTime && sprintInfo.endTime ) ?
                    "(" +
                    new Date(sprintInfo.startTime).format('MM/dd') +
                    "-" +
                    new Date(sprintInfo.endTime).format('MM/dd') +
                    ")"
                    : "";
                this.$(".item-header-label [role='time-range']").text(time_range);
            },

            createSprintCallback: function (data) {
                this.initData();
                //创建迭代完成以后更新迭代信息
                Global.getSprintInfo();
            },

            updateTools: function () {
                var sprintInfo = Global.get('sprintInfo');
                if (!sprintInfo) return;
                this.tools.map(function (el) {
                    el.hide = true;
                    return el;
                });
                switch (sprintInfo.state) {
                    //待启动
                    case 0:
                        this.tools
                            .map(function (item) {
                                var target = ['refresh', 'play', 'edit', 'sort'];
                                if (target.indexOf(item.name) !== -1) delete item.hide;
                                return item;
                            });
                        break;
                    //已启动
                    case 1:
                        this.tools.map(function (item) {
                            var target = ['refresh', 'stop', 'eye-open', 'sort'];
                            if (target.indexOf(item.name) !== -1) delete item.hide;
                            return item;
                        });
                        break;
                    //关闭
                    case 2:
                    default:
                        this.tools.map(function (item) {
                            var target = ['refresh', 'plus', 'sort'];
                            if (target.indexOf(item.name) !== -1) delete item.hide;
                            return item;
                        });
                        break;
                }
            },

            //创建迭代按钮
            plus: function () {
                // 创建迭代
                Backbone.trigger("setModal", {

                    model: new Backbone.Model(),

                    template: _.template(createSprintTemplate),

                    events: {
                        "click [role='create-sprint']": "createSprint",
                        "change #sprintRange": "sprintRangeChange",
                        "change #sprintWorkingDay": "sprintWorkingDayChange"
                    },

                    initPlugins: function () {
                        this.$sprintRange = flatpickr('#sprintRange', {
                            mode: "range",
                            locale: "zh",
                            allowInput: true,
                            closeOnSelect: false
                        });

                        this.$sprintWorkingDay = flatpickr('#sprintWorkingDay', {
                            mode: "multiple",
                            locale: "zh",
                            allowInput: true,
                            closeOnSelect: false,
                            wrap: true
                        });
                    },

                    sprintRangeChange: function () {
                        var datesBefore = this.$sprintRange.selectedDates.sort(Common.sortDate);
                        var first = datesBefore[0],
                            last = datesBefore[datesBefore.length - 1];

                        var afterFilter = [];
                        var iterator = new Date(first);

                        for (; iterator <= last; iterator.setDate(iterator.getDate() + 1)) {
                            var day = new Date(iterator);
                            //忽略周六日
                            if (day.getDay() === 0 || day.getDay() === 6) continue;
                            afterFilter.push(day);
                        }

                        this.$sprintWorkingDay.set("enable", [{from: first, to: last}]);
                        this.$sprintWorkingDay.setDate(afterFilter, true);
                    },

                    sprintWorkingDayChange: function () {
                        this.$('[name="period"]').val(this.$sprintWorkingDay.selectedDates.length);
                    },

                    callback: this.createSprintCallback.bind(this),

                    sortDate: function (a, b) {
                        return a.valueOf() - b.valueOf();
                    },

                    createSprint: function () {
                        var that = this;
                        var data = this.$('form').serializeJson();
                        var dateRange = this.$sprintRange.selectedDates.sort(Common.sortDate);
                        var dates = this.$sprintWorkingDay.selectedDates.sort(Common.sortDate);
                        var dateFormat = 'yyyy-MM-dd';
                        var today = new Date().format(dateFormat);
                        data.startTime = dateRange[0].format(dateFormat);
                        data.endTime = dateRange[dateRange.length - 1].format(dateFormat);
                        data["sprintPeriodList"] = dates.map(function (item) {
                            return {
                                sprintTime: item.format(dateFormat),
                                state: 1,
                                smSprintId: "",
                                id: ""
                            };
                        });
                        data.teamId = Global.get("team");

                        if (!data.sprintName.length) {
                            layer.msg('请输入迭代名称');
                            return;
                        }

                        if (!dateRange.length) {
                            layer.msg("请选择迭代周期");
                            return;
                        }

                        if (today > data.startTime) {
                            layer.msg('起始日期应该 >= 今天');
                            return;
                        }

                        $.ajax({
                            method: 'post',
                            data: JSON.stringify(data),
                            url: rootPath + '/sprint/addSprint.shtml',
                            dataType: "json",
                            contentType: "application/json"
                        })
                            .success(function (data) {
                                if (!data[Common.SUCCESS]) {
                                    layer.msg(data[Common.MSG] || "创建失败");
                                    return;
                                }

                                layer.msg("创建迭代成功");
                                that.$el.modal('hide');
                                that.callback && that.callback(data);
                            })

                            .fail(function () {
                                layer.msg("创建失败");
                            });

                    }

                });
            },

            edit: function () {
                Backbone.trigger("setModal", {

                    model: new Backbone.Model(Global.get("sprintInfo")),

                    template: _.template(UpdateSprintTemplate),

                    events: {
                        "click [role='update-sprint']": "updateSprint",
                        "change #sprintRange": "sprintRangeChange",
                        "change #sprintWorkingDay": "sprintWorkingDayChange"
                    },

                    initPlugins: function () {
                        this.$sprintRange = flatpickr('#sprintRange', {
                            mode: "range",
                            locale: "zh",
                            allowInput: true,
                            closeOnSelect: false,
                            defaultDate: [
                                this.model.get('startTime'),
                                this.model.get('endTime')
                            ]
                        });

                        var selectedDay = (this.model.get('sprintPeriodList') || [])
                            .filter(function (item) {
                                return item.state;
                            }).map(function (item) {
                                return item.sprintTime;
                            });

                        this.$sprintWorkingDay = flatpickr('#sprintWorkingDay', {
                            mode: "multiple",
                            locale: "zh",
                            allowInput: true,
                            closeOnSelect: false,
                            defaultDate: selectedDay,
                            enable: [{
                                from: this.model.get('startTime'),
                                to: this.model.get('endTime')
                            }],
                            wrap: true
                        });

                        this.$('[name="period"]').val(selectedDay.length);
                    },

                    callback: this.createSprintCallback.bind(this),

                    sprintRangeChange: function () {
                        var datesBefore = this.$sprintRange.selectedDates.sort(Common.sortDate);
                        var first = datesBefore[0],
                            last = datesBefore[datesBefore.length - 1];

                        var afterFilter = [];
                        var iterator = new Date(first);

                        for (; iterator <= last; iterator.setDate(iterator.getDate() + 1)) {
                            var day = new Date(iterator);
                            //忽略周六日
                            if (day.getDay() === 0 || day.getDay() === 6) continue;
                            afterFilter.push(day);
                        }

                        this.$sprintWorkingDay.set("enable", [{from: first, to: last}]);
                        this.$sprintWorkingDay.setDate(afterFilter, true);
                    },

                    sprintWorkingDayChange: function () {
                        this.$('[name="period"]').val(this.$sprintWorkingDay.selectedDates.length);
                    },

                    updateSprint: function () {
                        var that = this;
                        var data = this.$('form').serializeJson();
                        var dateRange = this.$sprintRange.selectedDates.sort(Common.sortDate);
                        var dateFormat = 'yyyy-MM-dd';
                        var today = new Date().format(dateFormat);
                        var dates = this.$sprintWorkingDay.selectedDates.map(function (date) {
                            return new Date(date).format(dateFormat);
                        }).sort();

                        data.startTime = dateRange[0].format(dateFormat);
                        data.endTime = dateRange[dateRange.length - 1].format(dateFormat);

                        var sprintPeriodList = this.model.get('sprintPeriodList');

                        sprintPeriodList.map(function (item) {
                            var date = item.sprintTime;
                            var indexOfItem = dates.indexOf(date);
                            var isDelete = indexOfItem === -1;
                            if (isDelete) {
                                item.state = 0;
                            } else {
                                item.state = 1;
                                dates.splice(indexOfItem, 1);
                            }
                            return item;
                        });

                        dates.map(function (item) {
                            var date = {
                                sprintTime: new Date(item).format(dateFormat),
                                state: 1,
                                smSprintId: "",
                                id: ""
                            };
                            sprintPeriodList.push(date);
                        });

                        data.sprintPeriodList = sprintPeriodList;


                        if (!data.sprintName) {
                            layer.msg('请输入迭代名称');
                        }


                        if (!data.startTime.length) {
                            layer.msg("请选择开始日期");
                            return;
                        }

                        if (!data.endTime.length) {
                            layer.msg("请选择结束日期");
                            return;
                        }

                        if (today > data.startTime) {
                            layer.msg('起始日期应该 >= 今天');
                            return;
                        }


                        $.ajax({
                            method: 'post',
                            data: JSON.stringify(data),
                            url: rootPath + '/sprint/updateSprint.shtml',
                            dataType: "json",
                            contentType: "application/json"
                        })
                            .success(function (resp) {
                                that.$el.modal('hide');
                                that.callback && that.callback(data);
                            })

                            .fail(function () {
                                layer.msg("编辑失败");
                            });

                    }
                });
            },

            //开始迭代按钮
            play: function () {
                var that = this,
                    sprintInfo = Global.get('sprintInfo'),
                    totalStoryNum = 0;

                this.collection.filter(function (item) {
                    totalStoryNum += item.get("storyNum");
                });
                var demandCount = this.collection.length;
                confirmText = "本次迭代总故事点: " + totalStoryNum + "\r\n总需求数: " + demandCount;

                layer.confirm(confirmText, {
                    btn: ["开始迭代", "取消"]
                }, function (index) {
                    layer.closeAll();
                    $.get(rootPath + "/sprint/startSprint.shtml?id=" + Global.get('sprintInfo').id)
                        .done(function (resp) {
                            layer.msg("开始迭代");
                            Global.set('sprintInfo', $.extend({}, sprintInfo, {
                                state: 1
                            }));
                        });

                    //点击开始迭代，自动跳转到 当前迭代 页面
                    $('[data-board="2"]').trigger('click');
                });
            },

            //查看迭代详情
            eyeOpen: function () {
                Backbone.trigger('setModal', {

                    model: new Backbone.Model(Global.get('sprintInfo')),

                    template: _.template(viewSprintTemplate),
                    initPlugins: function () {
                        this.$sprintRange = flatpickr('#sprintRange', {
                            mode: "range",
                            locale: "zh",
                            allowInput: true,
                            closeOnSelect: false,
                            defaultDate: [
                                this.model.get('startTime'),
                                this.model.get('endTime')
                            ]
                        });

                        var selectedDay = (this.model.get('sprintPeriodList') || [])
                            .filter(function (item) {
                                return item.state;
                            }).map(function (item) {
                                return item.sprintTime;
                            });

                        this.$sprintWorkingDay = flatpickr('#sprintWorkingDay', {
                            mode: "multiple",
                            locale: "zh",
                            allowInput: true,
                            closeOnSelect: false,
                            defaultDate: selectedDay,
                            enable: [{
                                from: this.model.get('startTime'),
                                to: this.model.get('endTime')
                            }],
                            wrap: true
                        });

                        this.$('[name="period"]').val(selectedDay.length);
                    }

                });

            },

            //结束迭代
            stop: function () {
                var that = this;
                var sprintInfo = Global.get('sprintInfo');
                var callback = function (index) {
                    index && layer.closeAll();
                    $.get(rootPath + "/sprint/completeSprint.shtml?id=" + Global.get('sprintInfo').id)
                        .done(function () {
                            that.createSprintCallback();
                            Backbone.trigger("PRODUCT-LIST-REFRESH");
                        });
                };

                //未完成的需求
                var unResolvedCount = this.collection.filter(function (product) {
                        return product.get('resolved') === 0;
                    }).length,
                    confirmTemplate = "本次迭代总需求数: " + this.collection.length + "\r\n未解決需求数量: " + unResolvedCount;

                unResolvedCount ?
                    layer.confirm(confirmTemplate, {
                        btn: ["结束迭代", "取消"]
                    }, callback) :
                    callback();
            }

        });
    });