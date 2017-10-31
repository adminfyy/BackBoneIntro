/**
 * Created by fuyy on 2017/3/28.
 */
define([
        'backbone',
        'jquery'
    ],
    function (Backbone, $) {
        'use strict';

        //window.secretUserId 当前登录用户的ID
        var GlobalModel = Backbone.Model.extend({
            //all the defaults come from localStorage
            defaults: function () {
                var defaults = {};
                var keys = [ "team", "board", "currVer" ];
                keys.forEach(function (key) {
                    defaults[ key ] = JSON.parse(localStorage.getItem(window.secretUserId + key));
                });
                defaults.name = window.secretUserId + '-global-model';
                // jira正式环境
                defaults.jiraUrl = "http://jira.ourplat.net";
                // jira测试环境
                // defaults.jiraUrl = "http://10.8.198.8:8080";
                return defaults;
            }(this),
            
            getSprintInfo: function () {
                $.get(rootPath + "/sprint/getCurrentSprint.shtml", {teamId: this.get('team')})
                    .done(function (data) {
                        //修复 服务端没有返回值的bug
                        data || ( data = JSON.stringify({
                            _t: Date.now()
                        }));
                        this.set("sprintInfo", JSON.parse(data));
                        
                        this.getBurnDownInfo();
                    }.bind(this));
            },
            //迭代是否进行中
            isSprintRunning: function () {
                var sprintInfo = this.get('sprintInfo');
                
                if (!sprintInfo) return false;
                if (sprintInfo.state == 1) return true;
                
                return false;
            },
            //迭代是否关闭
            isSprintClose: function () {
                var sprintInfo = this.get('sprintInfo');
                
                if (!sprintInfo) return false;
                if (sprintInfo.state == 2) return true;
                
                return false;
            },
            
            //获取燃尽图信息
            getBurnDownInfo: function () {
                
                if (!this.get('sprintInfo')) {
                    setTimeout(this.getBurnDownInfo.bind(this), 500);
                    return;
                }
                this.getBurndownList();
                this.getTotalStoryNum();
            },
            
            getBurndownList: function () {
                var burdownUrl = "sprintBurnout/srpintBurnoutLists.shtml";
                $.get(burdownUrl, {smSprintId: this.get('sprintInfo').id},
                    function (data) {
                        //修复 服务端没有返回值的bug
                        if (typeof data === 'undefined') ( data = {_t: Date.now()});
                        this.set("burnDownList", data);
                    }.bind(this), 'json');
                
            },
            
            getTotalStoryNum: function () {
                $.get("sprint/getTotalStoryNumOfSprintId.shtml", {smSprintId: this.get('sprintInfo').id},
                    function (data) {
                        //修复 服务端没有返回值的bug
                        if (typeof data === 'undefined') ( data = 0);
                        this.set("burnDownTotal", data);
                    }.bind(this), 'json');
            },
            
            //调用Global.set时，同时持久到localstorage
            set: function (key, val, options) {
                if (key == null) return this;
                // Handle both `"key", value` and `{key: value}` -style arguments.
                var attrs;
                if (typeof key === 'object') {
                    attrs = key;
                    options = val;
                } else {
                    (attrs = {})[ key ] = val;
                }
                var preFixed = window.secretUserId;
                Object.keys(attrs).forEach(function (value) {
                    localStorage.setItem(preFixed + value, JSON.stringify(attrs[ value ] || ''));
                });
                return Backbone.Model.prototype.set.apply(this, arguments);
            }
        });
        
        var instance = new GlobalModel();
        instance.listenTo(instance, 'change:team', instance.getSprintInfo);
        return instance;
    });