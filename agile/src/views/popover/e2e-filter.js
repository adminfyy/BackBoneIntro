define([
    'jquery',
    "views/popover/filter"
], function ($, Filter ) {
    return Filter.extend({
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
                //端到端看板 客户需求默认必选且不可更改
                self.$popoverElement.find('[type="checkbox"][name="issueType"]').prop('checked', true);

                //触发 清除的函数
                cancelFunc && cancelFunc();
            })
        }
    })
});

