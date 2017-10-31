/* 团队管理看板
 * 团队列表容器View */
define([
    "backbone",
    "text!templates/addTeam.html",
    'views/modal-opt-team',
    "models/team"
], function (Backbone, template, TeamModalOpt, team) {

    //添加团队的添加按钮

    return Backbone.View.extend({

        tagName: 'a',

        className: 'list-group-item addTeam',

        template: _.template(template),
        
        events: {
            "click" : "showAddTeamModal"
        },

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function () {
            this.$el
                .empty()
                .append(this.template());

            return this;
        },

        showAddTeamModal: function () {
            Backbone.trigger('setModal',TeamModalOpt(
                new team()
            ))
        }
    })
})