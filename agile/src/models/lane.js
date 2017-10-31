/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone'
], function (Backbone) {
    'use strict';
    /*{
        "IsEdit":0,
        "pos":10,
        "name":"需求就绪2",
        "smBoardId":1,
        "description":"已就绪的当前迭代需求",
        "IsDone":0,
        "id":1,
        "state":"需求就绪",
        "type":10
        } */
    var base = Backbone.Model.extend({
        defaults: {
            'id': null,
            'IsDone': 0,
            'IsEdit': 1,
            'name': '',
            'smBoardId': '',
            'dod': ''
        },

        urlMap: {
            'create': rootPath + '/boardLane/addBoardLane.shtml',
            'delete': rootPath + '/boardLane/deleteBoardLane.shtml',
            'update': rootPath + '/boardLane/editBoardLane.shtml'
        },

        //删除
        destroy: function () {
            var model = this;
            var options = {
                data: {
                    id: this.id
                },
                //Backbone默认destory方法会 不转换data成为json
                type: 'GET',
                processData: true,
                wait: true
            };
            return Backbone.Model.prototype.destroy.call(this, options);
        },

        resFilter: function (res) {
            if(!res['success']){
                layer.msg(res['msg']);
                return null
            }
            return res['boardLaneInfo']
        }
    });

    return base;
});