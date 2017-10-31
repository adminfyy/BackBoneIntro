/**
 * Created by fuyy on 2017/5/15.
 */
define([
    "backbone",
    "view/popover/popover",
    "collections/all-component"
], function (Backbone, PopoverView, AllComponent) {
    return PopoverView.extend({

        initialize: function (options) {
            this.$el.popover(options);
            this.initView();
        },

        initView: function () {
            var $el = this.$el.data('bs.popover').tip();
            var $content = $el.find('.popover-content');
            $content.attr('id', 'component-tree');
            $.fn.ztree.init($content, AllComponent.toJSON());
        }
    })
});