/**
 * Created by fuyy on 2017/4/5.
 */
define([
        'backbone',
        'text!templates/demand.html',
        'common',
        "models/global",
        'text!templates/modal-demand.html'
    ],
    function (Backbone, Template, Common, Global, DemandTemplate) {

        return Backbone.View.extend({

            tagName: 'li',

            className: 'task-list-item',

            template: _.template(Template),

            events: {
                "click": "getModelDetail",
                "click .fa-angle-double-down": "bottom",
                "click .fa-angle-double-up": "top"
            },

            initialize: function () {
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.model, 'destroy', this.remove);
                this.listenTo(this.model, 'remove', this.remove);
                // this.model.set("jiraUrl", Global.get("jiraUrl"));
                this.$el.attr("data-id", this.model.id);
                this.listenTo(this.model, 'scrollToThis', this.scrollToThis);
                this.listenTo(this.model, 'highlight', this.highlight);
                this.listenTo(this.model, 'cancel-highlight', this.cancelHighlight);
                this.listenTo(this.model, 'changing', this.changing);
                this.listenTo(this.model, 'changed', this.changed);
            },

            changing: function () {
                this.$el.addClass("changing");
            },

            changed: function () {
                this.$el.removeClass("changing");
            },

            getModelDetail: function () {
                if (this.model.get("description")) return this.viewDetail();

                this.model.fetch({data: {issueKey: this.model.id}})
                    .success(_.bind(this.viewDetail, this));
            },

            viewDetail: function () {
                Backbone.trigger("setModal", {
                    model: this.model,
                    template: _.template(DemandTemplate),
                    events: {},
                    initPlugins: function () {
                    }
                });
            },

            render: function () {
                this.$el.html(this.template(this.model.toJSON()));
                //for dom access
                // this.$el.css('background', this.model.get('highlight') ? 'yellow' : 'white')
                this.$el.data("model", this.model);
                return this;
            },

            clear: function () {
                this.model.destroy();
            },

            //置顶
            top: function () {
                var parent = this.$el.parent();
                var $this = this.$el;

                $this.detach();
                $this.prependTo(parent);
                parent.trigger('sortupdate', {
                    item: $this
                });
                return false;
            },

            //底
            bottom: function () {
                var parent = this.$el.parent();
                var $this = this.$el;

                $this.detach();
                $this.appendTo(parent);
                parent.trigger('sortupdate', {
                    item: $this
                });

                return false;
            },

            scrollToThis: function () {
                this.$el.closest('.task-list').scrollTo(this.$el, {
                    duration: 500
                });
            },

            highlight: function () {
                this.$el.addClass('highlight');
            },

            cancelHighlight: function () {
                this.$el.removeClass('highlight');
            }

        });
    });