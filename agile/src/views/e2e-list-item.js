define([
    'backbone',
    'text!templates/e2e-list-item.html'
], function (Backbone, template) {
    return Backbone.View.extend({
        template: _.template(template),
        events: {
            'mouseenter': 'mouseEnter',
            'mouseleave': 'mouseLeave'
        },

        render: function () {
            this.el = this.template(this.model.toJSON());
            this._ensureElement();
            this.renderAllState();
            return this;
        },

        selectorTpl: function (state) {
            var res = "td.state-sid".replace("sid", state);
            return res;
        },

        getStateInfo: function (comName, date, day) {
            var res = comName + "<br/>" + new Date(date).format('MM-dd') + ", " + day + "天";
            return res;
        },

        renderAllState: function () {
            var children = this.model.get('childReqList');
            this.renderMainInfo();
            if (children.length > 1) {
                children.forEach(this.renderState.bind(this))
            } else {
                this.renderState(this.model)
            }
        },

        //左侧主要信息-展示状态相关(main-info-部分)
        renderMainInfo: function () {
            var now = new Date();
            var createTime = new Date(this.model.get('pmsCreateTime'));
            var planPublishDate = new Date(this.model.get('planPublishDate'));
            var mid = this.model.get('id').toString().replace(/:/, '\\:');
            var $el = this.$el.length > 1 ? this.$el.filter('#' + mid) : this.$el;

            //观察期
            var isObservation = this.model.get('isObservation');
            if (isObservation) {
                $el.addClass('observation');
                return;
            }

            //期望时间告警
            var isCloseToExpectedPeriod = ((planPublishDate - now) / 1000 / 60 / 60 / 24) <= 2;
            if (isCloseToExpectedPeriod) {
                this.$('td.main-info:first-child').addClass('overtime-color');
                return;
            }

            //全阶段预警
            var isAllPeriodWarning = ((now - createTime) / 1000 / 60 / 60 / 24) > 30;
            if (isAllPeriodWarning) {
                $el.addClass('warning-bg');
                return;
            }

        },

        //展示右侧状态栏显示部分
        renderState: function (data) {
            var getData = function getData(key) {
                if (data.get) return data.get(key);
                return data[key]
            };
            var state = getData('state');
            var mid = getData('id').toString().replace(/:/, '\\:');
            var comName = getData('comName');
            var now = new Date();
            var createTime = new Date(getData('pmsCreateTime'));
            var stateList = [
                "客户提出", "需求审核",
                "新建", "就绪", "已规划",
                "研发中", "发布",
                "升级",
                "关闭"
            ];
            var stateNumber = stateList.indexOf(state);
            if (/验收|完成/.test(state)) stateNumber = 5;
            var $tr = this.$el.filter('#' + mid);
            var $el = $tr.find(this.selectorTpl(stateNumber));
            var className = 'normal';
            var startTime;
            var period;
            $el.attr('current', true);

            //客户提出，需求审核
            if (stateNumber <= 1) {
                className = getData('pmsAuditPeriod') > 1 ? 'overtime' : className;
                startTime = getData('pmsCreateTime');
                period = getData('pmsAuditPeriod');
                $el.html(this.getStateInfo(comName, startTime, period)).addClass(className);
                if (stateNumber === 1) $el.prev().addClass(className + '-line');
                //    新建，就绪,已规划
            } else if (stateNumber <= 4) {
                className = getData('planReqPeriod') > 7 ? 'overtime' : className;
                startTime = getData('createTime');
                period = getData('planReqPeriod');
                $el.html(this.getStateInfo(comName, startTime, period)).addClass(className);
                //添加线
                if (stateNumber === 4) $el.prevAll('.state-2,.state-3').addClass(className + '-line');
                if (stateNumber === 3) $el.prev().addClass(className + '-line');

                //    研发中，发布
            } else if (stateNumber <= 6) {
                className = getData('handleReqPeriod') > 15 ? 'overtime' : className;
                startTime = getData('developingTime');
                period = getData('handleReqPeriod');
                $el.html(this.getStateInfo(comName, startTime, period)).addClass(className);
                if (stateNumber === 6) $el.prev().addClass(className + '-line');

                //  部署上线
            } else if (stateNumber === 7) {
                className = getData('deployPeriod') > 7 ? 'overtime' : className;
                startTime = getData('deployStartTime');
                period = getData('deployPeriod');
                $el.html(this.getStateInfo(comName, startTime, period)).addClass(className);
                //    客户验收/观察期
            } else if (stateNumber === 8) {
                className = getData('customerCheckPeriod') > 2 ? 'overtime' : className;
                //客户验收
                if (!getData('isObservation')) {
                    $el.html(this.getStateInfo(comName,
                        getData('deployEndTime'),
                        getData('customerCheckPeriod')));
                    $el.addClass(className);
                    //观察期
                } else if (getData('isObservation')) {
                    $el = $tr.find(this.selectorTpl(9));
                    $el.html(this.getStateInfo(comName,
                        getData('customerCheckTime'),
                        getData('observationPeriod')));
                    $el.addClass('normal').addClass('observation');
                    $tr.addClass('observation');
                }
            }

            // 添加历史预警标志
            // stage1:  0-1
            var isStage1OverTime = getData('pmsAuditPeriod') > 1 && stateNumber > 2;
            if (isStage1OverTime) $tr.find(this.selectorTpl(0))
                .addClass('history-overtime')
                .attr('title', '超时');
            // stage2:  2-4
            var isStage2OverTime = getData('planReqPeriod') > 7 && stateNumber > 5;
            if (isStage2OverTime) $tr.find(this.selectorTpl(2))
                .addClass('history-overtime')
                .attr('title', '超时');
            // stage3: 5-6
            var isStage3OverTime = getData('handleReqPeriod') > 15 && stateNumber > 7;
            if (isStage3OverTime) $tr.find(this.selectorTpl(5))
                .addClass('history-overtime')
                .attr('title', '超时');
            // stage4: 7
            var isStage4OverTime = getData('deployPeriod') > 7 && stateNumber > 8;
            if (isStage4OverTime) $tr.find(this.selectorTpl(7))
                .addClass('history-overtime')
                .attr('title', '超时');
            // stage4: 8
            var isStage5OverTime = getData('customerCheckPeriod') > 2 && stateNumber > 9;
            if (isStage5OverTime) $tr.find(this.selectorTpl(8))
                .addClass('history-overtime')
                .attr('title', '超时');

            //全阶段预警
            var isAllPeriodWarning = ((now - createTime) / 1000 / 60 / 60 / 24) > 30;
            if (isAllPeriodWarning) {
                $tr.addClass('warning-bg');
            }

            //设定选
            this.addTooltipContent(getData('id'), $el)
        },

        addTooltipContent: function (id, $el) {
            //pms需求不存在子需求
            if (/pms/.test(id)) return;
            $
                .ajax({
                    type: 'GET',
                    url: 'end2end/getEnd2EndChildReqStateList.shtml',
                    data: {parentId: id},
                    dataType: 'json'
                })

                .done(function (res) {
                    var list = res.childReqStateList || (res.childReqStateList = []);
                    var str = list.map(function (t) {
                        _.defaults(t, {state: '新建', subject: '子需求'});
                        return _.template("<p><strong><%= subject %></strong>：&nbsp<span class='state <%= state%>'><%= state %></span></p>")(t)
                    }).join('');
                    $el.popover({
                        title: '子需求状态详情',
                        html: true,
                        content: str ? str : '暂无',
                        trigger: 'hover',
                        container: 'body'
                    })
                })
        },

        mouseEnter: function () {
            this.$el.first().addClass('hover');
        },

        mouseLeave: function () {
            this.$el.first().removeClass('hover');
        }
    })
})
;