/**
 * Created by fuyy on 2017/5/15.
 */
define([
    'jquery',
    "views/popover/popover",
    'text!templates/popover-filter.html'
], function ($, SuperView, Template) {
    return SuperView.extend({

        template: _.template(Template),

        items: [],

        initialize: function (opt) {
            var self = this;
            this.opt = opt;

            _.extend(opt, {
                title: '<span class="title">条件筛选</span><span class="clear">清除筛选</span>',
                template: this.template({options: opt.options}),
                trigger: 'click',
                placement: 'bottom',
                // 关闭动画可避免#bug destory延迟清空数据导致再次init失败
                animation: false,
                html: true
            });

            this.$el.popover(opt);
            this.$popoverElement = this.$el.data('bs.popover').tip();
            this.bindHandle();
        },

        bindHandle: function () {
            var self = this;
            var cancelFunc = self.opt.cancelHandle;

            this.opt.options.forEach(function (t) {
                if (t.childs) {
                    t.childs.forEach(function (c) {
                        c.el = self.$popoverElement.find('#' + c.name + c.value);
                        c.el.on('change', c.handle)
                    })
                }
                t.el = self.$popoverElement.find('#' + t.name + t.value);
                t.el.on('change', t.handle)
            });

            this.$popoverElement.on('click', '.clear', function () {
                //清除已选过滤条件
                self.$popoverElement.find('[type="checkbox"]').prop('checked', false);

                //触发 清除的函数
                cancelFunc && cancelFunc();
            })
        },

        //延迟执行方法 默认为150秒
        removePopoverData: function () {
            this.$el.popover('destroy');
            return this;
        },

        // triggerChange: function () {
        //     this.$popoverElement.find('[type="checkbox"]').trigger('change')
        // }
    })
});

/* filter 的目的是
*  输出一个组件
*  可选的参数为
*  指定的触发元素
*
*  过滤的条件列表
*  以及每个列表项目的handle
*
*  new view({
*
*  el: '.xxx',
*  cancelHanlde: funtion(){},
*  options: [{
*   name: '',
*   label: '',
*   value: '',
*   handle: '',
*   checked: true || false
*   },...]
*
*  */