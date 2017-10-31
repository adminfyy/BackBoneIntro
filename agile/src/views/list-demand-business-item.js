/**
 * Created by fuyy on 2017/4/5.
 */
define([
        'backbone',
        'text!templates/demand-big.html',
        'common',
        'views/modal-opt-demand',
        'views/modal-opt-split-demand-business',
        'models/global'
    ],
    function (Backbone, Template, Common, modalOpt, modalOptSplitDemand, Global) {
        'use strict';
        return Backbone.View.extend({
            tagName: 'li',
            className: 'task-list-item one-line',
            template: _.template(Template),
            events: {
                "click": "getModelDetail",
                "click .child-toggle": "toggleHandle",
                'click [role=split]': 'splitItem',
                'click [role=delete]': 'deleteItem',
                "click .fa-angle-double-down": "bottom",
                "click .fa-angle-double-up": "top"
            },

            getModelDetail: function (e) {
                this.model.fetch({data: {id: this.model.id}})
                    .done(this.viewDetail.bind(this));
                return false;
            },

            initialize: function () {
                this.listenTo(this.model, 'change', _.debounce(this.render, 200));
                this.listenTo(this.model, 'destroy', this.remove);
                this.listenTo(this.model, 'remove', this.remove);
                this.listenToOnce(this.model.childs, 'reset', _.debounce(this.loadChild, 400));
                this.listenTo(this.model, 'scrollToThis', this.scrollToThis);
                this.listenTo(this.model, 'highlight', this.highlight);
                this.listenTo(this.model, 'cancel-highlight', this.cancelHighlight);
                this.listenTo(this.model, 'position-changed', this.positionChange);
                this.listenTo(this.model, 'hide', this.hide);
                this.listenTo(this.model, 'show', this.show);
                //加载子节点
                this.loadChildren();
            },

            hide: function () {
                this.$el.hide();
                this.model.childs && this.model.childs.invoke('trigger', 'hide');
            },

            show: function () {
                this.$el.show();
            },

            viewDetail: function () {
                Backbone.trigger("setModal", modalOpt({
                    model: this.model
                }));
                return this;
            },

            render: function () {
                this.$el.html(this.template(this.model.toJSON()));
                this.$el.data("model", this.model);
                this.$childHandle = this.$('.child-toggle');
                this.$('[data-toggle]').dropdown();
                return this;
            },

            clear: function () {
                this.model.destroy();
            },

            //展开/收缩点击事件处理
            toggleHandle: function () {
                if (this.$el.hasClass('child-loaded')) {
                    if (this.$el.hasClass('children-open')) {
                        this.collapse();
                    } else {
                        this.expand();
                    }
                } else {
                    this.loadChildren();
                }
                return false;
            },

            loadChildren: function () {
                this.model.childs && this.model.childs.query();
            },

            loadChild: function () {
                this.$el.addClass('child-loaded');
                this.model.childs.each(this.loadOneChild, this);
            },

            loadOneChild: function (model) {
                var $el = new this.constructor({
                    model: model,
                    attributes: {
                        "level": (this.attributes && this.attributes.level || 0) + 1,
                        "child": true
                    }
                }).render().$el;
                $el
                    .hide()
                    .insertAfter(this.$el)
            },

            collapse: function () {
                this.$el.removeClass('children-open');
                this.model.childs.invoke('trigger', 'hide');
            },

            expand: function () {
                this.$el.addClass('children-open');
                this.model.childs.invoke('trigger', 'show');
            },

            positionChange: function ($father) {
                //保持子节点跟随在父节点附近
                if ($father) this.$el.insertAfter($father);
                this.model.childs && this.model.childs.invoke('trigger', 'position-changed', this.$el);
            },

            splitItem: function () {
                var jiraUrl = Global.defaults.jiraUrl;
                this.model.set('jiraUrl', jiraUrl)
                Backbone.trigger('setModal', modalOptSplitDemand(this.model));
                return false;
            },

            deleteItem: function () {
                this.model.deleteItem();
                return false;
            },

            top: function () {
                var parent = this.$el.parent();
                var $this = this.$el;

                if (!$this.attr('child')) {
                    $this.detach();
                    $this.prependTo(parent);
                    parent.trigger('sortupdate', {
                        item: $this
                    });
                } else {
                    layer.msg('只有一级需求可以排序');
                }
                return false;
            },

            //底
            bottom: function () {
                var parent = this.$el.parent();
                var $this = this.$el;

                if (!$this.attr('child')) {
                    $this.detach();
                    $this.appendTo(parent);
                    parent.trigger('sortupdate', {
                        item: $this
                    });
                } else {
                    layer.msg('只有一级需求可以排序');
                }
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