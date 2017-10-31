/**
 * Created by fuyy on 2017/4/5.
 */
define([
        'views/list-demand-business-item',
        'text!templates/demand-pool-item.html',
        'views/modal-opt-split-demand-pool',
        'models/global'
    ],
    function (DemandView, Template, modalOptSplitDemand, Global) {
        return DemandView.extend({
            template: _.template(Template),
            
            getModelDetail: function (e) {
                this.model.fetch({data: {id: this.model.id, teamId: Global.get('team')}})
                    .done(this.viewDetail.bind(this));
                return false;
            },
            
            render: function () {
                DemandView.prototype.render.call(this);
                this.model.get('reqState') ? this.$el.addClass('disabled') : this.$el.removeClass('disabled');
                return this;
            },
            
            splitItem: function () {
                var jiraUrl = Global.defaults.jiraUrl;
                this.model.set('jiraUrl',jiraUrl)
                Backbone.trigger('setModal', modalOptSplitDemand(this.model));
                return false;
            }
            
        });
    });