/**
 * Created by fuyy on 2017/5/15.
 */
define([
    'jquery',
    "views/popover/popover",
    'text!templates/popover-default.html'
], function ($, SuperView, Template) {
    return SuperView.extend({

        template: _.template(Template),

        items: [],

        initialize: function (options) {
            options.template = this.template();
            this.$el.popover(options);
            this.items = options.items;
            this.fillTemplate();
        },

        fillTemplate: function () {
            var popoverData = this.$el.data('bs.popover');
            if (popoverData) {
                //填充DOM
                var $el = popoverData
                    .tip()
                    .find('.list')
                    .html(this.getToolContent());
                //绑定点击事件
                this.items.forEach(function (i) {
                    var selector = "[action='" + i.name + "']";
                    $el.find(selector).on('click', i.handle || function () {
                        return false
                    })
                })
            }
        },

        getToolContent: function () {
            var ret = "";
            var items = this["items"];
            for (var index in items) {
                var li = items[index];
                var label = li.label || li.name;

                ret += "<a href='#' action='" + li.name + "'>" + label + "</a>"
            }
            return ret;
        }

    })
});

/* 使用方法
*  new View({
*   el: el { node or jQuery },
*
*   items: [{
*       name: 'xxx',
*       label: 'xxx',  xxx 可以为html也可以为文字
*       handler: function() {
*       ....
*       }
*  })
*  */