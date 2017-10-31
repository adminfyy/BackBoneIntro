/**
 * Created by fuyy on 2017/5/15.
 */
define([
    'jquery',
    "views/popover/popover",
    "models/global",
    'text!templates/burndown.html',
    'Echart',
    'common'
], function ($, PopoverView, Global, BurnDownTmpl, Echart, Common) {
    return PopoverView.extend({
        /*
        * $el: 指的是燃尽图的图标.
        *
        * */

        initialize: function () {
            //元素不存在则销毁该视图
            if(!this.$el.length) return this.remove();

            // 弹出框
            var tip = this.$tip = this.$el.popover({
                title: "燃尽图",
                content: "",
                container: "body",
                template: BurnDownTmpl,
                trigger: "manual"
            })
                .data('bs.popover').tip();
                tip.draggable();

            //提示框
            this.$el.attr('title','燃尽图');
            this.$el.removeAttr('data-original-title');

            this.listenTo(Global, "change:burnDownTotal", this.burnDownListChange);
            this.listenTo(Global, "change:burnDownList", this.burnDownListChange);
            this.listenTo(Global, "change:sprintInfo", this.burnDownListChange);
            this.listenTo(Global, "change:sprintInfo", this.workingDayPluginInit);
            this.$tip.find('.close span').on("click", this.hide.bind(this));
            this.$BurnDown = Echart.init(this.$tip.find('#chart')[0],'light',{
                width: 550,
                height: 300
            });
            //点击弹框以外的位置时，隐藏燃尽图
            $(".vbox").on('click',this.clickBlur.bind(this));
            this.$tip.find('#workingDaySet').on('change',this.workingDayChange.bind(this))
            // Global.getBurnDownInfo();
        },

        clickBlur: function(e) {
            if(e.currentTarget.id != 'id_vbox'){
                this.$tip.hide();
            }
        },

        workingDayChange: function(){
            var that = this;
            var sprintInfo = Global.get('sprintInfo');
            var sprintPeriodList = sprintInfo.sprintPeriodList;
            var dateFormat = 'yyyy-MM-dd';
            var selectedDates = this.$workingDay.selectedDates.map(function(date){
                return new Date(date).format(dateFormat);
            }).sort();

            sprintPeriodList.map(function (item) {
                var date = item.sprintTime
                var indexOfItem = selectedDates.indexOf(date);
                var isDelete = indexOfItem === -1;
                if(isDelete){
                    item.state = 0;
                } else {
                    item.state = 1;
                    selectedDates.splice(indexOfItem, 1)
                }
                return item
            })

            selectedDates.map(function(item){
                var date = {
                    sprintTime: new Date(item).format(dateFormat),
                    state: 1,
                    smSprintId: "",
                    id: ""
                };
                sprintPeriodList.push(date)
            })

            $.ajax({
                url: rootPath + '/sprintPeriod/updateSprintPeriod.shtml',
                method: 'post',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify(sprintInfo),
            })
                .done(function(){
                    Global.trigger('change:burnDownList');
                })
        },

        //工作日
        workingDayPluginInit: function () {
            var sprintInfo = Global.get('sprintInfo');
            var $el = this.$tip.find('#workingDaySet')

            this.$workingDay = _flatpickr($el,{
                mode: 'multiple',
                defaultDate:(sprintInfo && sprintInfo.sprintPeriodList || [])
                    .filter(function(item){
                        return item.state
                    })
                    .map(function(date){
                        var dateD = new Date(date.sprintTime)
                        return dateD
                    }),
                locale: 'zh',
                enable: [{
                    from: sprintInfo.startTime,
                    to: sprintInfo.endTime
                }]
            })
        },

        //燃尽图
        burnDownListChange: _.debounce(function () {
            var data = Global.get('burnDownList')|| [];
            var totalStoryNum = Global.get('burnDownTotal') || 0;
            var sprintInfo = Global.get('sprintInfo');
            var referLine = this.getxAxisByWokingDay().sort();

            var dayCount = referLine.length;

                dayCount =  dayCount ? Math.abs(dayCount - 1): dayCount

            var distancePerDay = (Math.abs(totalStoryNum/dayCount)).toFixed(2) || 0.00;

            data = data.sort(function (a, b) { return a.date - b.date });

            data.map(function(i){
                i.date = new Date(i.date).format("MM-dd");
                return i;
            })
            data = _.indexBy(data, "date");
            //
            // //转换格式

            var referLine = this.getxAxisByWokingDay().sort();
            var option = {
                //y轴数据列表
                series: [{
                    type: 'line',
                    name: '实际线',
                    data: referLine.map(function (xAxis) {
                        if(!data[xAxis])return null;
                        var StoryNum = data[xAxis].storyNum;
                        return [xAxis, StoryNum]
                    }).filter(function(item){ return !!item })
                }, {
                    type: 'line',
                    name: '参考线',
                    data: referLine.map(function (item, index) {
                        return [item, (totalStoryNum - index * distancePerDay).toFixed(2)]
                    })
                }]
            }

            option = $.extend({}, Common.Echart.BurnDown, this.setUpXAxis(),this.getBurnDownSubtext(), option);
            this.$BurnDown.setOption(option);
        }, 500),

        getBurnDownSubtext: function () {
            var data = Global.get('burnDownTotal');
            return {
                title: {
                    text: '燃尽图',
                    subtext: '总故事点数: ' + data,
                    left: 'center'
                }
            }
        },

        setUpXAxis: function () {
            return {xAxis: [{
                type: 'category',
                boundaryGap: false,
                data: this.getxAxisByWokingDay()
            }]}
        },

        getxAxisByPeriod: function(){
            var sprintInfo = Global.get('sprintInfo');
            var startTime = new Date(sprintInfo.startTime);
            var endTime = new Date(sprintInfo.endTime);

            var chartXAxis = [];
            var iterator = new Date(sprintInfo.startTime);

            for(;iterator <= endTime;){
                chartXAxis.push(iterator.format('MM-dd'));
                iterator.setDate(iterator.getDate() + 1)
            }
            chartXAxis.sort();

            return  chartXAxis
        },

        getxAxisByWokingDay: function(){
            var sprintInfo = Global.get('sprintInfo');
            var chartXAxis = (sprintInfo.sprintPeriodList || [])
                .filter(function(item){
                    return item.state
                })
                .map(function(date){
                    var dateD = new Date(date.sprintTime).format('MM-dd');
                    return dateD
                })
            return chartXAxis
                .sort()

        }
    })
})