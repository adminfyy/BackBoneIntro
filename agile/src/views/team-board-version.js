/**
 * Created by fuyy on 2017/5/23.
 */
define([
    "backbone",
    "views/list-version",
    "views/list-version-selected",
    "views/list-backlog",
    'text!templates/version.html'
], function (Backbone, VersionView, VersionSelectedView, BacklogView, VersionTemplate) {

    return Backbone.View.extend({
        tagName: 'ul',
        className: 'stage-list',
        template: _.template(VersionTemplate),

        render: function () {
            this.$el.html(VersionTemplate);
            //功能面板初始化
            new VersionView({el: this.$('.versionTree')}).render().$el;
            new VersionSelectedView({el: this.$('.versionSelected')}).render().$el;
            new BacklogView({el: this.$('.backlog')}).render().$el;
            return this;
        }
    })
});