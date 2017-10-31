/**
 * Created by miaoym on 2017年5月2日
 */
define([
        'backbone',
        'jquery',
        'text!templates/modal-split-item.html',
        'common'
    ],
    function (Backbone, $, Template, Common) {
        var taskView = Backbone.View.extend({
            tagName: 'li',
            className: 'task-list-item split',
            template: _.template(Template),
            events: {
                "click": "viewDetail",
                "click .close": "destroy"
            },
            attributes: {
                "title-attribute": "subject"
            },
            
            initialize: function () {
                this.listenTo(this.model, 'change', _.debounce(this.render, 200));
                this.listenTo(this.model, 'filterSelected', this.filterSelected);
                this.listenTo(this.model, 'destroy', this.remove);
                this.unselected();
            },
            
            render: function () {
                this.$el.html(this.template(this.model));
                //for dom access
                this.$el.data("model", this.model);
                return this;
            },
            
            viewDetail: function () {
                this.model.trigger("view-item-detail", this.model);
                this.model.collection.invoke('trigger', 'filterSelected', this.model.cid);
                return false;
            },
            
            filterSelected: function (cid) {
                cid === this.model.cid ?
                    this.selected() :
                    this.unselected();
            },
            
            /**
             * View样式变为选中的样式
             */
            selected: function () {
                this.$el.css('background', Common.SELECTED_COLOR);
            },
            
            /**
             * View样式变为未选中的样式
             */
            unselected: function () {
                this.$el.css('background', Common.UNSELECTED_COLOR);
            },
            
            /**
             * 销毁Model以及View/DOM
             * @returns {boolean}
             */
            destroy: function () {
                this.model.destroy();
                return false;
            }
        });
        return taskView;
    });