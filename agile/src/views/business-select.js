define([
    'backbone',
    'collections/business',
    'collections/demand-business'
], function (Backbone, businessCollection, allDemand) {
    'use strict';
    return Backbone.View.extend({
        'el': '.businessSelect',
        events: {
            'click .glyphicon-pencil': 'editBusinessLine'
        },
        initialize: function () {
            this.$select = this.$('#business');
            this.$editSelectButton = this.$('.glyphicon');
            this.listenTo(businessCollection, 'sync', this.initialSelect);

            this.initialSelect();
        },

        initialSelect: function () {
            this.$select.select2({
                theme: 'bootstrap',
                width: '10em',
                placeholder: '请选择业务线',
                data: businessCollection.getSelect2Data()
            }).trigger('change');
        },


        editBusinessLine: function () {
            //todo
            //    弹出编辑任务线模态框
        }
    })
});