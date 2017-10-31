/**
 * Created by fuyy on 2017/4/5.
 */
define([
        'backbone',
        'text!templates/task.html'
    ],
    function (Backbone, TaskTemplate) {

        var taskView = Backbone.View.extend({

            tagName: 'li',

            className: 'task-list-item',

            template: _.template(TaskTemplate),

            attributes: {
                "data-toggle": "modal",
                "data-target": "#taskDetail"
            },

            events: {"click": "transferDataToModal"},

            transferDataToModal: function () {
            },

            initialize: function () {
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.model, 'destroy', this.remove);
            },

            render: function () {
                this.$el.html(this.template(this.model.toJSON()));
                return this;
            },

            clear: function () {
                this.model.destroy();
            }
        });

        return taskView;
    });